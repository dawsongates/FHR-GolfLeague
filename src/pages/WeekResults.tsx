import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLeague } from "../hooks/useLeague";
import { getWeeklyRoles, computeMatchPoints, getActivePlayer } from "../utils/league-data";

function formatScore(n: number): string {
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

export function WeekResults() {
  const { weekNumber: weekParam } = useParams<{ weekNumber: string }>();
  const weekNumber = Number(weekParam);
  const { league, updateLeague } = useLeague();
  const navigate = useNavigate();
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");

  const week = league.weeks.find((w) => w.weekNumber === weekNumber);
  const coursePar = league.course.totalPar;

  // Auto-populate matches from schedule if week has no matches yet
  const weekSchedule = league.schedule.find((s) => s.weekNumber === weekNumber);
  const hasScheduleMatchups = weekSchedule && weekSchedule.matchups.length > 0;

  if (!week) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>Week {weekNumber} not found</Typography>
      </Box>
    );
  }

  // Build team summary from scores
  const teamSummary = league.teams.map((team) => {
    const { playerA, playerB } = getWeeklyRoles(league, team, weekNumber);
    const activeA = getActivePlayer(league, team.id, playerA, weekNumber);
    const activeB = getActivePlayer(league, team.id, playerB, weekNumber);
    const scoreA = week.scores.find((s) => s.playerId === activeA.player.id);
    const scoreB = week.scores.find((s) => s.playerId === activeB.player.id);
    const netA = scoreA ? scoreA.net : null;
    const netB = scoreB ? scoreB.net : null;
    const teamNet =
      netA !== null && netB !== null
        ? netA + netB
        : netA !== null
          ? netA
          : netB;
    const teamNetVsPar = teamNet !== null ? teamNet - coursePar * (netA !== null && netB !== null ? 2 : 1) : null;

    const netVsParA = scoreA ? scoreA.net - coursePar : null;
    const netVsParB = scoreB ? scoreB.net - coursePar : null;

    return {
      team,
      playerA: activeA.player,
      playerB: activeB.player,
      isSubA: activeA.isSub,
      isSubB: activeB.isSub,
      scoreA,
      scoreB,
      netA,
      netB,
      teamNet,
      teamNetVsPar,
      netVsParA,
      netVsParB,
    };
  });

  function handleAddMatch() {
    if (!team1Id || !team2Id || team1Id === team2Id || !week) return;
    const match = computeMatchPoints(league, week, team1Id, team2Id);
    updateLeague((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) =>
        w.weekNumber === weekNumber ? { ...w, matches: [...w.matches, match] } : w,
      ),
    }));
    setMatchDialogOpen(false);
    setTeam1Id("");
    setTeam2Id("");
  }

  function handleDeleteMatch(matchId: string) {
    updateLeague((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) =>
        w.weekNumber === weekNumber
          ? { ...w, matches: w.matches.filter((m) => m.id !== matchId) }
          : w,
      ),
    }));
  }

  /** Recompute all match points for this week (e.g. after score edits) */
  function handleRecomputeAll() {
    updateLeague((prev) => {
      const currentWeek = prev.weeks.find((w) => w.weekNumber === weekNumber);
      if (!currentWeek) return prev;
      const updatedMatches = currentWeek.matches.map((m) => {
        const recomputed = computeMatchPoints(prev, currentWeek, m.team1Id, m.team2Id);
        return { ...recomputed, id: m.id }; // preserve original match id
      });
      return {
        ...prev,
        weeks: prev.weeks.map((w) =>
          w.weekNumber === weekNumber ? { ...w, matches: updatedMatches } : w,
        ),
      };
    });
  }

  /** Populate matches from the season schedule for this week */
  function handleSyncFromSchedule() {
    if (!weekSchedule || !week) return;
    updateLeague((prev) => {
      const currentWeek = prev.weeks.find((w) => w.weekNumber === weekNumber);
      if (!currentWeek) return prev;
      const newMatches = weekSchedule.matchups.map((m) =>
        computeMatchPoints(prev, currentWeek, m.team1Id, m.team2Id),
      );
      return {
        ...prev,
        weeks: prev.weeks.map((w) =>
          w.weekNumber === weekNumber ? { ...w, matches: newMatches } : w,
        ),
      };
    });
  }

  // Teams already in a match this week
  const matchedTeamIds = new Set(
    week.matches.flatMap((m) => [m.team1Id, m.team2Id]),
  );

  // Available teams for new matchups (not already matched)
  const availableTeams = league.teams.filter((t) => !matchedTeamIds.has(t.id));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Week {weekNumber} Results
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {new Date(`${week.date}T12:00:00`).toLocaleDateString()} —{" "}
        {week.isPlayoff ? "Playoff" : "Regular Season"}
      </Typography>

      {/* Scores Summary */}
      <Typography variant="h6" gutterBottom>
        Scores
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Team</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Player A</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">A Net</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Player B</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">B Net</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Team Net vs Par</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teamSummary
              .sort((a, b) => (a.teamNetVsPar ?? 99) - (b.teamNetVsPar ?? 99))
              .map(({ team, playerA, playerB, isSubA, isSubB, scoreA, scoreB, netVsParA, netVsParB, teamNetVsPar }) => (
                <TableRow key={team.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{team.name}</TableCell>
                  <TableCell align="center">
                    {scoreA ? (
                      <>
                        {playerA.name}{isSubA ? " (sub)" : ""}: {scoreA.gross} (hcp {scoreA.handicap})
                      </>
                    ) : "—"}
                  </TableCell>
                  <TableCell align="center">
                    {netVsParA !== null ? (
                      <Chip
                        label={formatScore(netVsParA)}
                        size="small"
                        color={netVsParA <= 0 ? "success" : "default"}
                      />
                    ) : "—"}
                  </TableCell>
                  <TableCell align="center">
                    {scoreB ? (
                      <>
                        {playerB.name}{isSubB ? " (sub)" : ""}: {scoreB.gross} (hcp {scoreB.handicap})
                      </>
                    ) : "—"}
                  </TableCell>
                  <TableCell align="center">
                    {netVsParB !== null ? (
                      <Chip
                        label={formatScore(netVsParB)}
                        size="small"
                        color={netVsParB <= 0 ? "success" : "default"}
                      />
                    ) : "—"}
                  </TableCell>
                  <TableCell align="center">
                    {teamNetVsPar !== null ? (
                      <Chip
                        label={formatScore(teamNetVsPar)}
                        color={teamNetVsPar <= 0 ? "success" : "error"}
                        size="small"
                      />
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Matches */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Head-to-Head Matches</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {week.matches.length === 0 && hasScheduleMatchups && (
            <Button size="small" variant="contained" color="secondary" onClick={handleSyncFromSchedule}>
              Load from Schedule
            </Button>
          )}
          {week.matches.length > 0 && hasScheduleMatchups && (
            <Button size="small" color="warning" onClick={handleSyncFromSchedule}>
              Re-sync from Schedule
            </Button>
          )}
          {week.matches.length > 0 && (
            <Button size="small" startIcon={<RefreshIcon />} onClick={handleRecomputeAll}>
              Recompute Points
            </Button>
          )}
          {availableTeams.length >= 2 && (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setMatchDialogOpen(true)}>
              Add Match
            </Button>
          )}
        </Box>
      </Box>

      {week.matches.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center", mb: 3 }}>
          <Typography color="text.secondary">
            No matches set up yet — add head-to-head matchups for bonus points
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          {week.matches.map((match) => {
            const t1 = league.teams.find((t) => t.id === match.team1Id);
            const t2 = league.teams.find((t) => t.id === match.team2Id);
            const details = match.details ?? [];
            const aMatch = details.find((d) => d.type === "A");
            const bMatch = details.find((d) => d.type === "B");
            const totalMatch = details.find((d) => d.type === "total");

            return (
              <Paper key={match.id} sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {t1?.name ?? "?"} vs {t2?.name ?? "?"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={`${match.team1BonusPoints} - ${match.team2BonusPoints}`}
                      color="secondary"
                      sx={{ fontWeight: 700, fontSize: "1rem" }}
                    />
                    <Button size="small" color="error" onClick={() => handleDeleteMatch(match.id)}>
                      Remove
                    </Button>
                  </Box>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Sub-Match</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{t1?.name ?? "T1"}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{t2?.name ?? "T2"}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Points</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { label: "A vs A", d: aMatch },
                      { label: "B vs B", d: bMatch },
                      { label: "Team Total", d: totalMatch },
                    ].map(({ label, d }) => (
                      <TableRow key={label}>
                        <TableCell>{label}</TableCell>
                        <TableCell align="center">
                          {d?.team1Net !== null && d?.team1Net !== undefined ? (
                            <Chip
                              label={formatScore(d.team1Net)}
                              size="small"
                              color={d.team1Pts > d.team2Pts ? "success" : d.team1Pts === d.team2Pts ? "warning" : "default"}
                              variant={d.team1Pts > d.team2Pts ? "filled" : "outlined"}
                            />
                          ) : "—"}
                        </TableCell>
                        <TableCell align="center">
                          {d?.team2Net !== null && d?.team2Net !== undefined ? (
                            <Chip
                              label={formatScore(d.team2Net)}
                              size="small"
                              color={d.team2Pts > d.team1Pts ? "success" : d.team2Pts === d.team1Pts ? "warning" : "default"}
                              variant={d.team2Pts > d.team1Pts ? "filled" : "outlined"}
                            />
                          ) : "—"}
                        </TableCell>
                        <TableCell align="center">
                          {d ? `${d.team1Pts} - ${d.team2Pts}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            );
          })}
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate(`/weeks/${weekNumber}/scores`)}>
          Edit Scores
        </Button>
        <Button variant="outlined" onClick={() => navigate("/weeks")}>
          Back to Weeks
        </Button>
      </Box>

      {/* Add Match Dialog — simplified, just pick two teams */}
      <Dialog open={matchDialogOpen} onClose={() => setMatchDialogOpen(false)}>
        <DialogTitle>Add Head-to-Head Match</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important", minWidth: 350 }}>
          <Typography variant="body2" color="text.secondary">
            Select two teams — match points (2-2-2) are computed automatically from scores.
          </Typography>
          <Select value={team1Id} onChange={(e) => setTeam1Id(e.target.value)} displayEmpty>
            <MenuItem value="" disabled>Select Team 1</MenuItem>
            {availableTeams.filter((t) => t.id !== team2Id).map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </Select>
          <Typography align="center" sx={{ fontWeight: 700 }}>vs</Typography>
          <Select value={team2Id} onChange={(e) => setTeam2Id(e.target.value)} displayEmpty>
            <MenuItem value="" disabled>Select Team 2</MenuItem>
            {availableTeams.filter((t) => t.id !== team1Id).map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMatchDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddMatch}
            disabled={!team1Id || !team2Id || team1Id === team2Id}
          >
            Add Match
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
