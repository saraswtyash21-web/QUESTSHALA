import { Link } from "react-router-dom";
import {
  Award, BookOpen, Castle, Compass, FlaskConical, Flower2, LibraryBig,
  Map, NotebookPen, ScrollText, Shield, ShoppingBag, Sparkles, Swords,
} from "lucide-react";
import { CompanionAvatar } from "./CompanionAvatar";
import { getLearningCharacter } from "./characters";
import type { Activity, RewardsState, StudentProfile } from "./types";
import { curriculum, type TopicContent } from "./data";
import { getCurrentStreak, getRank, getPointsBalance, xpToNextLevel } from "./rewards/engine";

function totalXp(rewards: RewardsState): number {
  return rewards.ledger.filter((entry) => entry.type === "xp").reduce((sum, entry) => sum + entry.amount, 0);
}

function getSubjectDestination(profile: StudentProfile, topics: TopicContent[], subjectPattern: RegExp, practice = false): string {
  const supportedTopic = topics.find((topic) => subjectPattern.test(topic.subject));
  if (supportedTopic) return `/topic/${supportedTopic.id}${practice ? "?practice=1" : ""}`;
  const subjects = Object.entries(curriculum[String(profile.grade)] ?? {});
  const match = subjects.find(([subject]) => subjectPattern.test(subject)) ??
    (subjectPattern.test("Science") ? subjects.find(([subject]) => /world around us|evs/i.test(subject)) : undefined);
  if (!match?.[1][0]) return "/lessons";
  return `/topic/unavailable?subject=${encodeURIComponent(match[0])}&title=${encodeURIComponent(match[1][0])}`;
}

export function KingdomDashboard({ profile, rewards, activities, topics }: {
  profile: StudentProfile;
  rewards: RewardsState;
  activities: Activity[];
  topics: TopicContent[];
}) {
  const character = getLearningCharacter(profile.selectedCharacterId);
  const xp = totalXp(rewards);
  const points = getPointsBalance(rewards.ledger);
  const level = xpToNextLevel(xp);
  const streak = getCurrentStreak(activities, rewards.ledger);
  const rank = getRank(streak);
  const completedTopicIds = new Set(activities.filter((item) => item.kind === "lesson").map((item) => item.topic));
  const completedTopics = topics.filter((topic) => completedTopicIds.has(topic.id)).length;
  const nextTopic = topics.find((topic) => !completedTopicIds.has(topic.id));
  const recentActivities = [...activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <main className="kingdom-dashboard">
      <section className="kingdom-dashboard-hero">
        <div className="kingdom-dashboard-copy">
          <span className="kingdom-kicker"><Sparkles size={14} /> CLASS {profile.grade} · {profile.board} REALM</span>
          <h1>Welcome back, {profile.name}.</h1>
          <p>Your next discovery is waiting in the kingdom. Choose a quest, gather knowledge, and let your progress grow.</p>
          <div className="kingdom-hero-actions">
            {nextTopic
              ? <Link className="btn kingdom-button" to={`/topic/${nextTopic.id}`}>Continue: {nextTopic.title} <span aria-hidden="true">→</span></Link>
              : <Link className="btn kingdom-button" to="/syllabus">Explore your class topics <span aria-hidden="true">→</span></Link>}
            <Link className="kingdom-map-link" to="/kingdom"><Map size={17} /> Open Kingdom Map</Link>
          </div>
        </div>
        <div className="kingdom-castle-art" aria-hidden="true">
          <div className="kingdom-moon" />
          <div className="kingdom-mountain mountain-back" />
          <div className="kingdom-mountain mountain-front" />
          <div className="kingdom-castle">
            <i className="castle-tower tower-left" /><i className="castle-tower tower-right" />
            <i className="castle-keep" /><i className="castle-gate" />
          </div>
          <span className="castle-star star-a">✦</span><span className="castle-star star-b">✧</span>
        </div>
      </section>

      <section className="kingdom-player-strip" aria-label="Player status">
        <div className="kingdom-player-identity"><CompanionAvatar id={character.id} size="small" /><span><strong>{character.name}</strong><small>{character.title} · {profile.grade <= 5 ? "Short learning quests" : "Your learning companion"}</small></span></div>
        <div className="kingdom-player-stat"><span>LEVEL</span><strong>{level.level}</strong></div>
        <div className="kingdom-player-stat"><span>TOTAL XP</span><strong>{xp.toLocaleString()}</strong></div>
        <div className="kingdom-xp-progress"><div><span>Progress to Level {level.level + 1}</span><strong>{level.currentXp} / {level.required} XP</strong></div><span className="kingdom-xp-track"><i style={{ width: `${level.progressPercent}%` }} /></span></div>
        <div className="kingdom-player-stat"><span>STUDY STREAK</span><strong>{streak} <small>days</small></strong></div>
        <div className="kingdom-player-stat"><span>RANK</span><strong>{rank.name}</strong></div>
        <div className="kingdom-player-stat"><span>POINTS</span><strong>{points}</strong></div>
      </section>

      <section className="kingdom-dashboard-grid">
        <article className="kingdom-panel kingdom-current-quest">
          <div className="kingdom-section-title"><span><ScrollText size={17} /> CURRENT QUEST</span><span className="kingdom-status-tag">{nextTopic ? "Ready" : topics.length ? "Completed" : "Explore"}</span></div>
          <h2>{nextTopic ? nextTopic.title : topics.length ? "All available lessons completed" : "Explore the curriculum"}</h2>
          <p>{nextTopic ? `${nextTopic.subject} · ${nextTopic.intro}` : topics.length ? "You've completed the reviewed lessons currently available for your class. Keep learning in the topic map or revise your notes." : `Start by exploring the Class ${profile.grade} curriculum. Reviewed lessons are added topic by topic.`}</p>
          <div className="kingdom-quest-progress"><span className="kingdom-progress-track"><i style={{ width: topics.length ? `${Math.round(completedTopics / topics.length * 100)}%` : "0%" }} /></span><small>{completedTopics} of {topics.length} reviewed lessons completed</small></div>
          <Link className="kingdom-text-link" to={nextTopic ? `/topic/${nextTopic.id}` : "/syllabus"}>{nextTopic ? "Begin this lesson" : "Browse class resources"} →</Link>
        </article>
        <article className="kingdom-panel kingdom-shortcuts">
          <div className="kingdom-section-title"><span><Compass size={17} /> QUICK TRAVEL</span></div>
          <div className="kingdom-shortcut-grid">
            <Link to="/lessons"><BookOpen /><span><strong>Lessons</strong><small>Class {profile.grade} resources</small></span></Link>
            <Link to="/notes"><NotebookPen /><span><strong>Notebook</strong><small>{activities.filter((item) => item.kind === "lesson").length} lessons recorded</small></span></Link>
            <Link to="/practice"><Swords /><span><strong>Quest Arena</strong><small>Practice and tests</small></span></Link>
            <Link to="/points"><Award /><span><strong>Achievements</strong><small>{rank.name} rank · {streak} day streak</small></span></Link>
          </div>
        </article>
      </section>

      <section className="kingdom-recent-panel kingdom-panel">
        <div className="kingdom-section-title"><span><Sparkles size={17} /> RECENT ADVENTURES</span><Link className="kingdom-text-link" to="/history">View activity →</Link></div>
        {recentActivities.length ? <ul>{recentActivities.map((activity) => <li key={activity.id}><span className="kingdom-activity-icon">{activity.kind === "lesson" ? <BookOpen /> : activity.kind === "quiz" ? <Award /> : <Sparkles />}</span><span><strong>{activity.title}</strong><small>{activity.subject} · {new Date(activity.date).toLocaleDateString()}</small></span>{typeof activity.score === "number" && <b>{activity.score}%</b>}</li>)}</ul> : <p className="kingdom-empty-state">Your adventure log is ready. Finish a lesson, quiz, or game to see real activity here.</p>}
      </section>
    </main>
  );
}

const locations = [
  { title: "Knowledge Castle", subtitle: "Class topics & syllabus", icon: Castle, to: "/syllabus", tone: "castle" },
  { title: "Enchanted Library", subtitle: "Your saved notes", icon: LibraryBig, to: "/notes", tone: "library" },
  { title: "Science Tower", subtitle: "Explore science lessons", icon: FlaskConical, subject: /science|physics|chemistry|biology/i, tone: "science" },
  { title: "Mathematics Dungeon", subtitle: "Math topics & practice", icon: Shield, subject: /mathematics/i, practice: true, tone: "math" },
  { title: "Language Gardens", subtitle: "Reading & language topics", icon: Flower2, subject: /language|english/i, tone: "language" },
  { title: "Quest Arena", subtitle: "Quizzes & timed tests", icon: Swords, to: "/practice", tone: "arena" },
  { title: "Revision Keep", subtitle: "Review your learning", icon: BookOpen, to: "/notes", tone: "revision" },
  { title: "Achievement Hall", subtitle: "Real XP, ranks & activity", icon: Award, to: "/points", tone: "achievements" },
  { title: "Treasure Vault", subtitle: "Spend earned Points", icon: ShoppingBag, to: "/shop", tone: "treasure" },
] as const;

export function KingdomMapPage({ profile, activities, topics }: {
  profile: StudentProfile;
  activities: Activity[];
  topics: TopicContent[];
}) {
  const completedTopics = new Set(activities.filter((item) => item.kind === "lesson").map((item) => item.topic));
  const completedCount = topics.filter((topic) => completedTopics.has(topic.id)).length;
  const nextTopic = topics.find((topic) => !completedTopics.has(topic.id));
  return (
    <main className="kingdom-map-page">
      <header className="page-title"><div><span className="eyebrow">THE SHARED REALM · CLASS {profile.grade}</span><h1>Kingdom Map</h1><p>One kingdom for every learner. Choose a real destination to study, practise, or review your progress.</p></div><span className="kingdom-status-tag">{completedCount} reviewed lessons completed</span></header>
      <section className="kingdom-map-scene" aria-label="Interactive fantasy kingdom map">
        <div className="map-sky-stars" aria-hidden="true" />
        <div className="map-cloud cloud-a" aria-hidden="true" />
        <div className="map-cloud cloud-b" aria-hidden="true" />
        <div className="map-cloud cloud-c" aria-hidden="true" />
        <div className="map-mountains map-mountains-far" aria-hidden="true" />
        <div className="map-mountains map-mountains-near" aria-hidden="true" />
        <div className="map-river" aria-hidden="true" />
        <div className="map-waterfall waterfall-left" aria-hidden="true" />
        <div className="map-waterfall waterfall-right" aria-hidden="true" />
        <div className="map-path" aria-hidden="true" />
        <div className="map-float-island island-left" aria-hidden="true"><span className="island-tree tree-a" /><span className="island-tree tree-b" /><span className="island-tree tree-c" /></div>
        <div className="map-float-island island-right" aria-hidden="true"><span className="island-tree tree-a" /><span className="island-tree tree-b" /></div>
        <div className="map-scene-castle" aria-hidden="true"><i /><i /><b /></div>
        <div className="map-forest forest-left" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="map-forest forest-right" aria-hidden="true"><span /><span /><span /><span /></div>
        <span className="map-sparkle sparkle-a" aria-hidden="true">✦</span>
        <span className="map-sparkle sparkle-b" aria-hidden="true">✦</span>
        <span className="map-sparkle sparkle-c" aria-hidden="true">✧</span>
        <span className="map-scene-label map-label-castle">THE KNOWLEDGE REALM</span>
        <div className="kingdom-map-locations">
          {locations.map((location) => {
            const { title, subtitle, icon: Icon, tone } = location;
            const destination = "subject" in location ? getSubjectDestination(profile, topics, location.subject, "practice" in location && location.practice) : location.to;
            return <Link className={`kingdom-location kingdom-location-${tone}`} to={destination} key={title}>
              <span className="kingdom-location-icon"><Icon size={20} /></span><span className="kingdom-location-copy"><strong>{title}</strong><small>{subtitle}</small></span><span className="kingdom-location-arrow" aria-hidden="true">↗</span>
            </Link>;
          })}
        </div>
      </section>
      <section className="kingdom-map-objective">
        <span className="kingdom-objective-icon"><Sparkles /></span>
        <div><span className="eyebrow">YOUR NEXT OBJECTIVE</span><h2>{nextTopic ? `Learn ${nextTopic.title}` : "Choose what to explore next"}</h2><p>{nextTopic ? `${nextTopic.subject} · A reviewed lesson from your Class ${profile.grade} learning path.` : "Browse the class map or revisit your notes and practice."}</p></div>
        <Link className="btn kingdom-button" to={nextTopic ? `/topic/${nextTopic.id}` : "/syllabus"}>{nextTopic ? "Start quest →" : "Explore topics →"}</Link>
      </section>
      <p className="kingdom-map-access-note">All destinations shown here lead to existing learning features. Progress-based locks are not enabled, so destinations stay open rather than showing invented unlock states.</p>
    </main>
  );
}
