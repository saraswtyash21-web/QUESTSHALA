import { Link } from "react-router-dom";
import { Award, Check, Flame, Palette, Sparkles, Star, UserRound } from "lucide-react";
import { REWARDS_CONFIG, SHOP_COSMETICS, type ShopAvatarId, type ShopCosmeticId, type ShopSkinId } from "./rewards/config";
import { buddies } from "./data";
import { BuddyPortrait } from "./components/BuddyPortrait";
import { getCurrentStreak, getPointsBalance, getRank, xpToNextLevel } from "./rewards/engine";
import type { Activity, BuddyId, RewardsState, StudentProfile } from "./types";

function totalXp(rewards: RewardsState): number {
  return rewards.ledger.filter((entry) => entry.type === "xp").reduce((sum, entry) => sum + entry.amount, 0);
}

export function RewardsPage({ rewards, activities }: { rewards: RewardsState; activities: Activity[] }) {
  const xp = totalXp(rewards);
  const level = xpToNextLevel(xp);
  const streak = getCurrentStreak(activities, rewards.ledger);
  const rank = getRank(streak);
  const points = getPointsBalance(rewards.ledger);
  return (
    <>
      <header className="page-title"><div><span className="eyebrow">YOUR LEARNING REWARDS</span><h1>Levels, ranks &amp; Points</h1><p>XP comes from learning. Your streak earns a rank. Points are the spendable balance.</p></div></header>
      <section className="rewards-summary-grid">
        <article className="panel reward-summary-card">
          <span className="reward-symbol"><Star size={20} /></span><div><span>LEVEL {level.level}</span><strong>{xp} XP</strong><small>{level.currentXp} / {level.required} XP to next level</small></div>
          <div className="reward-progress" role="progressbar" aria-label="Progress to next level" aria-valuemin={0} aria-valuemax={level.required} aria-valuenow={level.currentXp}><span style={{ width: `${level.progressPercent}%` }} /></div>
        </article>
        <article className="panel reward-summary-card">
          <span className="reward-symbol"><Award size={20} /></span><div><span>STREAK RANK</span><strong>{rank.name}</strong><small>{streak} learning {streak === 1 ? "day" : "days"} · {rank.daysToNext === null ? "Top rank reached" : `${rank.daysToNext} days to next rank`}</small></div>
        </article>
        <article className="panel reward-summary-card">
          <span className="reward-symbol"><span aria-hidden="true">P</span></span><div><span>SPENDABLE BALANCE</span><strong>{points} Points</strong><small>Use Points in the Shop. XP is never spent.</small></div><Link className="btn outline" to="/shop">Visit Shop</Link>
        </article>
      </section>
      <section className="panel rank-ladder">
        <div className="panel-head"><h2>Rank ladder</h2><span className="tag">Best rank: {rewards.bestRank}</span></div>
        <ol>{REWARDS_CONFIG.ranks.map((item) => <li className={streak >= item.days ? "attained" : ""} key={item.name} aria-current={rank.name === item.name ? "step" : undefined}><span className="rank-seal" aria-hidden="true"><Award size={18} /></span><strong>{item.name}</strong><span>{item.days}+ learning days</span>{rank.name === item.name && <span className="rank-current">Current</span>}</li>)}</ol>
      </section>
      <section className="panel points-ledger">
        <div className="panel-head"><h2>Points history</h2><Link className="text-link" to="/shop">Open Shop →</Link></div>
        {rewards.ledger.filter((item) => item.type === "points").length
          ? <ul>{[...rewards.ledger].filter((item) => item.type === "points").reverse().map((entry) => <li key={entry.id}><div><strong>{entry.reason}</strong><small>{new Date(entry.timestamp).toLocaleString()}</small></div><span className={entry.amount < 0 ? "spent" : "earned"}>{entry.amount > 0 ? "+" : ""}{entry.amount} Points</span></li>)}</ul>
          : <p className="empty-state">Points history will appear after a lesson, quiz, test, or daily reward.</p>}
      </section>
      <section className="panel points-ledger">
        <div className="panel-head"><h2>XP history</h2><span className="tag">{xp} XP total</span></div>
        {rewards.ledger.filter((item) => item.type === "xp").length
          ? <ul>{[...rewards.ledger].filter((item) => item.type === "xp").reverse().map((entry) => <li key={entry.id}><div><strong>{entry.reason}</strong><small>{new Date(entry.timestamp).toLocaleString()}</small></div><span className="earned">+{entry.amount} XP</span></li>)}</ul>
          : <p className="empty-state">XP history will appear when you finish a task, lesson, quiz, test, or daily goal.</p>}
      </section>
      <p className="micro-copy">Reward ledger is currently stored on this device. Secure cross-device rewards for signed-in accounts need the backend migration before they can sync.</p>
    </>
  );
}

export function ShopPage({ rewards, profile, onBuyFreeze, skin, avatar, onPurchase, onEquipSkin, onEquipAvatar, onSelectBuddy }: {
  rewards: RewardsState;
  profile: StudentProfile;
  onBuyFreeze: () => void;
  skin: ShopSkinId;
  avatar: ShopAvatarId;
  onPurchase: (itemId: ShopCosmeticId) => void;
  onEquipSkin: (skin: ShopSkinId) => void;
  onEquipAvatar: (avatar: ShopAvatarId) => void;
  onSelectBuddy: (buddyId: BuddyId) => void;
}) {
  const points = getPointsBalance(rewards.ledger);
  const freezeInventory = rewards.ledger.filter((item) => item.type === "freeze").reduce((sum, item) => sum + item.amount, 0);
  const owned = new Set(rewards.ledger.filter((item) => item.idempotencyKey.startsWith("shop-cosmetic:")).map((item) => item.idempotencyKey.slice("shop-cosmetic:".length)));
  return (
    <>
      <header className="page-title"><div><span className="eyebrow">POINTS SHOP</span><h1>Make your learning space yours</h1><p>Unlock companion frames and calm, readable themes with Points earned through learning.</p></div><span className="tag">{points} Points</span></header>
      <section className="shop-cosmetic-section">
        <div className="section-heading"><h2><Palette size={20} /> Study themes</h2><span className="tag">Active: {skin === "default" ? "QuestShala" : SHOP_COSMETICS.find((item) => "skin" in item && item.skin === skin)?.name}</span></div>
        <div className="shop-cosmetic-grid">
          <article className="panel shop-cosmetic-card theme-preview-default"><ThemePreview skin="default" /><div><span className="eyebrow">FREE · ALWAYS AVAILABLE</span><h3>QuestShala classroom</h3><p>Return to the colors chosen for your class band.</p></div><button className="btn outline" disabled={skin === "default"} onClick={() => onEquipSkin("default")}>{skin === "default" ? <><Check size={16} /> Active</> : "Reset theme"}</button></article>
          {SHOP_COSMETICS.filter((item) => "skin" in item).map((item) => {
            const isOwned = owned.has(item.id);
            const isActive = skin === item.skin;
            return <article className={`panel shop-cosmetic-card theme-preview-${item.skin}`} key={item.id}><ThemePreview skin={item.skin} /><div><span className="eyebrow">STUDY THEME</span><h3>{item.name}</h3><p>{item.description}</p></div><button className={`btn ${isOwned ? "outline" : "violet"}`} disabled={isActive || (!isOwned && points < item.cost)} onClick={() => isOwned ? onEquipSkin(item.skin) : onPurchase(item.id)}>{isActive ? <><Check size={16} /> Active</> : isOwned ? "Apply theme" : `${item.cost} Points`}</button></article>;
          })}
        </div>
      </section>
      <section className="shop-cosmetic-section">
        <div className="section-heading"><h2><UserRound size={20} /> Buddy frames</h2><span className="tag">Active: {avatar === "default" ? "Classic" : avatar}</span></div>
        <div className="shop-cosmetic-grid avatar-cosmetic-grid">
          {SHOP_COSMETICS.filter((item) => "avatar" in item).map((item) => {
            const isOwned = owned.has(item.id);
            const isActive = avatar === item.avatar;
            return <article className={`panel shop-cosmetic-card avatar-preview-${item.avatar}`} key={item.id}><div className={`cosmetic-preview avatar-cosmetic-preview frame-${item.avatar}`}><BuddyPortrait buddyId={profile.buddy} label={buddies.find((buddy) => buddy.id === profile.buddy)?.label ?? "Learning buddy"} /><Sparkles size={14} /></div><div><span className="eyebrow">BUDDY FRAME</span><h3>{item.name}</h3><p>{item.description}</p></div><button className={`btn ${isOwned ? "outline" : "violet"}`} disabled={isActive || (!isOwned && points < item.cost)} onClick={() => isOwned ? onEquipAvatar(item.avatar) : onPurchase(item.id)}>{isActive ? <><Check size={16} /> Equipped</> : isOwned ? "Equip frame" : `${item.cost} Points`}</button></article>;
          })}
        </div>
      </section>
      <section className="shop-cosmetic-section">
        <div className="section-heading"><h2><UserRound size={20} /> Learning buddies</h2><span className="tag">Active: {buddies.find((buddy) => buddy.id === profile.buddy)?.label ?? "Beerus"}</span></div>
        <p className="shop-buddy-intro">Pick the voice and personality you want beside you. Every buddy is available; your choice is saved with your profile.</p>
        <div className="shop-buddy-grid">
          {buddies.map((buddy) => <article className={`panel shop-buddy-card ${profile.buddy === buddy.id ? "is-selected" : ""}`} key={buddy.id}>
            <div className="shop-buddy-portrait"><BuddyPortrait buddyId={buddy.id} label={buddy.label} /></div>
            <div><h3>{buddy.label}</h3><p>{buddy.style}</p></div>
            <button className="btn outline" type="button" disabled={profile.buddy === buddy.id} onClick={() => onSelectBuddy(buddy.id)}>{profile.buddy === buddy.id ? <><Check size={16} /> Selected</> : "Choose buddy"}</button>
          </article>)}
        </div>
      </section>
      <section className="panel shop-item">
        <span className="shop-item-icon"><Flame size={24} /></span>
        <div><span className="eyebrow">STREAK SUPPORT</span><h2>Streak freeze</h2><p>Keep one missed learning day from breaking your current streak. One freeze covers one missed day.</p><small>In your inventory: {freezeInventory}</small></div>
        <button className="btn violet" type="button" disabled={points < REWARDS_CONFIG.points.streakFreezeCost} onClick={onBuyFreeze}>Buy for {REWARDS_CONFIG.points.streakFreezeCost} Points</button>
      </section>
      <p className="micro-copy">An earned freeze is applied automatically if one missed day separates two completed learning days. Rank still comes from dated activity.</p>
    </>
  );
}

function ThemePreview({ skin }: { skin: ShopSkinId | "default" }) {
  return <div className={`theme-preview-screen preview-skin-${skin}`} aria-hidden="true">
    <aside><span>Q</span><i /><i /><i /></aside>
    <div className="theme-preview-content"><b>My learning path</b><span>Class · Topic · Progress</span><div><i /><i /><i /></div><small>Today's next step</small></div>
    <span className="theme-preview-swatch" />
  </div>;
}

export function DailyRewardCard({ sessionUserId, rewards, onClaim }: { sessionUserId: string | null; rewards: RewardsState; onClaim: () => void }) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const claimed = rewards.ledger.some((entry) => entry.idempotencyKey === `login:${sessionUserId}:${todayKey}`);
  return (
    <section className="panel daily-reward-card">
      <span className="reward-symbol"><Star size={20} /></span>
      <div><span className="eyebrow">DAILY CHECK-IN</span><h2>{claimed ? "Today's reward is claimed" : "Claim today's reward"}</h2><p>{sessionUserId ? "A small reward for signing in today. The 7-day cycle starts fresh if you take a break." : "Daily login rewards are available when you are signed in, not in guest demo mode."}</p></div>
      <button className="btn violet" type="button" disabled={!sessionUserId || claimed} onClick={onClaim}>{claimed ? "Claimed" : "Claim today's reward"}</button>
    </section>
  );
}

export function RewardsMini({ rewards, activities }: { rewards: RewardsState; activities: Activity[] }) {
  const progress = xpToNextLevel(totalXp(rewards));
  const level = progress.level;
  const streak = getCurrentStreak(activities, rewards.ledger);
  const rank = getRank(streak);
  return <span className="rewards-mini" aria-label={`Level ${level}, ${rank.name} rank, ${streak} day streak, ${getPointsBalance(rewards.ledger)} Points`}>
    <span className="rewards-level-mini"><b>LV {level}</b><span className="top-xp-progress" role="progressbar" aria-label={`XP progress ${progress.currentXp} of ${progress.required}`} aria-valuemin={0} aria-valuemax={progress.required} aria-valuenow={progress.currentXp}><i style={{ width: `${progress.progressPercent}%` }} /></span></span>
    <span className="top-rank-mini"><Award size={14} /> {rank.name}</span>
    <span><Flame size={14} /> {streak}</span>
    <span>{getPointsBalance(rewards.ledger)} P</span>
  </span>;
}

export function ProfileRewardsSummary({ rewards, activities, profile }: { rewards: RewardsState; activities: Activity[]; profile: StudentProfile }) {
  const level = xpToNextLevel(totalXp(rewards));
  const streak = getCurrentStreak(activities, rewards.ledger);
  const rank = getRank(streak);
  return <section className="panel profile-rewards-summary">
    <div><span className="eyebrow">{profile.grade <= 5 ? "YOUR LEARNING LEVEL" : "LEVEL & RANK"}</span><h2>Level {level.level} · {rank.name}</h2><p>{totalXp(rewards)} XP earned · {streak} learning {streak === 1 ? "day" : "days"} · Best rank: {rewards.bestRank}{rank.daysToNext === null ? "" : ` · ${rank.daysToNext} days to next rank`}</p></div>
    <div className="reward-progress" role="progressbar" aria-label="Progress to next level" aria-valuemin={0} aria-valuemax={level.required} aria-valuenow={level.currentXp}><span style={{ width: `${level.progressPercent}%` }} /></div>
    <p>{level.currentXp} / {level.required} XP to the next level. Learning content is never locked by level.</p>
  </section>;
}
