export const REWARDS_CONFIG = {
  // XP values reward finishing work, not opening a screen.
  xp: {
    lessonFirst: 25,
    lessonRepeat: 5,
    quizBase: 18,
    testBase: 30,
    task: 10,
    dailyGoal: 10,
    dailyCap: 120,
    quizRepeatMultipliers: [1, 0.5, 0.25],
    maxQuizAwardsPerTopicPerDay: 3,
    maxLessonRepeatAwardsPerDay: 1,
  },
  // Points are the only spendable balance; daily caps limit repeat farming.
  points: {
    lessonFirst: 15,
    quizBase: 12,
    testBase: 20,
    dailyQuizCap: 40,
    dailyTestCap: 60,
    quizRepeatMultipliers: [1, 0.5, 0.25],
    maxQuizAwardsPerTopicPerDay: 3,
    loginCycle: [3, 5, 7, 10, 14, 18, 25],
    streakFreezeCost: 100,
  },
  // Each higher level requires gradually more XP.
  level: {
    base: 100,
    exponent: 1.4,
    unlocks: [
      { level: 3, title: "Steady Learner" },
      { level: 5, title: "New Buddy frame" },
      { level: 10, title: "Curious Mind badge" },
    ],
  },
  // Rank days count completed learning days, not a manually editable counter.
  ranks: [
    { name: "Bronze", days: 1 },
    { name: "Silver", days: 3 },
    { name: "Gold", days: 7 },
    { name: "Platinum", days: 14 },
    { name: "Diamond", days: 30 },
    { name: "Master", days: 60 },
    { name: "Legend", days: 100 },
  ],
  dailyGoalActivities: 1,
} as const;

export type RankName = (typeof REWARDS_CONFIG.ranks)[number]["name"];
type ShopCosmetic = (typeof SHOP_COSMETICS)[number];

export const SHOP_COSMETICS = [
  { id: "theme-starlight", name: "Starlight Study", description: "A sky-blue accent and quiet star-map details.", category: "theme", cost: 80, skin: "starlight" },
  { id: "theme-woodland", name: "Woodland Quest", description: "Leaf-green highlights for a nature-inspired study space.", category: "theme", cost: 100, skin: "woodland" },
  { id: "theme-cosmos", name: "Cosmos Classroom", description: "Deep-space accents with a calm, readable interface.", category: "theme", cost: 120, skin: "cosmos" },
  { id: "avatar-starlight", name: "Star Buddy Frame", description: "A small starry frame for your learning buddy.", category: "avatar", cost: 60, avatar: "starlight" },
  { id: "avatar-woodland", name: "Leaf Buddy Frame", description: "A soft green frame for your learning buddy.", category: "avatar", cost: 60, avatar: "woodland" },
  { id: "avatar-comet", name: "Comet Buddy Frame", description: "A bright comet trail around your learning buddy.", category: "avatar", cost: 75, avatar: "comet" },
] as const;

export type ShopCosmeticId = (typeof SHOP_COSMETICS)[number]["id"];
export type ShopSkinId = Extract<ShopCosmetic, { category: "theme" }>["skin"] | "default";
export type ShopAvatarId = Extract<ShopCosmetic, { category: "avatar" }>["avatar"] | "default";
