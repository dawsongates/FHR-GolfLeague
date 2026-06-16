import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid2 as Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";
import { useLeague } from "../hooks/useLeague";
import { getWeeklyRoles } from "../utils/league-data";
import type { Team, Player } from "../types";

function generateId(): string {
  return `t${Date.now().toString(36)}`;
}

export function Teams() {
  const { league, updateLeague } = useLeague();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [playerAName, setPlayerAName] = useState("");
  const [playerBName, setPlayerBName] = useState("");

  function openAddDialog() {
    setEditTeam(null);
    setTeamName("");
    setPlayerAName("");
    setPlayerBName("");
    setDialogOpen(true);
  }

  function openEditDialog(team: Team) {
    setEditTeam(team);
    setTeamName(team.name);
    setPlayerAName(team.playerA.name);
    setPlayerBName(team.playerB.name);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!playerAName.trim() || !playerBName.trim()) return;

    updateLeague((prev) => {
      if (editTeam) {
        // Update existing
        return {
          ...prev,
          teams: prev.teams.map((t) =>
            t.id === editTeam.id
              ? {
                  ...t,
                  name: teamName.trim() || `${playerAName.trim()} / ${playerBName.trim()}`,
                  playerA: { ...t.playerA, name: playerAName.trim() },
                  playerB: { ...t.playerB, name: playerBName.trim() },
                }
              : t,
          ),
        };
      }
      // Add new
      const id = generateId();
      const newTeam: Team = {
        id,
        name: teamName.trim() || `${playerAName.trim()} / ${playerBName.trim()}`,
        playerA: { id: `${id}a`, name: playerAName.trim(), role: "A" as const, teamId: id },
        playerB: { id: `${id}b`, name: playerBName.trim(), role: "B" as const, teamId: id },
      };
      return { ...prev, teams: [...prev.teams, newTeam] };
    });
    setDialogOpen(false);
  }

  function handleDelete(teamId: string) {
    updateLeague((prev) => ({
      ...prev,
      teams: prev.teams.filter((t) => t.id !== teamId),
    }));
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Teams</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
          Add Team
        </Button>
      </Box>

      <Grid container spacing={2}>
        {league.teams.map((team) => {
          const currentWeek = league.weeks.length > 0 ? league.weeks.length : 1;
          const roles = getWeeklyRoles(league, team, currentWeek);
          return (
            <Grid key={team.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <Typography variant="h6" gutterBottom>
                      {team.name}
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => openEditDialog(team)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(team.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Chip label={`A: ${roles.playerA.name}`} color="primary" size="small" />
                    <Chip label={`B: ${roles.playerB.name}`} color="secondary" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editTeam ? "Edit Team" : "Add Team"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important", minWidth: 300 }}>
          <TextField
            label="Team Name (optional — defaults to Player A / Player B)"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Player A (lower handicap)"
            value={playerAName}
            onChange={(e) => setPlayerAName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Player B (higher handicap)"
            value={playerBName}
            onChange={(e) => setPlayerBName(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!playerAName.trim() || !playerBName.trim()}>
            {editTeam ? "Save" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
