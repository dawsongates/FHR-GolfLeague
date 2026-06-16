import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid2 as Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useState } from "react";
import { useLeague } from "../hooks/useLeague";
import type { SubPlayer, WeekSub } from "../types";

function generateSubId(): string {
  return `sub${Date.now().toString(36)}`;
}

export function Subs() {
  const { league, updateLeague } = useLeague();

  // --- Sub player CRUD state ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSub, setEditSub] = useState<SubPlayer | null>(null);
  const [subName, setSubName] = useState("");
  const [seedHcp, setSeedHcp] = useState("0");

  // --- Assignment state ---
  const [assignWeek, setAssignWeek] = useState<number>(league.weeks.length > 0 ? league.weeks[league.weeks.length - 1]?.weekNumber ?? 1 : 1);
  const [assignTeam, setAssignTeam] = useState("");
  const [assignAbsent, setAssignAbsent] = useState("");
  const [assignSub, setAssignSub] = useState("");

  // --- Sub CRUD ---
  function openAddDialog() {
    setEditSub(null);
    setSubName("");
    setSeedHcp("0");
    setDialogOpen(true);
  }

  function openEditDialog(sub: SubPlayer) {
    setEditSub(sub);
    setSubName(sub.name);
    setSeedHcp(String(league.seedHandicaps[sub.id] ?? 0));
    setDialogOpen(true);
  }

  function handleSave() {
    if (!subName.trim()) return;
    const hcp = Number(seedHcp) || 0;

    updateLeague((prev) => {
      if (editSub) {
        return {
          ...prev,
          subs: prev.subs.map((s) => (s.id === editSub.id ? { ...s, name: subName.trim() } : s)),
          seedHandicaps: { ...prev.seedHandicaps, [editSub.id]: hcp },
        };
      }
      const id = generateSubId();
      const newSub: SubPlayer = { id, name: subName.trim() };
      return {
        ...prev,
        subs: [...prev.subs, newSub],
        seedHandicaps: { ...prev.seedHandicaps, [id]: hcp },
      };
    });
    setDialogOpen(false);
  }

  function handleDelete(subId: string) {
    updateLeague((prev) => ({
      ...prev,
      subs: prev.subs.filter((s) => s.id !== subId),
      weekSubs: prev.weekSubs.filter((ws) => ws.subPlayerId !== subId),
    }));
  }

  // --- Assignment ---
  function handleAssign() {
    if (!assignTeam || !assignAbsent || !assignSub) return;

    const newAssignment: WeekSub = {
      weekNumber: assignWeek,
      teamId: assignTeam,
      absentPlayerId: assignAbsent,
      subPlayerId: assignSub,
    };

    updateLeague((prev) => {
      // Remove any existing assignment for same week/team/absent player
      const filtered = prev.weekSubs.filter(
        (ws) => !(ws.weekNumber === assignWeek && ws.teamId === assignTeam && ws.absentPlayerId === assignAbsent),
      );
      return { ...prev, weekSubs: [...filtered, newAssignment] };
    });

    // Reset selects
    setAssignAbsent("");
    setAssignSub("");
  }

  function removeAssignment(ws: WeekSub) {
    updateLeague((prev) => ({
      ...prev,
      weekSubs: prev.weekSubs.filter(
        (a) => !(a.weekNumber === ws.weekNumber && a.teamId === ws.teamId && a.absentPlayerId === ws.absentPlayerId),
      ),
    }));
  }

  // Players on the selected assignment team
  const selectedTeam = league.teams.find((t) => t.id === assignTeam);
  const teamPlayers = selectedTeam ? [selectedTeam.playerA, selectedTeam.playerB] : [];

  // Current assignments for the selected week
  const currentAssignments = league.weekSubs.filter((ws) => ws.weekNumber === assignWeek);

  return (
    <Box>
      {/* --- Sub Pool Section --- */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Substitute Players</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
          Add Sub
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage your pool of available substitutes. Assign them to fill in for absent team players on a per-week basis.
      </Typography>

      <Grid container spacing={2}>
        {league.subs.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              No subs yet — click "Add Sub" to get started.
            </Typography>
          </Grid>
        )}
        {league.subs.map((sub) => {
          const weeksPlayed = league.weeks.filter((w) => w.scores.some((s) => s.playerId === sub.id)).length;
          return (
            <Grid key={sub.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <Typography variant="h6">{sub.name}</Typography>
                    <Box>
                      <IconButton size="small" onClick={() => openEditDialog(sub)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(sub.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Chip label={`${weeksPlayed} wk${weeksPlayed !== 1 ? "s" : ""} played`} size="small" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* --- Weekly Assignment Section --- */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="h5" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <PersonAddIcon color="primary" /> Weekly Assignments
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Assign a sub to fill in for an absent player for a specific week.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Select
            size="small"
            value={String(assignWeek)}
            onChange={(e: SelectChangeEvent) => setAssignWeek(Number(e.target.value))}
            sx={{ minWidth: 100 }}
            displayEmpty
          >
            {league.weeks.length === 0 && <MenuItem value="1">Week 1</MenuItem>}
            {league.weeks.map((w) => (
              <MenuItem key={w.weekNumber} value={w.weekNumber}>
                Week {w.weekNumber}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={assignTeam}
            onChange={(e: SelectChangeEvent) => {
              setAssignTeam(e.target.value);
              setAssignAbsent("");
            }}
            displayEmpty
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="" disabled>Select Team</MenuItem>
            {league.teams.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={assignAbsent}
            onChange={(e: SelectChangeEvent) => setAssignAbsent(e.target.value)}
            displayEmpty
            sx={{ minWidth: 160 }}
            disabled={!assignTeam}
          >
            <MenuItem value="" disabled>Absent Player</MenuItem>
            {teamPlayers.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={assignSub}
            onChange={(e: SelectChangeEvent) => setAssignSub(e.target.value)}
            displayEmpty
            sx={{ minWidth: 160 }}
            disabled={league.subs.length === 0}
          >
            <MenuItem value="" disabled>Select Sub</MenuItem>
            {league.subs.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </Select>

          <Button
            variant="contained"
            size="small"
            onClick={handleAssign}
            disabled={!assignTeam || !assignAbsent || !assignSub}
          >
            Assign
          </Button>
        </Box>
      </Paper>

      {/* Active assignments for this week */}
      {currentAssignments.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Team</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Absent Player</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sub</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {currentAssignments.map((ws) => {
                const team = league.teams.find((t) => t.id === ws.teamId);
                const absent = team ? [team.playerA, team.playerB].find((p) => p.id === ws.absentPlayerId) : undefined;
                const sub = league.subs.find((s) => s.id === ws.subPlayerId);
                return (
                  <TableRow key={`${ws.weekNumber}-${ws.teamId}-${ws.absentPlayerId}`}>
                    <TableCell>Week {ws.weekNumber}</TableCell>
                    <TableCell>{team?.name ?? "?"}</TableCell>
                    <TableCell>{absent?.name ?? "?"}</TableCell>
                    <TableCell>
                      <Chip label={sub?.name ?? "?"} size="small" color="secondary" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => removeAssignment(ws)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* --- Add/Edit Sub Dialog --- */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editSub ? "Edit Sub" : "Add Sub"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important", minWidth: 300 }}>
          <TextField
            label="Player Name"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Seed Handicap"
            type="number"
            value={seedHcp}
            onChange={(e) => setSeedHcp(e.target.value)}
            inputProps={{ min: -10, max: 36 }}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!subName.trim()}>
            {editSub ? "Save" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
