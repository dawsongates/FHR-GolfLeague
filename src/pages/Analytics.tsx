import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
  Legend,
} from "recharts";
import { useLeague } from "../hooks/useLeague";
import { getPlayerHandicap } from "../utils/league-data";
import type { PlayerWeekScore } from "../types";

const ALL_LEAGUE = "__ALL_LEAGUE__";

export function Analytics() {
  const { league } = useLeague();
  const { teams, weeks, subs, course } = league;

  // Build a list of all players (team + subs who have played)
  const allPlayers: { id: string; name: string; teamName: string }[] = [];
  for (const team of teams) {
    allPlayers.push({ id: team.playerA.id, name: team.playerA.name, teamName: team.name });
    allPlayers.push({ id: team.playerB.id, name: team.playerB.name, teamName: team.name });
  }
  for (const sub of subs) {
    const hasScores = weeks.some((w) => w.scores.some((s) => s.playerId === sub.id));
    if (hasScores) {
      allPlayers.push({ id: sub.id, name: sub.name, teamName: "Sub" });
    }
  }

  const [selectedId, setSelectedId] = useState<string>(ALL_LEAGUE);

  const isLeagueView = selectedId === ALL_LEAGUE;

  // --- ALL LEAGUE data ---
  const allScores: PlayerWeekScore[] = weeks.flatMap((w) => w.scores);
  const leagueRounds = allScores.length;
  const leagueAvgGross = leagueRounds > 0 ? allScores.reduce((sum, s) => sum + s.gross, 0) / leagueRounds : 0;
  const leagueAvgNet = leagueRounds > 0 ? allScores.reduce((sum, s) => sum + s.net, 0) / leagueRounds : 0;
  const leagueBestGross = leagueRounds > 0 ? Math.min(...allScores.map((s) => s.gross)) : 0;
  const leagueWorstGross = leagueRounds > 0 ? Math.max(...allScores.map((s) => s.gross)) : 0;
  const leagueBestNet = leagueRounds > 0 ? Math.min(...allScores.map((s) => s.net)) : 0;

  // League hole averages
  const leagueHoleAverages = course.holes.map((h) => {
    const holeScores = allScores
      .flatMap((s) => s.holes.filter((hs) => hs.hole === h.number && hs.gross !== null))
      .map((hs) => hs.gross as number);
    const avg = holeScores.length > 0 ? holeScores.reduce((a, b) => a + b, 0) / holeScores.length : 0;
    return { hole: h.number, par: h.par, avg: Math.round(avg * 100) / 100, vsPar: Math.round((avg - h.par) * 100) / 100, count: holeScores.length };
  });

  const leagueHoleChartData = leagueHoleAverages.map((h) => ({
    hole: `#${h.hole}`,
    avg: h.avg,
    par: h.par,
    vsPar: h.vsPar,
  }));

  // League score distribution by week
  const completedWeeks = weeks.filter((w) => w.scores.length > 0).map((w) => w.weekNumber).sort((a, b) => a - b);

  const leagueWeeklyData = completedWeeks.map((wk) => {
    const wkScores = weeks.find((w) => w.weekNumber === wk)?.scores ?? [];
    const avg = wkScores.length > 0 ? wkScores.reduce((sum, s) => sum + s.gross, 0) / wkScores.length : 0;
    const best = wkScores.length > 0 ? Math.min(...wkScores.map((s) => s.gross)) : 0;
    const worst = wkScores.length > 0 ? Math.max(...wkScores.map((s) => s.gross)) : 0;
    return { week: `Wk ${wk}`, avg: Math.round(avg * 10) / 10, best, worst, par: course.totalPar };
  });

  // Per-player leaderboard: avg gross, avg net, rounds
  const playerLeaderboard = allPlayers.map((p) => {
    const scores = allScores.filter((s) => s.playerId === p.id);
    const avgG = scores.length > 0 ? scores.reduce((sum, s) => sum + s.gross, 0) / scores.length : 0;
    const avgN = scores.length > 0 ? scores.reduce((sum, s) => sum + s.net, 0) / scores.length : 0;
    const bestG = scores.length > 0 ? Math.min(...scores.map((s) => s.gross)) : 0;
    return { ...p, rounds: scores.length, avgGross: Math.round(avgG * 10) / 10, avgNet: Math.round(avgN * 10) / 10, bestGross: bestG };
  }).filter((p) => p.rounds > 0).sort((a, b) => a.avgGross - b.avgGross);

  // --- INDIVIDUAL PLAYER data ---
  const playerScores: PlayerWeekScore[] = !isLeagueView
    ? weeks.flatMap((w) => w.scores.filter((s) => s.playerId === selectedId)).sort((a, b) => a.weekNumber - b.weekNumber)
    : [];

  const selectedPlayer = allPlayers.find((p) => p.id === selectedId);

  const avgGross = playerScores.length > 0 ? playerScores.reduce((sum, s) => sum + s.gross, 0) / playerScores.length : 0;
  const avgNet = playerScores.length > 0 ? playerScores.reduce((sum, s) => sum + s.net, 0) / playerScores.length : 0;
  const bestGross = playerScores.length > 0 ? Math.min(...playerScores.map((s) => s.gross)) : 0;
  const worstGross = playerScores.length > 0 ? Math.max(...playerScores.map((s) => s.gross)) : 0;
  const bestNet = playerScores.length > 0 ? Math.min(...playerScores.map((s) => s.net)) : 0;
  const currentHandicap = playerScores.length > 0 ? playerScores[playerScores.length - 1]?.handicap ?? 0 : 0;

  const holeAverages = course.holes.map((h) => {
    const holeScores = playerScores
      .flatMap((s) => s.holes.filter((hs) => hs.hole === h.number && hs.gross !== null))
      .map((hs) => hs.gross as number);
    const avg = holeScores.length > 0 ? holeScores.reduce((a, b) => a + b, 0) / holeScores.length : 0;
    return { hole: h.number, par: h.par, avg: Math.round(avg * 100) / 100, vsPar: Math.round((avg - h.par) * 100) / 100 };
  });

  const trendData = playerScores.map((s) => ({
    week: `Wk ${s.weekNumber}`,
    gross: s.gross,
    net: s.net,
    par: course.totalPar,
  }));

  const holeChartData = holeAverages.map((h) => ({
    hole: `#${h.hole}`,
    avg: h.avg,
    par: h.par,
    vsPar: h.vsPar,
  }));

  // Match record
  let matchWins = 0;
  let matchLosses = 0;
  let matchTies = 0;
  if (!isLeagueView) {
    for (const week of weeks) {
      for (const match of week.matches) {
        const team = teams.find(
          (t) => t.playerA.id === selectedId || t.playerB.id === selectedId,
        );
        if (!team) continue;
        const isTeam1 = match.team1Id === team.id;
        const isTeam2 = match.team2Id === team.id;
        if (!isTeam1 && !isTeam2) continue;
        const myPts = isTeam1 ? match.team1BonusPoints : match.team2BonusPoints;
        const theirPts = isTeam1 ? match.team2BonusPoints : match.team1BonusPoints;
        if (myPts > theirPts) matchWins++;
        else if (myPts < theirPts) matchLosses++;
        else matchTies++;
      }
    }
  }

  // --- Handicap Trend (all players, league-wide) ---
  // Include all weeks where handicap data exists (may be 1 ahead of completed weeks)
  const maxHcWeeks = Math.max(
    0,
    ...allPlayers.map((p) => league.handicaps[p.id]?.length ?? 0),
  );
  const hcWeeks = Array.from({ length: maxHcWeeks }, (_, i) => i + 1);

  const hcTrendData = hcWeeks.map((wk) => {
    const row: Record<string, string | number> = { week: `Wk ${wk}` };
    for (const p of allPlayers) {
      row[p.name] = getPlayerHandicap(league, p.id, wk);
    }
    return row;
  });

  const lineColors = [
    "#1976d2", "#d32f2f", "#388e3c", "#f57c00", "#7b1fa2",
    "#0097a7", "#c2185b", "#455a64", "#e64a19", "#512da8",
    "#00838f", "#bf360c", "#1b5e20", "#4a148c", "#ff6f00",
    "#006064", "#880e4f", "#263238", "#e65100", "#311b92",
    "#004d40", "#b71c1c", "#33691e", "#4527a0", "#ff8f00",
    "#01579b", "#ad1457", "#37474f", "#d84315", "#6a1b9a",
    "#827717", "#1a237e",
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Analytics
      </Typography>

      {/* Player / League selector */}
      <FormControl sx={{ mb: 3, minWidth: 280 }}>
        <InputLabel>View</InputLabel>
        <Select
          value={selectedId}
          label="View"
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <MenuItem value={ALL_LEAGUE}>
            <strong>ALL LEAGUE</strong>
          </MenuItem>
          {allPlayers.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name} ({p.teamName})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* ===== ALL LEAGUE VIEW ===== */}
      {isLeagueView && leagueRounds > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* League Summary Stats */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              League Summary
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <StatChip label="Total Rounds" value={leagueRounds} />
              <StatChip label="Weeks Played" value={completedWeeks.length} />
              <StatChip label="Avg Gross" value={leagueAvgGross.toFixed(1)} />
              <StatChip label="Avg Net" value={leagueAvgNet.toFixed(1)} />
              <StatChip label="Best Gross" value={leagueBestGross} />
              <StatChip label="Worst Gross" value={leagueWorstGross} />
              <StatChip label="Best Net" value={leagueBestNet} />
            </Box>
          </Paper>

          {/* Handicap Trend — all players */}
          {hcTrendData.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Handicap Trend — All Players
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={hcTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, "dataMax + 2"]} label={{ value: "Handicap", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  {allPlayers.map((p, i) => (
                    <Line
                      key={p.id}
                      type="monotone"
                      dataKey={p.name}
                      stroke={lineColors[i % lineColors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          )}

          {/* League Weekly Trend */}
          {leagueWeeklyData.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Weekly League Averages
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={leagueWeeklyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={["dataMin - 3", "dataMax + 3"]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={course.totalPar} stroke="#888" strokeDasharray="3 3" label="Par" />
                  <Line type="monotone" dataKey="avg" stroke="#1976d2" strokeWidth={2} name="Avg Gross" />
                  <Line type="monotone" dataKey="best" stroke="#4caf50" strokeWidth={1.5} strokeDasharray="4 2" name="Best" />
                  <Line type="monotone" dataKey="worst" stroke="#f44336" strokeWidth={1.5} strokeDasharray="4 2" name="Worst" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          )}

          {/* League Average by Hole */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Average Score by Hole — All Players
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={leagueHoleChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hole" />
                <YAxis domain={[0, "dataMax + 1"]} />
                <Tooltip />
                <Bar dataKey="par" fill="#e0e0e0" name="Par" />
                <Bar dataKey="avg" name="League Avg">
                  {leagueHoleChartData.map((entry) => (
                    <Cell key={entry.hole} fill={entry.vsPar <= 0 ? "#4caf50" : entry.vsPar <= 0.5 ? "#ff9800" : "#f44336"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* League Hole Breakdown Table */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Hole Breakdown — League
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Hole</TableCell>
                    <TableCell>Par</TableCell>
                    <TableCell>Hdcp</TableCell>
                    <TableCell>Avg Score</TableCell>
                    <TableCell>vs Par</TableCell>
                    <TableCell>Rounds</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leagueHoleAverages.map((h) => (
                    <TableRow key={h.hole}>
                      <TableCell sx={{ fontWeight: 700 }}>#{h.hole}</TableCell>
                      <TableCell>{h.par}</TableCell>
                      <TableCell>{course.holes.find((ch) => ch.number === h.hole)?.hdcp ?? ""}</TableCell>
                      <TableCell>{h.avg > 0 ? h.avg.toFixed(2) : "—"}</TableCell>
                      <TableCell>
                        {h.avg > 0 ? (
                          <Chip
                            label={h.vsPar > 0 ? `+${h.vsPar.toFixed(2)}` : h.vsPar.toFixed(2)}
                            size="small"
                            color={h.vsPar <= 0 ? "success" : h.vsPar <= 0.5 ? "warning" : "error"}
                            variant="outlined"
                          />
                        ) : "—"}
                      </TableCell>
                      <TableCell>{h.count}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ "& td": { fontWeight: 700, borderTop: 2, borderColor: "divider" } }}>
                    <TableCell>Total</TableCell>
                    <TableCell>{course.totalPar}</TableCell>
                    <TableCell />
                    <TableCell>{leagueAvgGross.toFixed(1)}</TableCell>
                    <TableCell>
                      <Chip
                        label={(leagueAvgGross - course.totalPar) > 0 ? `+${(leagueAvgGross - course.totalPar).toFixed(1)}` : (leagueAvgGross - course.totalPar).toFixed(1)}
                        size="small"
                        color={(leagueAvgGross - course.totalPar) <= 0 ? "success" : "warning"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{leagueRounds}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Player Leaderboard */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Player Averages
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Player</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell>Rounds</TableCell>
                    <TableCell>Avg Gross</TableCell>
                    <TableCell>Avg Net</TableCell>
                    <TableCell>Best Gross</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playerLeaderboard.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                      <TableCell>{p.teamName}</TableCell>
                      <TableCell>{p.rounds}</TableCell>
                      <TableCell>{p.avgGross}</TableCell>
                      <TableCell>{p.avgNet}</TableCell>
                      <TableCell>{p.bestGross}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* ===== INDIVIDUAL PLAYER VIEW ===== */}
      {!isLeagueView && selectedPlayer && playerScores.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Summary Stats */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Season Summary — {selectedPlayer.name}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <StatChip label="Rounds Played" value={playerScores.length} />
              <StatChip label="Avg Gross" value={avgGross.toFixed(1)} />
              <StatChip label="Avg Net" value={avgNet.toFixed(1)} />
              <StatChip label="Best Gross" value={bestGross} />
              <StatChip label="Worst Gross" value={worstGross} />
              <StatChip label="Best Net" value={bestNet} />
              <StatChip label="Current HC" value={currentHandicap} />
              <StatChip label="Match Record" value={`${matchWins}W-${matchLosses}L-${matchTies}T`} />
            </Box>
          </Paper>

          {/* Handicap Trend — Individual */}
          {hcTrendData.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Handicap Trend — {selectedPlayer.name}
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={hcTrendData.map((row) => ({ week: row.week, handicap: row[selectedPlayer.name] }))}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, "dataMax + 2"]} label={{ value: "Handicap", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="handicap" stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} name="Handicap" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          )}

          {/* Score Trend Chart */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Score Trend
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip />
                <ReferenceLine y={course.totalPar} stroke="#888" strokeDasharray="3 3" label="Par" />
                <Line type="monotone" dataKey="gross" stroke="#1976d2" strokeWidth={2} name="Gross" />
                <Line type="monotone" dataKey="net" stroke="#4caf50" strokeWidth={2} name="Net" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Average by Hole */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Average Score by Hole
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={holeChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hole" />
                <YAxis domain={[0, "dataMax + 1"]} />
                <Tooltip />
                <Bar dataKey="par" fill="#e0e0e0" name="Par" />
                <Bar dataKey="avg" name="Avg Score">
                  {holeChartData.map((entry) => (
                    <Cell key={entry.hole} fill={entry.vsPar <= 0 ? "#4caf50" : entry.vsPar <= 0.5 ? "#ff9800" : "#f44336"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Hole-by-hole table */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Hole Breakdown
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Hole</TableCell>
                    <TableCell>Par</TableCell>
                    <TableCell>Avg Score</TableCell>
                    <TableCell>vs Par</TableCell>
                    {playerScores.map((s) => (
                      <TableCell key={s.weekNumber} align="center">
                        Wk {s.weekNumber}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holeAverages.map((h) => (
                    <TableRow key={h.hole}>
                      <TableCell sx={{ fontWeight: 700 }}>#{h.hole}</TableCell>
                      <TableCell>{h.par}</TableCell>
                      <TableCell>{h.avg > 0 ? h.avg.toFixed(1) : "—"}</TableCell>
                      <TableCell>
                        {h.avg > 0 ? (
                          <Chip
                            label={h.vsPar > 0 ? `+${h.vsPar.toFixed(1)}` : h.vsPar.toFixed(1)}
                            size="small"
                            color={h.vsPar <= 0 ? "success" : h.vsPar <= 0.5 ? "warning" : "error"}
                            variant="outlined"
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      {playerScores.map((s) => {
                        const hs = s.holes.find((x) => x.hole === h.hole);
                        return (
                          <TableCell key={s.weekNumber} align="center">
                            {hs?.gross ?? "—"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow sx={{ "& td": { fontWeight: 700, borderTop: 2, borderColor: "divider" } }}>
                    <TableCell>Total</TableCell>
                    <TableCell>{course.totalPar}</TableCell>
                    <TableCell>{avgGross.toFixed(1)}</TableCell>
                    <TableCell>
                      <Chip
                        label={(avgGross - course.totalPar) > 0 ? `+${(avgGross - course.totalPar).toFixed(1)}` : (avgGross - course.totalPar).toFixed(1)}
                        size="small"
                        color={(avgGross - course.totalPar) <= 0 ? "success" : "warning"}
                        variant="outlined"
                      />
                    </TableCell>
                    {playerScores.map((s) => (
                      <TableCell key={s.weekNumber} align="center">
                        {s.gross}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Week-by-week detail */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Weekly Scores
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Week</TableCell>
                    <TableCell>Gross</TableCell>
                    <TableCell>HC</TableCell>
                    <TableCell>Net</TableCell>
                    <TableCell>Net vs Par</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playerScores.map((s) => (
                    <TableRow key={s.weekNumber}>
                      <TableCell>Week {s.weekNumber}</TableCell>
                      <TableCell>{s.gross}</TableCell>
                      <TableCell>{s.handicap}</TableCell>
                      <TableCell>{s.net}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.netVsPar > 0 ? `+${s.netVsPar}` : s.netVsPar}
                          size="small"
                          color={s.netVsPar <= 0 ? "success" : s.netVsPar <= 2 ? "warning" : "error"}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {!isLeagueView && selectedPlayer && playerScores.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No scores recorded yet for {selectedPlayer.name}.
        </Typography>
      )}
    </Box>
  );
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1, textAlign: "center", minWidth: 100 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Paper>
  );
}
