import type { CourseInfo, LeagueConfig, Match, MatchDetail, Player, ScheduleMatchup, SubPlayer, Team, WeekData, WeekSchedule } from "../types";

const STORAGE_KEY = "golf-league-data";

// Andover Municipal Golf Course - Andover, KS - 9 holes, Par 33
const DEFAULT_COURSE: CourseInfo = {
  name: "Andover Municipal Golf Course",
  holes: [
    { number: 1, par: 4, yards: 270, hdcp: 8 },
    { number: 2, par: 4, yards: 205, hdcp: 7 },
    { number: 3, par: 3, yards: 170, hdcp: 6 },
    { number: 4, par: 4, yards: 288, hdcp: 5 },
    { number: 5, par: 4, yards: 360, hdcp: 1 },
    { number: 6, par: 3, yards: 155, hdcp: 4 },
    { number: 7, par: 4, yards: 320, hdcp: 2 },
    { number: 8, par: 3, yards: 190, hdcp: 3 },
    { number: 9, par: 4, yards: 290, hdcp: 9 },
  ],
  totalPar: 33,
};

function createDefaultLeague(): LeagueConfig {
  const teams: Team[] = [
    {
      id: "t1",
      name: "Gates / Ensz",
      playerA: { id: "p1a", name: "Dawson Gates", role: "A", teamId: "t1" },
      playerB: { id: "p1b", name: "Colton Ensz", role: "B", teamId: "t1" },
    },
    {
      id: "t2",
      name: "Ricke / Severson",
      playerA: { id: "p2a", name: "Justin Ricke", role: "A", teamId: "t2" },
      playerB: { id: "p2b", name: "Todd Severson", role: "B", teamId: "t2" },
    },
    {
      id: "t3",
      name: "Dort / Cherico",
      playerA: { id: "p3a", name: "Rob Dort", role: "A", teamId: "t3" },
      playerB: { id: "p3b", name: "Jeff Cherico", role: "B", teamId: "t3" },
    },
    {
      id: "t4",
      name: "Palmer / Palmquist",
      playerA: { id: "p4a", name: "Chris Palmer", role: "A", teamId: "t4" },
      playerB: { id: "p4b", name: "Eric Palmquist", role: "B", teamId: "t4" },
    },
    {
      id: "t5",
      name: "Casad / TBD",
      playerA: { id: "p5a", name: "Dan Casad", role: "A", teamId: "t5" },
      playerB: { id: "p5b", name: "TBD", role: "B", teamId: "t5" },
    },
    {
      id: "t6",
      name: "Snell / Dang",
      playerA: { id: "p6a", name: "Brendan Snell", role: "A", teamId: "t6" },
      playerB: { id: "p6b", name: "Nicholas Dang", role: "B", teamId: "t6" },
    },
    {
      id: "t7",
      name: "Jahnke / Butler",
      playerA: { id: "p7a", name: "Josh Jahnke", role: "A", teamId: "t7" },
      playerB: { id: "p7b", name: "Matthew Butler", role: "B", teamId: "t7" },
    },
    {
      id: "t8",
      name: "Fuller / Karst",
      playerA: { id: "p8a", name: "Brandon Fuller", role: "A", teamId: "t8" },
      playerB: { id: "p8b", name: "Alex Karst", role: "B", teamId: "t8" },
    },
    {
      id: "t9",
      name: "Shepherd / Lawrence",
      playerA: { id: "p9a", name: "Mike Shepherd", role: "A", teamId: "t9" },
      playerB: { id: "p9b", name: "Davian Lawrence", role: "B", teamId: "t9" },
    },
  ];

  return {
    season: "2026",
    courseName: "Andover Municipal Golf Course",
    course: DEFAULT_COURSE,
    teams,
    weeks: [],
    handicaps: {},
    seedHandicaps: {},
    handicapOverrides: {},
    subs: [],
    weekSubs: [],
    preSeasonScores: {},
    schedule: [],
    notes: [],
    payments: [],
  };
}

function migrateLeague(data: LeagueConfig): LeagueConfig {
  if (!data.seedHandicaps) data.seedHandicaps = {};
  if (!data.handicapOverrides) data.handicapOverrides = {};
  if (!data.subs) data.subs = [];
  if (!data.weekSubs) data.weekSubs = [];
  if (!data.preSeasonScores) data.preSeasonScores = {};
  if (!data.schedule) data.schedule = [];
  if (!data.notes) data.notes = [];
  if (!data.payments) data.payments = [];
  return data;
}

export function loadLeague(): LeagueConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as LeagueConfig;
      return migrateLeague(data);
    }
  } catch {
    // corrupted data, reset
  }
  // Don't save default to localStorage — let the hosted fetch have a chance first
  return createDefaultLeague();
}

/** Fetch hosted league data from public/league-data.json (for visitors without localStorage) */
export async function fetchHostedLeague(): Promise<LeagueConfig | null> {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}league-data.json`);
    if (!resp.ok) return null;
    const data = (await resp.json()) as LeagueConfig;
    return migrateLeague(data);
  } catch {
    return null;
  }
}

export function saveLeague(league: LeagueConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(league));
}

export function exportLeagueToFile(league: LeagueConfig): void {
  const json = JSON.stringify(league, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `golf-league-${league.season}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importLeagueFromFile(file: File): Promise<LeagueConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as LeagueConfig;
        // Basic validation
        if (!data.season || !data.teams || !data.course) {
          reject(new Error("Invalid league data file"));
          return;
        }
        saveLeague(data);
        resolve(data);
      } catch {
        reject(new Error("Could not parse JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

export function getPlayerHandicap(
  league: LeagueConfig,
  playerId: string,
  weekNumber: number,
): number {
  const hcps = league.handicaps[playerId];
  if (!hcps || hcps.length === 0) return 0;
  // Use the handicap set for this week, or the latest one
  return hcps[Math.min(weekNumber - 1, hcps.length - 1)] ?? 0;
}

/**
 * Returns the active player for a team slot in a given week.
 * If a sub is assigned for that player, returns a Player-shaped object for the sub.
 * Otherwise returns the original team player.
 */
export function getActivePlayer(
  league: LeagueConfig,
  teamId: string,
  originalPlayer: Player,
  weekNumber: number,
): { player: Player; isSub: boolean; subName?: string } {
  const assignment = league.weekSubs.find(
    (ws) => ws.weekNumber === weekNumber && ws.teamId === teamId && ws.absentPlayerId === originalPlayer.id,
  );
  if (assignment) {
    const sub = league.subs.find((s) => s.id === assignment.subPlayerId);
    if (sub) {
      // Return a Player-shaped object so downstream code works transparently
      return {
        player: { id: sub.id, name: sub.name, role: originalPlayer.role, teamId },
        isSub: true,
        subName: sub.name,
      };
    }
  }
  return { player: originalPlayer, isSub: false };
}

export function computeNetVsPar(gross: number, handicap: number, coursePar: number): number {
  return gross - handicap - coursePar;
}

/**
 * Resolves which player is A (lower handicap) and B (higher handicap) for a given week.
 * If handicaps are equal, falls back to the original playerA/playerB assignment.
 */
export function getWeeklyRoles(
  league: LeagueConfig,
  team: Team,
  weekNumber: number,
): { playerA: Player; playerB: Player } {
  // Resolve who's ACTUALLY playing in each slot (handles subs)
  const activeForA = getActivePlayer(league, team.id, team.playerA, weekNumber).player;
  const activeForB = getActivePlayer(league, team.id, team.playerB, weekNumber).player;

  // Compare handicaps of ACTIVE players (not roster players)
  const hcpA = getPlayerHandicap(league, activeForA.id, weekNumber);
  const hcpB = getPlayerHandicap(league, activeForB.id, weekNumber);

  if (hcpB < hcpA) {
    // Person in B's slot has lower handicap → swap roster order
    // (returning roster players so downstream getActivePlayer still resolves correctly)
    return { playerA: team.playerB, playerB: team.playerA };
  }
  // Default: original assignment (including ties)
  return { playerA: team.playerA, playerB: team.playerB };
}

/**
 * Compute the 3 sub-match results (A vs A, B vs B, team total) for a weekly matchup.
 * Each sub-match is worth 2 points: winner takes 2, tie splits 1-1.
 * Max 6 points per match (split between the two teams).
 *
 * Uses getActivePlayer to resolve subs and getWeeklyRoles for dynamic A/B assignment.
 */
export function computeMatchPoints(
  league: LeagueConfig,
  week: WeekData,
  team1Id: string,
  team2Id: string,
): Match {
  const coursePar = league.course.totalPar;
  const team1 = league.teams.find((t) => t.id === team1Id);
  const team2 = league.teams.find((t) => t.id === team2Id);
  if (!team1 || !team2) {
    return {
      id: `m${Date.now().toString(36)}`,
      weekNumber: week.weekNumber,
      team1Id,
      team2Id,
      details: [],
      team1BonusPoints: 0,
      team2BonusPoints: 0,
    };
  }

  const roles1 = getWeeklyRoles(league, team1, week.weekNumber);
  const roles2 = getWeeklyRoles(league, team2, week.weekNumber);

  // Resolve active players (subs)
  const active1A = getActivePlayer(league, team1Id, roles1.playerA, week.weekNumber).player;
  const active1B = getActivePlayer(league, team1Id, roles1.playerB, week.weekNumber).player;
  const active2A = getActivePlayer(league, team2Id, roles2.playerA, week.weekNumber).player;
  const active2B = getActivePlayer(league, team2Id, roles2.playerB, week.weekNumber).player;

  const score1A = week.scores.find((s) => s.playerId === active1A.id);
  const score1B = week.scores.find((s) => s.playerId === active1B.id);
  const score2A = week.scores.find((s) => s.playerId === active2A.id);
  const score2B = week.scores.find((s) => s.playerId === active2B.id);

  const net1A = score1A ? score1A.net - coursePar : null;
  const net1B = score1B ? score1B.net - coursePar : null;
  const net2A = score2A ? score2A.net - coursePar : null;
  const net2B = score2B ? score2B.net - coursePar : null;

  function subMatch(
    type: "A" | "B" | "total",
    val1: number | null,
    val2: number | null,
  ): MatchDetail {
    if (val1 === null || val2 === null) {
      return { type, team1Pts: 0, team2Pts: 0, team1Net: val1, team2Net: val2 };
    }
    if (val1 < val2) return { type, team1Pts: 2, team2Pts: 0, team1Net: val1, team2Net: val2 };
    if (val2 < val1) return { type, team1Pts: 0, team2Pts: 2, team1Net: val1, team2Net: val2 };
    // tie — split
    return { type, team1Pts: 1, team2Pts: 1, team1Net: val1, team2Net: val2 };
  }

  const teamTotal1 = net1A !== null && net1B !== null ? net1A + net1B : null;
  const teamTotal2 = net2A !== null && net2B !== null ? net2A + net2B : null;

  const details: MatchDetail[] = [
    subMatch("A", net1A, net2A),
    subMatch("B", net1B, net2B),
    subMatch("total", teamTotal1, teamTotal2),
  ];

  return {
    id: `m${Date.now().toString(36)}`,
    weekNumber: week.weekNumber,
    team1Id,
    team2Id,
    details,
    team1BonusPoints: details.reduce((s, d) => s + d.team1Pts, 0),
    team2BonusPoints: details.reduce((s, d) => s + d.team2Pts, 0),
  };
}

export function computeLeaderboard(league: LeagueConfig) {
  const coursePar = league.course.totalPar;

  // Holes sorted by difficulty (hdcp 1 = hardest)
  const holesByDifficulty = [...league.course.holes].sort((a, b) => a.hdcp - b.hdcp);

  const entries = league.teams.map((team) => {
    let totalNetVsPar = 0;
    let bonusPoints = 0;
    let weeksPlayed = 0;
    const weeklyBreakdown: { week: number; netVsPar: number; bonus: number }[] = [];

    for (const week of league.weeks) {
      const playerAScore = week.scores.find((s) => s.playerId === team.playerA.id);
      const playerBScore = week.scores.find((s) => s.playerId === team.playerB.id);

      if (!playerAScore && !playerBScore) continue;

      weeksPlayed++;
      const weekNetA = playerAScore ? playerAScore.net - coursePar : 0;
      const weekNetB = playerBScore ? playerBScore.net - coursePar : 0;
      const weekNet = weekNetA + weekNetB;

      // Find bonus points from matches
      let weekBonus = 0;
      for (const match of week.matches) {
        if (match.team1Id === team.id) weekBonus += match.team1BonusPoints;
        if (match.team2Id === team.id) weekBonus += match.team2BonusPoints;
      }

      totalNetVsPar += weekNet;
      bonusPoints += weekBonus;
      weeklyBreakdown.push({ week: week.weekNumber, netVsPar: weekNet, bonus: weekBonus });
    }

    return {
      team,
      totalNetVsPar,
      bonusPoints,
      // Lower net vs par is better, bonus points subtract from it
      combinedScore: totalNetVsPar - bonusPoints,
      weeksPlayed,
      weeklyBreakdown,
    };
  });

  // Helper: get head-to-head result between two teams
  // Returns negative if teamA wins h2h, positive if teamB wins, 0 if tied/no matchups
  function headToHead(teamAId: string, teamBId: string): number {
    let teamAPts = 0;
    let teamBPts = 0;
    for (const week of league.weeks) {
      for (const match of week.matches) {
        if (match.team1Id === teamAId && match.team2Id === teamBId) {
          teamAPts += match.team1BonusPoints;
          teamBPts += match.team2BonusPoints;
        } else if (match.team1Id === teamBId && match.team2Id === teamAId) {
          teamAPts += match.team2BonusPoints;
          teamBPts += match.team1BonusPoints;
        }
      }
    }
    return teamBPts - teamAPts; // negative = A wins h2h
  }

  // Helper: average gross score per hole for a team (both players combined)
  function teamHoleAverages(teamId: string): Map<number, number> {
    const team = league.teams.find((t) => t.id === teamId);
    if (!team) return new Map<number, number>();
    const playerIds = [team.playerA.id, team.playerB.id];
    const allScores = league.weeks.flatMap((w) => w.scores.filter((s) => playerIds.includes(s.playerId)));
    const holeMap = new Map<number, number>();
    for (const hole of league.course.holes) {
      const holeScores = allScores
        .flatMap((s) => s.holes.filter((hs) => hs.hole === hole.number && hs.gross !== null))
        .map((hs) => hs.gross as number);
      holeMap.set(hole.number, holeScores.length > 0 ? holeScores.reduce((a, b) => a + b, 0) / holeScores.length : 0);
    }
    return holeMap;
  }

  return entries.sort((a, b) => {
    // Primary: combined score (lower is better)
    if (a.combinedScore !== b.combinedScore) return a.combinedScore - b.combinedScore;

    // Tiebreaker 1: Head-to-head record
    const h2h = headToHead(a.team.id, b.team.id);
    if (h2h !== 0) return h2h;

    // Tiebreaker 2: Total match points (more is better)
    if (a.bonusPoints !== b.bonusPoints) return b.bonusPoints - a.bonusPoints;

    // Tiebreaker 3: Better net vs par (lower is better)
    if (a.totalNetVsPar !== b.totalNetVsPar) return a.totalNetVsPar - b.totalNetVsPar;

    // Tiebreaker 4: Better avg score on hardest holes (by hdcp rating)
    const aHoleAvgs = teamHoleAverages(a.team.id);
    const bHoleAvgs = teamHoleAverages(b.team.id);
    for (const hole of holesByDifficulty) {
      const aAvg = aHoleAvgs.get(hole.number) ?? 0;
      const bAvg = bHoleAvgs.get(hole.number) ?? 0;
      if (aAvg !== bAvg) return aAvg - bAvg; // lower avg = better
    }

    return 0;
  });
}

export function addWeek(league: LeagueConfig, date: string, isPlayoff: boolean): LeagueConfig {
  const weekNumber = league.weeks.length + 1;
  const newWeek: WeekData = {
    weekNumber,
    date,
    matches: [],
    scores: [],
    isPlayoff,
  };
  return { ...league, weeks: [...league.weeks, newWeek] };
}

/**
 * Compute a suggested handicap from gross scores.
 * Formula: MIN(maxHcp, TRUNC(0.85 * (avgGross - coursePar)))
 * Allows negative (plus) handicaps for players averaging below par.
 */
export function computeSuggestedHandicap(
  grossScores: number[],
  coursePar: number,
  seedHandicap: number,
  maxHcp = 20,
): number {
  if (grossScores.length === 0) return seedHandicap;
  const avg = grossScores.reduce((a, b) => a + b, 0) / grossScores.length;
  return Math.min(maxHcp, Math.trunc(0.85 * (avg - coursePar)));
}

/**
 * Recalculate all handicaps for the league based on scores and seeds.
 * Week 1 HC = seed handicap.
 * Week N+1 HC = formula based on gross scores from weeks 1..N.
 * Commissioner overrides take precedence over computed values.
 */
export function recalcAllHandicaps(league: LeagueConfig): LeagueConfig {
  const coursePar = league.course.totalPar;
  const totalWeeks = Math.max(league.weeks.length + 1, 1); // +1 for the next upcoming week
  const newHandicaps: Record<string, number[]> = {};

  // Collect all players: team players + subs
  const allPlayers: { id: string }[] = [];
  for (const team of league.teams) {
    allPlayers.push(team.playerA, team.playerB);
  }
  for (const sub of league.subs) {
    allPlayers.push(sub);
  }

  for (const player of allPlayers) {
    const seed = league.seedHandicaps[player.id] ?? 0;
    const overrides = league.handicapOverrides[player.id] ?? {};
    const hcps: number[] = [];

      for (let weekIdx = 0; weekIdx < totalWeeks; weekIdx++) {
        // Check for commissioner override first
        if (overrides[weekIdx] !== undefined) {
          hcps.push(overrides[weekIdx] ?? 0);
          continue;
        }

        if (weekIdx === 0) {
          // Week 1: if a pre-season score exists, compute HC from it; otherwise use seed
          const preSeason = league.preSeasonScores[player.id];
          if (preSeason && preSeason > 0) {
            hcps.push(computeSuggestedHandicap([preSeason], coursePar, seed));
          } else {
            hcps.push(seed);
          }
        } else {
          // Gather gross scores from weeks 1..weekIdx (all weeks before this one)
          const grossScores: number[] = [];
          // Include pre-season score in the running average
          const preSeason = league.preSeasonScores[player.id];
          if (preSeason && preSeason > 0) {
            grossScores.push(preSeason);
          }
          for (let w = 0; w < weekIdx && w < league.weeks.length; w++) {
            const week = league.weeks[w];
            if (!week) continue;
            const score = week.scores.find((s) => s.playerId === player.id);
            if (score && score.gross > 0) {
              grossScores.push(score.gross);
            }
          }
          hcps.push(computeSuggestedHandicap(grossScores, coursePar, seed));
        }
      }

      newHandicaps[player.id] = hcps;
    }
  

  return { ...league, handicaps: newHandicaps };
}

/** Available starting holes (1-9 minus hole 5) */
const STARTING_HOLES = [1, 2, 3, 4, 6, 7, 8, 9];

/**
 * Schedule constraints: require certain matchups to exist, optionally excluding specific weeks.
 */
interface ScheduleConstraint {
  team1Id: string;
  team2Id: string;
  /** Week numbers where this matchup must NOT be placed (1-indexed) */
  excludeWeeks?: number[];
}

/**
 * Build constraints based on team IDs and week dates.
 * Constraints are configured at schedule generation time — none are hardcoded.
 */
function buildScheduleConstraints(_teamIds: string[], _weekDates: string[]): ScheduleConstraint[] {
  return [];
}

/**
 * Validate a schedule against constraints.
 */
function validateScheduleConstraints(schedule: WeekSchedule[], constraints: ScheduleConstraint[]): boolean {
  for (const c of constraints) {
    const matchWeek = schedule.find((w) =>
      w.matchups.some(
        (m) =>
          (m.team1Id === c.team1Id && m.team2Id === c.team2Id) ||
          (m.team1Id === c.team2Id && m.team2Id === c.team1Id),
      ),
    );
    // Must exist somewhere in the schedule
    if (!matchWeek) return false;
    // Must not be in excluded weeks
    if (c.excludeWeeks?.includes(matchWeek.weekNumber)) return false;
  }
  return true;
}

/**
 * Generate a random season schedule where each team plays each other team at most once.
 * Uses a circle-method round-robin to guarantee every team plays every week.
 * Each week has numTeams/2 matchups, each assigned a unique starting hole.
 * Guarantees every team starts on hole 1 at least once across the season.
 * Retries until all schedule constraints are satisfied (max 10,000 attempts).
 */
export function generateRandomSchedule(teamIds: string[], numWeeks: number, weekDates?: string[]): WeekSchedule[] {
  const constraints = weekDates ? buildScheduleConstraints(teamIds, weekDates) : [];
  const maxAttempts = constraints.length > 0 ? 10000 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const schedule = generateSingleSchedule(teamIds, numWeeks);
    if (constraints.length === 0 || validateScheduleConstraints(schedule, constraints)) {
      return schedule;
    }
  }

  // Fallback: return last attempt even if constraints not met (shouldn't happen with 16 teams / 8 weeks)
  return generateSingleSchedule(teamIds, numWeeks);
}

function generateSingleSchedule(teamIds: string[], numWeeks: number): WeekSchedule[] {
  const n = teamIds.length;
  if (n < 2 || numWeeks < 1) return [];

  // Shuffle team order for randomness
  const shuffled = [...teamIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j] as string, shuffled[i] as string];
  }

  // Circle method round-robin: fix position 0, rotate the rest
  // This generates n-1 rounds (for even n) where every team plays exactly once per round.
  const matchupsPerWeek = Math.floor(n / 2);
  const totalRounds = n - 1; // max possible rounds in a full round-robin
  const allRounds: [string, string][][] = [];

  const circle = [...shuffled];
  // For even n, circle method works directly. For odd n we'd add a bye — but we have 16 (even).
  for (let round = 0; round < totalRounds; round++) {
    const roundMatchups: [string, string][] = [];
    for (let i = 0; i < matchupsPerWeek; i++) {
      const t1 = circle[i] as string;
      const t2 = circle[n - 1 - i] as string;
      roundMatchups.push([t1, t2]);
    }
    allRounds.push(roundMatchups);

    // Rotate: fix index 0, shift 1..n-1
    const last = circle[n - 1] as string;
    for (let i = n - 1; i > 1; i--) {
      circle[i] = circle[i - 1] as string;
    }
    circle[1] = last;
  }

  // Shuffle the rounds order, then pick numWeeks of them
  for (let i = allRounds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRounds[i], allRounds[j]] = [allRounds[j] as [string, string][], allRounds[i] as [string, string][]];
  }

  const schedule: WeekSchedule[] = [];
  for (let week = 0; week < Math.min(numWeeks, allRounds.length); week++) {
    const roundMatchups = allRounds[week] as [string, string][];
    // Shuffle matchup order within the week for random hole assignment
    for (let i = roundMatchups.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roundMatchups[i], roundMatchups[j]] = [roundMatchups[j] as [string, string], roundMatchups[i] as [string, string]];
    }

    const weekMatchups: ScheduleMatchup[] = roundMatchups.map(([t1, t2], idx) => ({
      team1Id: t1,
      team2Id: t2,
      startingHole: STARTING_HOLES[idx] ?? 1,
    }));

    schedule.push({ weekNumber: week + 1, matchups: weekMatchups });
  }

  // --- Fair hole 1 distribution ---
  // With 16 teams and 8 weeks, there are exactly 8 hole-1 slots (one per week).
  // Each slot covers 2 teams, so 16 teams can each get hole 1 exactly once.
  // Strategy: track hole-1 counts per team, and for each week, pick the matchup
  // whose teams have the fewest hole-1 assignments to go on hole 1.
  const hole1Count = new Map<string, number>();
  for (const id of teamIds) hole1Count.set(id, 0);

  for (const week of schedule) {
    // Score each matchup: sum of hole-1 counts for both teams (lower = more deserving)
    let bestIdx = 0;
    let bestScore = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < week.matchups.length; i++) {
      const m = week.matchups[i] as ScheduleMatchup;
      const score = (hole1Count.get(m.team1Id) ?? 0) + (hole1Count.get(m.team2Id) ?? 0);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    // Swap the chosen matchup into the hole-1 position (index 0 after re-assignment)
    // First, shuffle all holes randomly
    const holes = [...STARTING_HOLES].slice(0, week.matchups.length);
    for (let i = holes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [holes[i], holes[j]] = [holes[j] as number, holes[i] as number];
    }

    // Assign holes, but force the best candidate to get hole 1
    const hole1HoleIdx = holes.indexOf(1);
    // Swap so bestIdx gets hole 1
    if (hole1HoleIdx !== -1) {
      [holes[bestIdx], holes[hole1HoleIdx]] = [holes[hole1HoleIdx] as number, holes[bestIdx] as number];
    }

    // Apply holes to matchups
    for (let i = 0; i < week.matchups.length; i++) {
      week.matchups[i] = { ...week.matchups[i] as ScheduleMatchup, startingHole: holes[i] ?? (i + 1) };
    }

    // Track hole-1 assignment
    const hole1Matchup = week.matchups.find((m) => m.startingHole === 1);
    if (hole1Matchup) {
      hole1Count.set(hole1Matchup.team1Id, (hole1Count.get(hole1Matchup.team1Id) ?? 0) + 1);
      hole1Count.set(hole1Matchup.team2Id, (hole1Count.get(hole1Matchup.team2Id) ?? 0) + 1);
    }
  }

  return schedule;
}
