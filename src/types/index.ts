// Golf League domain types

export interface Player {
  id: string;
  name: string;
  role: "A" | "B";
  teamId: string;
}

export interface Team {
  id: string;
  name: string; // e.g. "Gates / Ensz"
  playerA: Player;
  playerB: Player;
}

export interface HoleScore {
  hole: number;
  gross: number | null;
}

export interface PlayerWeekScore {
  playerId: string;
  weekNumber: number;
  holes: HoleScore[];
  gross: number; // sum of hole scores
  handicap: number;
  net: number; // gross - handicap
  netVsPar: number; // net - coursePar
}

export interface MatchDetail {
  /** Which sub-match: A players, B players, or combined team total */
  type: "A" | "B" | "total";
  /** Points awarded to team 1 for this sub-match (0 or 1 or 2) */
  team1Pts: number;
  /** Points awarded to team 2 for this sub-match (0 or 1 or 2) */
  team2Pts: number;
  /** Net score for team 1's player/team in this sub-match */
  team1Net: number | null;
  /** Net score for team 2's player/team in this sub-match */
  team2Net: number | null;
}

export interface Match {
  id: string;
  weekNumber: number;
  team1Id: string;
  team2Id: string;
  /** Breakdown of the 3 sub-matches (A vs A, B vs B, team total) */
  details: MatchDetail[];
  // Totals (sum of details)
  team1BonusPoints: number;
  team2BonusPoints: number;
}

export interface WeekData {
  weekNumber: number;
  date: string; // YYYY-MM-DD
  matches: Match[];
  scores: PlayerWeekScore[];
  isPlayoff: boolean;
}

export interface LeaderboardEntry {
  team: Team;
  totalNetVsPar: number;
  bonusPoints: number;
  combinedScore: number; // totalNetVsPar + bonusPoints (lower is better... or we flip bonus)
  weeksPlayed: number;
  weeklyBreakdown: { week: number; netVsPar: number; bonus: number }[];
}

export interface CourseInfo {
  name: string;
  holes: { number: number; par: number; yards: number; hdcp: number }[];
  totalPar: number;
}

export interface SubPlayer {
  id: string;
  name: string;
}

export interface WeekSub {
  weekNumber: number;
  teamId: string;
  absentPlayerId: string; // the team player who is out
  subPlayerId: string; // the sub filling in
}

/** A single matchup in the season schedule (team1 vs team2, starting on a hole) */
export interface ScheduleMatchup {
  team1Id: string;
  team2Id: string;
  startingHole: number; // 1-9, excluding 5
}

/** Full schedule for one week */
export interface WeekSchedule {
  weekNumber: number;
  matchups: ScheduleMatchup[];
}

/** Weekly note */
export interface WeekNote {
  weekNumber: number;
  text: string;
}

/** Payment record for a player in a given week */
export interface PlayerPayment {
  playerId: string;
  weekNumber: number;
  greenFee: number; // amount paid for green fee
  buyIn: number; // amount paid for weekly contest/mulligan buy-in
  paid: boolean; // did they pay this week?
}

export interface LeagueConfig {
  season: string;
  courseName: string;
  course: CourseInfo;
  teams: Team[];
  weeks: WeekData[];
  handicaps: Record<string, number[]>;
  seedHandicaps: Record<string, number>;
  handicapOverrides: Record<string, Record<number, number>>;
  subs: SubPlayer[];
  weekSubs: WeekSub[];
  preSeasonScores: Record<string, number>;
  schedule: WeekSchedule[]; // season schedule
  notes: WeekNote[]; // per-week notes
  payments: PlayerPayment[]; // finance tracking
}
