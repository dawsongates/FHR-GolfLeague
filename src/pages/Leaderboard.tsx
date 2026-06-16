import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Fragment, useState } from "react";
import { useLeague } from "../hooks/useLeague";
import { computeLeaderboard, getPlayerHandicap } from "../utils/league-data";

function formatScore(n: number): string {
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

export function Leaderboard() {
  const { league } = useLeague();
  const leaderboard = computeLeaderboard(league);
  const hasScores = leaderboard.some((e) => e.weeksPlayed > 0);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const coursePar = league.course.totalPar;
  const playedWeeks = league.weeks.filter((w) => !w.isPlayoff);

  function toggleExpand(teamId: string) {
    setExpandedTeam((prev) => (prev === teamId ? null : teamId));
  }

  function getPlayerWeeklyStats(playerId: string) {
    return playedWeeks.map((week) => {
      const score = week.scores.find((s) => s.playerId === playerId);
      const hcp = getPlayerHandicap(league, playerId, week.weekNumber);
      return {
        weekNumber: week.weekNumber,
        gross: score?.gross ?? null,
        net: score?.net ?? null,
        hcp,
        netVsPar: score ? score.net - coursePar : null,
      };
    });
  }

  function getPlayerSeason(playerId: string) {
    const stats = getPlayerWeeklyStats(playerId);
    const played = stats.filter((s) => s.gross !== null);
    if (played.length === 0) return null;
    const grossScores = played.map((s) => s.gross as number);
    const netScores = played.map((s) => s.netVsPar as number);
    return {
      rounds: played.length,
      avgGross: (grossScores.reduce((a, b) => a + b, 0) / grossScores.length).toFixed(1),
      bestGross: Math.min(...grossScores),
      worstGross: Math.max(...grossScores),
      totalNetVsPar: netScores.reduce((a, b) => a + b, 0),
      currentHcp: getPlayerHandicap(league, playerId, playedWeeks.length > 0 ? (playedWeeks[playedWeeks.length - 1]?.weekNumber ?? 0) + 1 : 1),
    };
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <EmojiEventsIcon color="secondary" /> Season Leaderboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {league.season} — {league.courseName} — Par {coursePar}
      </Typography>

      {!hasScores ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No scores yet — head to Weeks to add a week and enter scores!
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "primary.main" }}>
                <TableCell sx={{ color: "white", width: 40 }} />
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Pos</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Team</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                  Weeks
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                  Net vs Par
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                  Match Pts
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                  Total
                </TableCell>
                {playedWeeks.map((w) => (
                  <TableCell
                    key={w.weekNumber}
                    sx={{ color: "white", fontWeight: 700 }}
                    align="center"
                  >
                    W{w.weekNumber}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry, idx) => {
                const isExpanded = expandedTeam === entry.team.id;
                const players = [entry.team.playerA, entry.team.playerB];

                return (
                  <Fragment key={entry.team.id}>
                    <TableRow
                      sx={{
                        backgroundColor: idx === 0 ? "rgba(255,215,0,0.1)" : undefined,
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
                      }}
                      onClick={() => toggleExpand(entry.team.id)}
                    >
                      <TableCell sx={{ p: 0.5 }}>
                        <IconButton size="small">
                          {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        {idx === 0 && entry.weeksPlayed > 0 ? "🏆" : idx + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{entry.team.name}</TableCell>
                      <TableCell align="center">{entry.weeksPlayed}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={formatScore(entry.totalNetVsPar)}
                          size="small"
                          color={entry.totalNetVsPar <= 0 ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {entry.bonusPoints > 0 ? (
                          <Chip label={`+${entry.bonusPoints}`} size="small" color="secondary" />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        {formatScore(entry.combinedScore)}
                      </TableCell>
                      {entry.weeklyBreakdown.map((wb) => (
                        <TableCell key={wb.week} align="center" sx={{ fontSize: "0.8rem" }}>
                          {formatScore(wb.netVsPar)}
                          {wb.bonus > 0 && (
                            <Box component="span" sx={{ color: "secondary.main", ml: 0.5 }}>
                              +{wb.bonus}
                            </Box>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Expandable detail row */}
                    <TableRow key={`${entry.team.id}-detail`}>
                      <TableCell colSpan={7 + playedWeeks.length} sx={{ p: 0, borderBottom: isExpanded ? undefined : "none" }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, backgroundColor: "rgba(0,0,0,0.02)" }}>
                            {/* Score Breakdown */}
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                              Score Breakdown
                            </Typography>
                            <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
                              <Paper variant="outlined" sx={{ p: 1.5, minWidth: 140, textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary">Net vs Par</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {formatScore(entry.totalNetVsPar)}
                                </Typography>
                              </Paper>
                              <Paper variant="outlined" sx={{ p: 1.5, minWidth: 140, textAlign: "center" }}>
                                <Typography variant="caption" color="text.secondary">Match Points</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: "secondary.main" }}>
                                  −{entry.bonusPoints}
                                </Typography>
                              </Paper>
                              <Paper variant="outlined" sx={{ p: 1.5, minWidth: 140, textAlign: "center", borderColor: "primary.main", borderWidth: 2 }}>
                                <Typography variant="caption" color="text.secondary">Combined Total</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {formatScore(entry.combinedScore)}
                                </Typography>
                              </Paper>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                              Combined = Net vs Par − Match Points (lower is better)
                            </Typography>

                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                              Player Breakdown
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>Player</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Current HC</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Rounds</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Avg Gross</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Best</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Worst</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Net vs Par</TableCell>
                                  {playedWeeks.map((w) => (
                                    <TableCell key={w.weekNumber} align="center" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                                      W{w.weekNumber}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {players.map((player) => {
                                  const season = getPlayerSeason(player.id);
                                  const weeklyStats = getPlayerWeeklyStats(player.id);
                                  return (
                                    <TableRow key={player.id}>
                                      <TableCell sx={{ fontWeight: 500 }}>{player.name}</TableCell>
                                      <TableCell align="center">
                                        {season ? (
                                          <Chip label={season.currentHcp} size="small" variant="outlined" />
                                        ) : "—"}
                                      </TableCell>
                                      <TableCell align="center">{season?.rounds ?? 0}</TableCell>
                                      <TableCell align="center">{season?.avgGross ?? "—"}</TableCell>
                                      <TableCell align="center">
                                        {season ? (
                                          <Chip label={season.bestGross} size="small" color="success" variant="outlined" />
                                        ) : "—"}
                                      </TableCell>
                                      <TableCell align="center">
                                        {season ? (
                                          <Chip label={season.worstGross} size="small" color="error" variant="outlined" />
                                        ) : "—"}
                                      </TableCell>
                                      <TableCell align="center">
                                        {season ? (
                                          <Chip
                                            label={formatScore(season.totalNetVsPar)}
                                            size="small"
                                            color={season.totalNetVsPar <= 0 ? "success" : "default"}
                                          />
                                        ) : "—"}
                                      </TableCell>
                                      {weeklyStats.map((ws) => (
                                        <TableCell key={ws.weekNumber} align="center" sx={{ fontSize: "0.75rem" }}>
                                          {ws.gross !== null ? (
                                            <Box>
                                              <Box>{ws.gross}</Box>
                                              <Box sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                                                net {ws.net}
                                              </Box>
                                            </Box>
                                          ) : "—"}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
