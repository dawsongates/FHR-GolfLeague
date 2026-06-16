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
  Tooltip,
  IconButton,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { Fragment, useState } from "react";
import { useLeague } from "../hooks/useLeague";
import { recalcAllHandicaps } from "../utils/league-data";

export function Handicaps() {
  const { league, updateLeague } = useLeague();
  const totalWeeks = Math.max(league.weeks.length + 1, 1); // show through next upcoming week

  // Local state for pre-season scores
  const [preSeasonScores, setPreSeasonScores] = useState<Record<string, number>>(() => ({
    ...league.preSeasonScores,
  }));

  // Local state for seeds
  const [seeds, setSeeds] = useState<Record<string, number>>(() => ({
    ...league.seedHandicaps,
  }));

  // Local state for overrides
  const [overrides, setOverrides] = useState<Record<string, Record<number, number>>>(() => ({
    ...league.handicapOverrides,
  }));

  function updateSeed(playerId: string, value: string) {
    const num = value === "" ? 0 : Math.max(0, Math.min(36, Number(value)));
    setSeeds((prev) => ({ ...prev, [playerId]: num }));
  }

  function toggleOverride(playerId: string, weekIdx: number, currentHcp: number) {
    setOverrides((prev) => {
      const playerOverrides = { ...(prev[playerId] ?? {}) };
      if (playerOverrides[weekIdx] !== undefined) {
        // Remove override — go back to auto
        delete playerOverrides[weekIdx];
      } else {
        // Set override to current value
        playerOverrides[weekIdx] = currentHcp;
      }
      return { ...prev, [playerId]: playerOverrides };
    });
  }

  function updateOverride(playerId: string, weekIdx: number, value: string) {
    const num = value === "" ? 0 : Math.max(0, Math.min(36, Number(value)));
    setOverrides((prev) => ({
      ...prev,
      [playerId]: { ...(prev[playerId] ?? {}), [weekIdx]: num },
    }));
  }

  function handleSave() {
    updateLeague((prev) => {
      const updated = {
        ...prev,
        seedHandicaps: { ...seeds },
        handicapOverrides: { ...overrides },
        preSeasonScores: { ...preSeasonScores },
      };
      return recalcAllHandicaps(updated);
    });
  }

  // Get gross score for a player in a given week (weekNumber is 1-indexed)
  function getPlayerGross(playerId: string, weekNumber: number): number | null {
    const week = league.weeks.find((w) => w.weekNumber === weekNumber);
    if (!week) return null;
    const score = week.scores.find((s) => s.playerId === playerId);
    return score?.gross ?? null;
  }

  // Compute preview handicaps using current local seeds/overrides
  function getPreviewHcp(playerId: string, weekIdx: number): { value: number; isOverride: boolean } {
    const hcp = league.handicaps[playerId]?.[weekIdx] ?? seeds[playerId] ?? 0;
    const isOverride = overrides[playerId]?.[weekIdx] !== undefined;
    const value = isOverride ? (overrides[playerId]?.[weekIdx] ?? 0) : hcp;
    return { value, isOverride };
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Handicaps</Typography>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          Save & Recalculate
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Set each player's <strong>Seed HC</strong> (starting handicap). Weekly handicaps auto-calculate
        from scores using: <code>MIN(20, TRUNC(0.85 × (avgGross − par)))</code>. Negative values indicate a plus handicap.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click the 🔓 icon on any week to override the auto-calculated value.
      </Typography>

      <TableContainer component={Paper} sx={{ overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, minWidth: 120, position: "sticky", left: 0, backgroundColor: "white", zIndex: 2 }}>
                Player
              </TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 70, backgroundColor: "#e8f5e9" }} align="center">
                Seed HC
              </TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 80, backgroundColor: "#e3f2fd" }} align="center">
                Wk 0<br />
                <Typography variant="caption" color="text.secondary">Gross</Typography>
              </TableCell>
              {Array.from({ length: totalWeeks }, (_, i) => (
                <Fragment key={`hdr-wk-${i + 1}`}>
                  <TableCell sx={{ fontWeight: 700, minWidth: 90 }} align="center">
                    HC {i + 1}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 60, backgroundColor: "#f3e5f5" }} align="center">
                    <Typography variant="caption" color="text.secondary">Wk {i + 1}</Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">Score</Typography>
                  </TableCell>
                </Fragment>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {league.teams.flatMap((team, teamIdx) => {
              const isShaded = teamIdx % 2 === 0;
              const bgColor = isShaded ? "#f5f5f5" : "white";
              return [team.playerA, team.playerB].map((player) => (
                <TableRow key={player.id}>
                  <TableCell sx={{ fontWeight: 600, position: "sticky", left: 0, backgroundColor: bgColor, zIndex: 1 }}>
                    {player.name}
                  </TableCell>
                  <TableCell align="center" sx={{ p: 0.5, backgroundColor: isShaded ? "#d7ecd9" : "#e8f5e9" }}>
                    <TextField
                      type="number"
                      size="small"
                      value={seeds[player.id] ?? 0}
                      onChange={(e) => updateSeed(player.id, e.target.value)}
                      inputProps={{ min: -10, max: 36, style: { textAlign: "center", width: 44, padding: "4px" } }}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ p: 0.5, backgroundColor: isShaded ? "#c8daf0" : "#e3f2fd" }}>
                    <TextField
                      type="number"
                      size="small"
                      value={preSeasonScores[player.id] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        setPreSeasonScores((prev) => ({ ...prev, [player.id]: val }));
                      }}
                      inputProps={{ min: 20, max: 80, style: { textAlign: "center", width: 44, padding: "4px" } }}
                      variant="outlined"
                      placeholder="—"
                    />
                  </TableCell>
                  {Array.from({ length: totalWeeks }, (_, weekIdx) => {
                    const { value, isOverride } = getPreviewHcp(player.id, weekIdx);
                    const gross = getPlayerGross(player.id, weekIdx + 1);
                    return (
                      <Fragment key={`${player.id}-wk-${weekIdx + 1}`}>
                        <TableCell align="center" sx={{ p: 0.5, backgroundColor: isOverride ? "#fff3e0" : bgColor }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25 }}>
                            {isOverride ? (
                              <TextField
                                type="number"
                                size="small"
                                value={overrides[player.id]?.[weekIdx] ?? value}
                                onChange={(e) => updateOverride(player.id, weekIdx, e.target.value)}
                                inputProps={{ min: -10, max: 36, style: { textAlign: "center", width: 44, padding: "4px" } }}
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" sx={{ minWidth: 28, fontWeight: 500 }}>
                                {value}
                              </Typography>
                            )}
                            <Tooltip title={isOverride ? "Remove override (use auto)" : "Override auto HC"}>
                              <IconButton
                                size="small"
                                onClick={() => toggleOverride(player.id, weekIdx, value)}
                                sx={{ p: 0.25 }}
                              >
                                {isOverride ? <LockIcon fontSize="small" color="warning" /> : <LockOpenIcon fontSize="small" sx={{ opacity: 0.3 }} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ p: 0.5, backgroundColor: isShaded ? "#ede7f6" : "#f3e5f5" }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: gross !== null ? "text.primary" : "text.disabled" }}>
                            {gross !== null ? gross : "—"}
                          </Typography>
                        </TableCell>
                      </Fragment>
                    );
                  })}
                </TableRow>
              ));
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- Substitute Players Section --- */}
      {league.subs.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>Substitute Players</Typography>
          <TableContainer component={Paper} sx={{ overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, minWidth: 120, position: "sticky", left: 0, backgroundColor: "white", zIndex: 2 }}>
                    Player
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 70, backgroundColor: "#e8f5e9" }} align="center">
                    Seed HC
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 80, backgroundColor: "#e3f2fd" }} align="center">
                    Wk 0<br />
                    <Typography variant="caption" color="text.secondary">Gross</Typography>
                  </TableCell>
                  {Array.from({ length: totalWeeks }, (_, i) => (
                    <Fragment key={`sub-hdr-wk-${i + 1}`}>
                      <TableCell sx={{ fontWeight: 700, minWidth: 90 }} align="center">
                        HC {i + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 60, backgroundColor: "#f3e5f5" }} align="center">
                        <Typography variant="caption" color="text.secondary">Wk {i + 1}</Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">Score</Typography>
                      </TableCell>
                    </Fragment>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {league.subs.map((sub, subIdx) => {
                  const isShaded = subIdx % 2 === 0;
                  const bgColor = isShaded ? "#f5f5f5" : "white";
                  return (
                    <TableRow key={sub.id}>
                      <TableCell sx={{ fontWeight: 600, position: "sticky", left: 0, backgroundColor: bgColor, zIndex: 1 }}>
                        {sub.name}
                      </TableCell>
                      <TableCell align="center" sx={{ p: 0.5, backgroundColor: isShaded ? "#d7ecd9" : "#e8f5e9" }}>
                        <TextField
                          type="number"
                          size="small"
                          value={seeds[sub.id] ?? 0}
                          onChange={(e) => updateSeed(sub.id, e.target.value)}
                          inputProps={{ min: -10, max: 36, style: { textAlign: "center", width: 44, padding: "4px" } }}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ p: 0.5, backgroundColor: isShaded ? "#c8daf0" : "#e3f2fd" }}>
                        <TextField
                          type="number"
                          size="small"
                          value={preSeasonScores[sub.id] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setPreSeasonScores((prev) => ({ ...prev, [sub.id]: val }));
                          }}
                          inputProps={{ min: 20, max: 80, style: { textAlign: "center", width: 44, padding: "4px" } }}
                          variant="outlined"
                          placeholder="—"
                        />
                      </TableCell>
                      {Array.from({ length: totalWeeks }, (_, weekIdx) => {
                        const { value, isOverride } = getPreviewHcp(sub.id, weekIdx);
                        const gross = getPlayerGross(sub.id, weekIdx + 1);
                        return (
                          <Fragment key={`sub-${sub.id}-wk-${weekIdx + 1}`}>
                            <TableCell align="center" sx={{ p: 0.5, backgroundColor: isOverride ? "#fff3e0" : bgColor }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25 }}>
                                {isOverride ? (
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={overrides[sub.id]?.[weekIdx] ?? value}
                                    onChange={(e) => updateOverride(sub.id, weekIdx, e.target.value)}
                                    inputProps={{ min: -10, max: 36, style: { textAlign: "center", width: 44, padding: "4px" } }}
                                    variant="outlined"
                                  />
                                ) : (
                                  <Typography variant="body2" sx={{ minWidth: 28, fontWeight: 500 }}>
                                    {value}
                                  </Typography>
                                )}
                                <Tooltip title={isOverride ? "Remove override (use auto)" : "Override auto HC"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => toggleOverride(sub.id, weekIdx, value)}
                                    sx={{ p: 0.25 }}
                                  >
                                    {isOverride ? <LockIcon fontSize="small" color="warning" /> : <LockOpenIcon fontSize="small" sx={{ opacity: 0.3 }} />}
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ p: 0.5, backgroundColor: isShaded ? "#ede7f6" : "#f3e5f5" }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: gross !== null ? "text.primary" : "text.disabled" }}>
                                {gross !== null ? gross : "—"}
                              </Typography>
                            </TableCell>
                          </Fragment>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
