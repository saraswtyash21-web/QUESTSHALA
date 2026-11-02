import { REWARDS_CONFIG, type RankName } from "./config";
import type { Activity, RewardLedgerEntry, RewardsState } from "../types";

export const emptyRewards: RewardsState = { ledger: [], bestRank: "None" };

export function getPointsBalance(ledger: RewardLedgerEntry[]): number {
  return ledger.filter((entry) => entry.type === "points").reduce((total, entry) => total + entry.amount, 0);
}

export function getLevelFromXp(xp: number): number {
  let level = 1;
  let remaining = Math.max(0, xp);
  while (remaining >= Math.round(REWARDS_CONFIG.level.base * level ** REWARDS_CONFIG.level.exponent)) {
    remaining -= Math.round(REWARDS_CONFIG.level.base * level ** REWARDS_CONFIG.level.exponent);
    level += 1;
  }
  return level;
}

export function xpToNextLevel(xp: number) {
  let remaining = Math.max(0, xp);
  let level = 1;
  while (remaining >= Math.round(REWARDS_CONFIG.level.base * level ** REWARDS_CONFIG.level.exponent)) {
    remaining -= Math.round(REWARDS_CONFIG.level.base * level ** REWARDS_CONFIG.level.exponent);
    level += 1;
  }
  const required = Math.round(REWARDS_CONFIG.level.base * level ** REWARDS_CONFIG.level.exponent);
  return { level, currentXp: remaining, required, remainingXp: required - remaining, progressPercent: Math.round(remaining / required * 100) };
}

export function getRank(days: number): { name: RankName | "Unranked"; daysToNext: number | null } {
  const attained = [...REWARDS_CONFIG.ranks].reverse().find((rank) => days >= rank.days);
  const next = REWARDS_CONFIG.ranks.find((rank) => days < rank.days);
  return { name: attained?.name ?? "Unranked", daysToNext: next ? next.days - days : null };
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentStreak(activities: Activity[], ledger: RewardLedgerEntry[], now = new Date()): number {
  const completed = new Set(activities.map((activity) => localDateKey(new Date(activity.date))));
  const frozen = new Set(ledger.filter((entry) => entry.type === "freeze" && entry.amount < 0).map((entry) => entry.sourceId));
  let freezeInventory = Math.max(0,
    ledger.filter((entry) => entry.type === "freeze" && entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0) -
    ledger.filter((entry) => entry.type === "freeze" && entry.amount < 0).length,
  );
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!completed.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  for (let checked = 0; checked < 366; checked += 1) {
    const key = localDateKey(cursor);
    if (completed.has(key)) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (frozen.has(key)) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    const previousDay = new Date(cursor);
    previousDay.setDate(previousDay.getDate() - 1);
    const previousKey = localDateKey(previousDay);
    if (freezeInventory > 0 && (completed.has(previousKey) || frozen.has(previousKey))) {
      freezeInventory -= 1;
      count += 1;
      frozen.add(key);
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }
  return count;
}

function makeEntry(type: RewardLedgerEntry["type"], amount: number, reason: string, sourceId: string, idempotencyKey: string): RewardLedgerEntry {
  return { id: crypto.randomUUID(), type, amount, reason, sourceId, timestamp: new Date().toISOString(), idempotencyKey };
}

function addOnce(ledger: RewardLedgerEntry[], entry: RewardLedgerEntry): RewardLedgerEntry[] {
  if (ledger.some((item) => item.idempotencyKey === entry.idempotencyKey)) return ledger;
  return [...ledger, entry];
}

function recordFreezeUses(rewards: RewardsState, activities: Activity[], now: Date): RewardsState {
  const completed = new Set(activities.map((activity) => localDateKey(new Date(activity.date))));
  const latest = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!completed.has(localDateKey(latest))) latest.setDate(latest.getDate() - 1);
  let inventory = Math.max(0,
    rewards.ledger.filter((entry) => entry.type === "freeze" && entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0) -
    rewards.ledger.filter((entry) => entry.type === "freeze" && entry.amount < 0).length,
  );
  const ledger = [...rewards.ledger];
  for (let checked = 0; checked < 366; checked += 1) {
    const key = localDateKey(latest);
    if (completed.has(key)) {
      latest.setDate(latest.getDate() - 1);
      continue;
    }
    const previousDay = new Date(latest);
    previousDay.setDate(previousDay.getDate() - 1);
    if (!completed.has(localDateKey(previousDay)) || inventory <= 0) break;
    if (!ledger.some((entry) => entry.type === "freeze" && entry.sourceId === key)) {
      ledger.push(makeEntry("freeze", -1, "Streak freeze used", key, `freeze-use:${key}`));
      inventory -= 1;
    }
    latest.setDate(latest.getDate() - 1);
  }
  return { ...rewards, ledger };
}

export function awardActivity(rewards: RewardsState, activities: Activity[], activity: Activity, userId: string): RewardsState {
  const next = { ...rewards, ledger: [...rewards.ledger] };
  const date = localDateKey(new Date(activity.date));
  const isTimedTest = activity.title.toLowerCase().includes("timed test");
  const completion = isTimedTest ? "test" : activity.kind === "lesson" ? "lesson" : activity.kind === "quiz" ? "quiz" : "task";
  const scoreFactor = Math.max(0, Math.min(1, (activity.score ?? 100) / 100));
  const difficulty = activity.difficulty ?? (activity.title.toLowerCase().includes("challenge") ? "Challenge" : activity.title.toLowerCase().includes("starter") ? "Starter" : "Standard");
  const multiplier = difficulty === "Challenge" ? 1.3 : difficulty === "Starter" ? 0.8 : 1;
  const completedOnDate = activities.filter((item) => localDateKey(new Date(item.date)) === date);
  const lessonRepeatsToday = completedOnDate.filter((item) => item.kind === "lesson" && item.topic === activity.topic).length;
  const lessonRepeatAwardsToday = next.ledger.filter((item) => item.type === "xp" && item.idempotencyKey.startsWith(`lesson-repeat:${activity.topic}:${date}:`)).length;
  const priorQuizCount = next.ledger.filter((item) => item.type === "points" && item.idempotencyKey.startsWith(`points-quiz:${date}:${activity.topic}:`)).length;
  const xpQuizCount = next.ledger.filter((item) => item.type === "xp" && item.idempotencyKey.startsWith(`xp-quiz:${activity.topic}:${date}:`)).length;
  const repeatIndex = Math.min(priorQuizCount, REWARDS_CONFIG.points.maxQuizAwardsPerTopicPerDay - 1);
  const quizMultiplier = REWARDS_CONFIG.points.quizRepeatMultipliers[repeatIndex] ?? 0;
  const xpMultiplier = REWARDS_CONFIG.xp.quizRepeatMultipliers[Math.min(xpQuizCount, REWARDS_CONFIG.xp.quizRepeatMultipliers.length - 1)] ?? 0;
  let xp = completion === "lesson"
    ? next.ledger.some((item) => item.idempotencyKey === `lesson-first:${userId}:${activity.topic}`)
      ? lessonRepeatsToday === 0 ? 0 : REWARDS_CONFIG.xp.lessonRepeat
      : REWARDS_CONFIG.xp.lessonFirst
    : completion === "test" ? Math.round(REWARDS_CONFIG.xp.testBase * scoreFactor * multiplier)
      : completion === "quiz" ? Math.round(REWARDS_CONFIG.xp.quizBase * scoreFactor * xpMultiplier)
        : REWARDS_CONFIG.xp.task;
  const xpDateTotal = next.ledger.filter((item) => item.type === "xp" && localDateKey(new Date(item.timestamp)) === date).reduce((sum, item) => sum + item.amount, 0);
  xp = Math.max(0, Math.min(xp, REWARDS_CONFIG.xp.dailyCap - xpDateTotal));
  if (xp > 0) {
    const idempotencyKey = completion === "lesson"
      ? next.ledger.some((item) => item.idempotencyKey === `lesson-first:${userId}:${activity.topic}`)
        ? `lesson-repeat:${activity.topic}:${date}:${activity.id}`
        : `lesson-first:${userId}:${activity.topic}`
      : completion === "quiz" ? `xp-quiz:${activity.topic}:${date}:${activity.id}` : `xp-${completion}:${activity.topic}:${date}:${activity.id}`;
    if ((completion !== "quiz" || xpQuizCount < REWARDS_CONFIG.xp.maxQuizAwardsPerTopicPerDay) &&
      (completion !== "lesson" || !next.ledger.some((item) => item.idempotencyKey === `lesson-first:${userId}:${activity.topic}`) || lessonRepeatAwardsToday < REWARDS_CONFIG.xp.maxLessonRepeatAwardsPerDay)) {
      next.ledger = addOnce(next.ledger, makeEntry("xp", xp, `${completion} completed`, activity.id, idempotencyKey));
    }
  }

  if (completion === "lesson" && !next.ledger.some((item) => item.idempotencyKey === `lesson-points:${userId}:${activity.topic}`)) {
    next.ledger = addOnce(next.ledger, makeEntry("points", REWARDS_CONFIG.points.lessonFirst, "First lesson completion", activity.topic, `lesson-points:${userId}:${activity.topic}`));
  } else if (completion === "quiz" && priorQuizCount < REWARDS_CONFIG.points.maxQuizAwardsPerTopicPerDay) {
    const amount = Math.round(REWARDS_CONFIG.points.quizBase * scoreFactor * quizMultiplier);
    const dailyTotal = next.ledger.filter((item) => item.type === "points" && item.amount > 0 && item.idempotencyKey.startsWith(`points-quiz:${date}:`)).reduce((sum, item) => sum + item.amount, 0);
    const awarded = Math.max(0, Math.min(amount, REWARDS_CONFIG.points.dailyQuizCap - dailyTotal));
    if (awarded > 0) next.ledger = addOnce(next.ledger, makeEntry("points", awarded, "Quiz completed", activity.id, `points-quiz:${date}:${activity.topic}:${activity.id}`));
  } else if (completion === "test") {
    const amount = Math.round(REWARDS_CONFIG.points.testBase * scoreFactor * multiplier);
    const dailyTotal = next.ledger.filter((item) => item.type === "points" && item.amount > 0 && item.idempotencyKey.startsWith(`points-test:${date}:`)).reduce((sum, item) => sum + item.amount, 0);
    const awarded = Math.max(0, Math.min(amount, REWARDS_CONFIG.points.dailyTestCap - dailyTotal));
    if (awarded > 0) next.ledger = addOnce(next.ledger, makeEntry("points", awarded, "Timed test completed", activity.id, `points-test:${date}:${activity.id}`));
  }

  if (completedOnDate.length + 1 >= REWARDS_CONFIG.dailyGoalActivities && !next.ledger.some((item) => item.idempotencyKey === `daily-goal:${userId}:${date}`)) {
    const earnedToday = next.ledger.filter((item) => item.type === "xp" && localDateKey(new Date(item.timestamp)) === date).reduce((sum, item) => sum + item.amount, 0);
    const dailyGoalXp = Math.max(0, Math.min(REWARDS_CONFIG.xp.dailyGoal, REWARDS_CONFIG.xp.dailyCap - earnedToday));
    if (dailyGoalXp > 0) next.ledger = addOnce(next.ledger, makeEntry("xp", dailyGoalXp, "Daily learning goal completed", date, `daily-goal:${userId}:${date}`));
  }
  const withFreezeUse = recordFreezeUses(next, [...activities, activity], new Date(activity.date));
  next.ledger = withFreezeUse.ledger;
  const streak = getCurrentStreak([...activities, activity], next.ledger, new Date(activity.date));
  const rank = getRank(streak);
  const rankIndex = REWARDS_CONFIG.ranks.findIndex((item) => item.name === rank.name);
  const bestIndex = REWARDS_CONFIG.ranks.findIndex((item) => item.name === next.bestRank);
  if (rankIndex > bestIndex) next.bestRank = rank.name;
  return next;
}

export function claimDailyLogin(rewards: RewardsState, userId: string, now = new Date()): RewardsState | null {
  if (!userId) return null;
  const date = localDateKey(now);
  const key = `login:${userId}:${date}`;
  if (rewards.ledger.some((entry) => entry.idempotencyKey === key)) return null;
  const previousDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterday = localDateKey(previousDate);
  const wasClaimedYesterday = rewards.ledger.some((entry) => entry.type === "points" && entry.idempotencyKey === `login:${userId}:${yesterday}`);
  let cycleIndex = 0;
  if (wasClaimedYesterday) {
    for (let day = 2; day <= REWARDS_CONFIG.points.loginCycle.length; day += 1) {
      const previousClaimDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      if (!rewards.ledger.some((entry) => entry.type === "points" && entry.idempotencyKey === `login:${userId}:${localDateKey(previousClaimDate)}`)) break;
      cycleIndex = day - 1;
    }
  }
  const amount = REWARDS_CONFIG.points.loginCycle[cycleIndex] ?? REWARDS_CONFIG.points.loginCycle[0];
  return { ...rewards, ledger: [...rewards.ledger, makeEntry("points", amount, `Daily login reward · day ${cycleIndex + 1}`, date, key)] };
}

export function spendPoints(rewards: RewardsState, amount: number, reason: string, sourceId: string, idempotencyKey: string): RewardsState | null {
  if (!Number.isFinite(amount) || amount <= 0 || getPointsBalance(rewards.ledger) < amount) return null;
  if (rewards.ledger.some((item) => item.idempotencyKey === idempotencyKey)) return rewards;
  return { ...rewards, ledger: [...rewards.ledger, makeEntry("points", -amount, reason, sourceId, idempotencyKey)] };
}

export function purchaseStreakFreeze(rewards: RewardsState, userId: string): RewardsState | null {
  const spent = spendPoints(rewards, REWARDS_CONFIG.points.streakFreezeCost, "Streak freeze purchased", userId, `freeze-purchase:${userId}:${crypto.randomUUID()}`);
  if (!spent) return null;
  return { ...spent, ledger: [...spent.ledger, makeEntry("freeze", 1, "Streak freeze added to inventory", userId, `freeze-inventory:${crypto.randomUUID()}`)] };
}
