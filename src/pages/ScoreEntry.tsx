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
  TextField,
  Button,
  Chip,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useLeague } from "../hooks/useLeague";
import { getPlayerHandicap, recalcAllHandicaps, getWeeklyRoles, getActivePlayer } from "../utils/league-data";
import type { PlayerWeekScore, HoleScore } from "../types";

export function ScoreEntry() {
  const { weekNumber: weekParam } = useParams<{ weekNumber: string }>();
  const weekNumber = Number(weekParam);
  const { league, updateLeague } = useLeague();
  const navigate = useNavigate();

  const week = league.weeks.find((w) => w.weekNumber === weekNumber);
  const course = league.course;

  // Initialize scores state from existing data or blank
  const [scores, setScores] = useState<Record<string, (number | null)[]>>(() => {
    const initial: Record<string, (number | null)[]> = {};
    for (const team of league.teams) {
      for (const origPlayer of [team.playerA, team.playerB]) {
        const { player } = getActivePlayer(league, team.id, origPlayer, weekNumber);
        const existing = week?.scores.find((s) => s.playerId === player.id);
        if (existing) {
          initial[player.id] = existing.holes.map((h) => h.gross);
        } else {
          initial[player.id] = Array(9).fill(null);
        }
      }
    }
    return initial;
  });

  const playerTotals = useMemo(() => {
    const totals: Record<string, { gross: number; hcp: number; net: number; complete: boolean }> = {};
    for (const team of league.teams) {
      for (const origPlayer of [team.playerA, team.playerB]) {
        const { player } = getActivePlayer(league, team.id, origPlayer, weekNumber);
        const holes = scores[player.id] ?? [];
        const complete = holes.every((h) => h !== null && h > 0);
        const gross = holes.reduce((sum: number, h) => sum + (h ?? 0), 0);
        const hcp = getPlayerHandicap(league, player.id, weekNumber);
        totals[player.id] = { gross, hcp, net: gross - hcp, complete };
      }
    }
    return totals;
  }, [scores, league, weekNumber]);

  function updateHoleScore(playerId: string, holeIndex: number, value: string) {
    const num = value === "" ? null : Math.max(1, Math.min(15, Number(value)));
    setScores((prev) => {
      const playerHoles = [...(prev[playerId] ?? Array(9).fill(null))];
      playerHoles[holeIndex] = num;
      return { ...prev, [playerId]: playerHoles };
    });
  }

  function handleSave() {
    updateLeague((prev) => {
      const newScores: PlayerWeekScore[] = [];
      for (const team of prev.teams) {
        for (const origPlayer of [team.playerA, team.playerB]) {
          const { player } = getActivePlayer(prev, team.id, origPlayer, weekNumber);
          const holes: HoleScore[] = (scores[player.id] ?? []).map((gross, i) => ({
            hole: i + 1,
            gross,
          }));
          const grossTotal = holes.reduce((s, h) => s + (h.gross ?? 0), 0);
          const hcp = getPlayerHandicap(prev, player.id, weekNumber);
          newScores.push({
            playerId: player.id,
            weekNumber,
            holes,
            gross: grossTotal,
            handicap: hcp,
            net: grossTotal - hcp,
            netVsPar: grossTotal - hcp - course.totalPar,
          });
        }
      }
      return recalcAllHandicaps({
        ...prev,
        weeks: prev.weeks.map((w) =>
          w.weekNumber === weekNumber ? { ...w, scores: newScores } : w,
        ),
      });
    });
    navigate(`/weeks/${weekNumber}/results`);
  }

  if (!week) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>Week {weekNumber} not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Week {weekNumber} — Score Entry
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {new Date(week.date + "T12:00:00").toLocaleDateString()} — Par {course.totalPar}
      </Typography>

      {league.teams.map((team) => (
        <Paper key={team.id} sx={{ mb: 3, p: 2, overflow: "auto" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {team.name}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Player</TableCell>
                  {course.holes.map((h) => (
                    <TableCell key={h.number} align="center" sx={{ fontWeight: 700, minWidth: 50 }}>
                      {h.number}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        P{h.par}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Gross</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>HCP</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Net</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const { playerA, playerB } = getWeeklyRoles(league, team, weekNumber);
                  return [playerA, playerB].map((originalPlayer, idx) => {
                    const role = idx === 0 ? "A" : "B";
                    const { player, isSub } = getActivePlayer(league, team.id, originalPlayer, weekNumber);
                    const t = playerTotals[player.id];
                    return (
                      <TableRow key={player.id}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Chip
                              label={role}
                              size="small"
                              color={role === "A" ? "primary" : "secondary"}
                              sx={{ width: 28 }}
                            />
                            {player.name}
                            {isSub && (
                              <Chip label="sub" size="small" variant="outlined" color="warning" sx={{ ml: 0.5, height: 20, fontSize: "0.7rem" }} />
                            )}
                          </Box>
                        </TableCell>
                      {course.holes.map((h, i) => (
                        <TableCell key={h.number} align="center" sx={{ p: 0.5 }}>
                          <TextField
                            type="number"
                            size="small"
                            value={scores[player.id]?.[i] ?? ""}
                            onChange={(e) => updateHoleScore(player.id, i, e.target.value)}
                            inputProps={{ min: 1, max: 15, style: { textAlign: "center", width: 36, padding: "4px" } }}
                            variant="outlined"
                          />
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {t?.gross || "—"}
                      </TableCell>
                      <TableCell align="center">{t?.hcp ?? 0}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        {t?.complete ? t.net : "—"}
                      </TableCell>
                    </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate("/weeks")}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          Save & View Results
        </Button>
      </Box>
    </Box>
  );
}
