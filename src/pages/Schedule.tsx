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
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
} from "@mui/material";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useState } from "react";
import { useLeague } from "../hooks/useLeague";
import { generateRandomSchedule } from "../utils/league-data";
import type { ScheduleMatchup, WeekSchedule } from "../types";

const STARTING_HOLES = [1, 2, 3, 4, 6, 7, 8, 9];

export function Schedule() {
  const { league, updateLeague } = useLeague();
  const { teams, schedule, weeks } = league;

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<{
    weekIdx: number;
    matchIdx: number;
    matchup: ScheduleMatchup;
  } | null>(null);

  // Team filter
  const [filterTeamId, setFilterTeamId] = useState<string>("");

  function handleGenerateSchedule() {
    const numWeeks = weeks.length || 8;
    const teamIds = teams.map((t) => t.id);
    const weekDates = weeks.map((w) => w.date);
    const newSchedule = generateRandomSchedule(teamIds, numWeeks, weekDates);
    updateLeague((prev) => ({ ...prev, schedule: newSchedule }));
  }

  function getTeamName(teamId: string): string {
    return teams.find((t) => t.id === teamId)?.name ?? "???";
  }

  function handleEditOpen(weekIdx: number, matchIdx: number) {
    const weekSched = schedule[weekIdx];
    if (!weekSched) return;
    const matchup = weekSched.matchups[matchIdx];
    if (!matchup) return;
    setEditDialog({ weekIdx, matchIdx, matchup: { ...matchup } });
  }

  function handleEditSave() {
    if (!editDialog) return;
    const { weekIdx, matchIdx, matchup } = editDialog;

    updateLeague((prev) => {
      const newSchedule = [...prev.schedule];
      const weekSched = newSchedule[weekIdx];
      if (!weekSched) return prev;
      const newMatchups = [...weekSched.matchups];
      newMatchups[matchIdx] = matchup;
      newSchedule[weekIdx] = { ...weekSched, matchups: newMatchups };
      return { ...prev, schedule: newSchedule };
    });
    setEditDialog(null);
  }

  // Validation: check for duplicates or teams playing themselves
  function getScheduleIssues(sched: WeekSchedule[]): string[] {
    const issues: string[] = [];
    const pairingCount = new Map<string, number>();

    for (const week of sched) {
      const teamsThisWeek = new Set<string>();
      for (const m of week.matchups) {
        if (m.team1Id === m.team2Id) {
          issues.push(`Week ${week.weekNumber}: team playing itself`);
        }
        if (teamsThisWeek.has(m.team1Id)) issues.push(`Week ${week.weekNumber}: ${getTeamName(m.team1Id)} appears twice`);
        if (teamsThisWeek.has(m.team2Id)) issues.push(`Week ${week.weekNumber}: ${getTeamName(m.team2Id)} appears twice`);
        teamsThisWeek.add(m.team1Id);
        teamsThisWeek.add(m.team2Id);

        const key = [m.team1Id, m.team2Id].sort().join("-");
        pairingCount.set(key, (pairingCount.get(key) ?? 0) + 1);
      }
    }

    for (const [key, count] of pairingCount) {
      if (count > 1) {
        const [t1, t2] = key.split("-");
        issues.push(`${getTeamName(t1 ?? "")} vs ${getTeamName(t2 ?? "")} scheduled ${count} times`);
      }
    }

    return issues;
  }

  const issues = getScheduleIssues(schedule);

  // Filter schedule for selected team
  const filteredSchedule = filterTeamId
    ? schedule.map((ws) => ({
        ...ws,
        matchups: ws.matchups.filter((m) => m.team1Id === filterTeamId || m.team2Id === filterTeamId),
      })).filter((ws) => ws.matchups.length > 0)
    : schedule;

  // Team schedule summary for the filter view
  function getTeamOpponent(matchup: ScheduleMatchup): string {
    if (matchup.team1Id === filterTeamId) return getTeamName(matchup.team2Id);
    return getTeamName(matchup.team1Id);
  }

  // Lock state — prevents accidental schedule regeneration
  const [locked, setLocked] = useState(true);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Season Schedule</Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant={locked ? "outlined" : "contained"}
            color={locked ? "success" : "warning"}
            startIcon={locked ? <LockIcon /> : <LockOpenIcon />}
            onClick={() => setLocked(!locked)}
            size="small"
          >
            {locked ? "Locked" : "Unlocked"}
          </Button>
          <Button variant="contained" startIcon={<ShuffleIcon />} onClick={handleGenerateSchedule} disabled={locked}>
            Generate Random Schedule
          </Button>
        </Box>
      </Box>

      {schedule.length > 0 && (
        <FormControl size="small" sx={{ mb: 2, minWidth: 220 }}>
          <InputLabel>Filter by Team</InputLabel>
          <Select
            value={filterTeamId}
            onChange={(e) => setFilterTeamId(e.target.value)}
            label="Filter by Team"
          >
            <MenuItem value="">All Teams</MenuItem>
            {teams.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Team-specific schedule card */}
      {filterTeamId && filteredSchedule.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: "#e3f2fd" }}>
          <Typography variant="h6" gutterBottom>{getTeamName(filterTeamId)} — Season Schedule</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Opponent</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Starting Hole</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchedule.map((ws) => {
                const matchup = ws.matchups[0];
                if (!matchup) return null;
                const weekData = weeks.find((w) => w.weekNumber === ws.weekNumber);
                return (
                  <TableRow key={`team-sched-${ws.weekNumber}`}>
                    <TableCell>Week {ws.weekNumber}</TableCell>
                    <TableCell>{weekData?.date ?? "—"}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{getTeamOpponent(matchup)}</TableCell>
                    <TableCell><Chip label={`#${matchup.startingHole}`} size="small" color="primary" variant="outlined" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {issues.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "#fff3e0" }}>
          <Typography variant="subtitle2" color="warning.main" gutterBottom>Schedule Issues:</Typography>
          {issues.map((issue) => (
            <Typography key={`issue-${issue}`} variant="body2" color="text.secondary">• {issue}</Typography>
          ))}
        </Paper>
      )}

      {schedule.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            No schedule yet. Click "Generate Random Schedule" to create one, or add weeks first.
          </Typography>
        </Paper>
      ) : (
        filteredSchedule.map((weekSched, weekIdx) => {
          const weekData = weeks.find((w) => w.weekNumber === weekSched.weekNumber);
          // Find the actual index in the full schedule for editing
          const realWeekIdx = schedule.findIndex((s) => s.weekNumber === weekSched.weekNumber);
          return (
            <Accordion key={`week-${weekSched.weekNumber}`} defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "primary.main", color: "white", "&.Mui-expanded": { minHeight: 48 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", pr: 2 }}>
                  <Typography variant="h6" sx={{ color: "white" }}>Week {weekSched.weekNumber}</Typography>
                  {weekData && <Typography variant="body2" sx={{ opacity: 0.8, color: "white" }}>{weekData.date}</Typography>}
                  <Chip label={`${weekSched.matchups.length} matchups`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }} />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 80 }}>Hole</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Team 1</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 40 }} align="center">vs</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Team 2</TableCell>
                        <TableCell sx={{ width: 50 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...weekSched.matchups].sort((a, b) => a.startingHole - b.startingHole).map((matchup) => {
                        // Find real matchIdx in the full schedule
                        const realMatchIdx = schedule[realWeekIdx]?.matchups.findIndex(
                          (m) => m.team1Id === matchup.team1Id && m.team2Id === matchup.team2Id,
                        ) ?? 0;
                        return (
                          <TableRow key={`${weekSched.weekNumber}-${matchup.team1Id}-${matchup.team2Id}`}>
                            <TableCell>
                              <Chip label={`#${matchup.startingHole}`} size="small" color="primary" variant="outlined" />
                            </TableCell>
                            <TableCell>{getTeamName(matchup.team1Id)}</TableCell>
                            <TableCell align="center" sx={{ color: "text.secondary" }}>vs</TableCell>
                            <TableCell>{getTeamName(matchup.team2Id)}</TableCell>
                            <TableCell>
                              <Button size="small" onClick={() => handleEditOpen(realWeekIdx, realMatchIdx)}>
                                <EditIcon fontSize="small" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          );
        })
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog !== null} onClose={() => setEditDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Matchup — Week {editDialog ? schedule[editDialog.weekIdx]?.weekNumber : ""}</DialogTitle>
        <DialogContent>
          {editDialog && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Team 1</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={editDialog.matchup.team1Id}
                  onChange={(e) => setEditDialog({ ...editDialog, matchup: { ...editDialog.matchup, team1Id: e.target.value } })}
                >
                  {teams.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Team 2</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={editDialog.matchup.team2Id}
                  onChange={(e) => setEditDialog({ ...editDialog, matchup: { ...editDialog.matchup, team2Id: e.target.value } })}
                >
                  {teams.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Starting Hole</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={editDialog.matchup.startingHole}
                  onChange={(e) => setEditDialog({ ...editDialog, matchup: { ...editDialog.matchup, startingHole: Number(e.target.value) } })}
                >
                  {STARTING_HOLES.map((h) => (
                    <MenuItem key={h} value={h}>Hole #{h}</MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
