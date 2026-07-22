export const XP_RULES = {
  BASE_XP_PER_QUESTION: 10,
  ACCURACY_BONUS_THRESHOLD: 80,
  ACCURACY_BONUS_MULTIPLIER: 1.5,
  PERFECT_BONUS: 50,
  STREAK_BONUS_PER_DAY: 5,
  STREAK_BONUS_MAX: 50,
  TOPIC_COMPLETION_BONUS: 100,
  DISCIPLINE_COMPLETION_BONUS: 500,
} as const;

export const LEAGUES = [
  { name: "Bronze", minXp: 0, icon: "🥉", color: "#cd7f32" },
  { name: "Prata", minXp: 1000, icon: "🥈", color: "#c0c0c0" },
  { name: "Ouro", minXp: 3000, icon: "🥇", color: "#ffd700" },
  { name: "Platina", minXp: 7000, icon: "💎", color: "#00ced1" },
  { name: "Diamante", minXp: 15000, icon: "🔷", color: "#4169e1" },
  { name: "Mestre", minXp: 30000, icon: "🏆", color: "#ff00ff" },
  { name: "Grão-Mestre", minXp: 60000, icon: "👑", color: "#ff4500" },
] as const;

export type League = (typeof LEAGUES)[number];

export function getLeague(xp: number): League {
  let current: League = LEAGUES[0];
  for (const league of LEAGUES) {
    if (xp >= league.minXp) current = league;
  }
  return current;
}

export function getNextLeague(xp: number): League | null {
  for (const league of LEAGUES) {
    if (xp < league.minXp) return league;
  }
  return null;
}

export function getLeagueProgress(xp: number): { current: number; needed: number; percent: number } {
  const current = getLeague(xp);
  const next = getNextLeague(xp);
  if (!next) return { current: xp, needed: current.minXp, percent: 100 };
  const range = next.minXp - current.minXp;
  const progress = xp - current.minXp;
  return { current: progress, needed: range, percent: Math.min(100, Math.round((progress / range) * 100)) };
}

export function calculateLancamentoXP(
  totalQuestions: number,
  accuracy: number,
  currentStreak: number
): number {
  let xp = totalQuestions * XP_RULES.BASE_XP_PER_QUESTION;
  if (accuracy >= 100) {
    xp += XP_RULES.PERFECT_BONUS;
  } else if (accuracy >= XP_RULES.ACCURACY_BONUS_THRESHOLD) {
    xp = Math.round(xp * XP_RULES.ACCURACY_BONUS_MULTIPLIER);
  }
  if (currentStreak > 0) {
    const streakBonus = Math.min(currentStreak * XP_RULES.STREAK_BONUS_PER_DAY, XP_RULES.STREAK_BONUS_MAX);
    xp += streakBonus;
  }
  return xp;
}
