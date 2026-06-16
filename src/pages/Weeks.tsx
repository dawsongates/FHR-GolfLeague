import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ScorecardIcon from "@mui/icons-material/Scoreboard";
import ResultsIcon from "@mui/icons-material/Assessment";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearIcon from "@mui/icons-material/LayersClear";
import SortIcon from "@mui/icons-material/SortByAlpha";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "../hooks/useLeague";
import { addWeek } from "../utils/league-data";

export function Weeks() {
  const { league, updateLeague } = useLeague();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0] ?? "");
  const [isPlayoff, setIsPlayoff] = useState(false);

  function handleAddWeek() {
    updateLeague((prev) => {
      const updated = addWeek(prev, date, isPlayoff);
      // Auto-sort by date and re-number
      const sorted = [...updated.weeks].sort((a, b) => a.date.localeCompare(b.date));
      const renumbered = sorted.map((w, i) => ({ ...w, weekNumber: i + 1 }));
      return { ...updated, weeks: renumbered };
    });
    setDialogOpen(false);
    setIsPlayoff(false);
  }

  function handleDeleteWeek(weekNumber: number) {
    updateLeague((prev) => ({
      ...prev,
      weeks: prev.weeks
        .filter((w) => w.weekNumber !== weekNumber)
        .map((w, i) => ({ ...w, weekNumber: i + 1 })),
    }));
  }

  function handleClearScores(weekNumber: number) {
    updateLeague((prev) => ({
      ...prev,
      weeks: prev.weeks.map((w) =>
        w.weekNumber === weekNumber ? { ...w, scores: [], matches: [] } : w,
      ),
    }));
  }

  function handleSortByDate() {
    updateLeague((prev) => {
      const sorted = [...prev.weeks].sort((a, b) => a.date.localeCompare(b.date));
      const renumbered = sorted.map((w, i) => ({ ...w, weekNumber: i + 1 }));
      return { ...prev, weeks: renumbered };
    });
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Weeks</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {league.weeks.length > 1 && (
            <Button variant="outlined" startIcon={<SortIcon />} onClick={handleSortByDate} size="small">
              Sort by Date
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Add Week
          </Button>
        </Box>
      </Box>

      {league.weeks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            No weeks yet — click "Add Week" to get started!
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Scores</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Matches</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {league.weeks.map((week) => (
                <TableRow key={week.weekNumber} hover>
                  <TableCell sx={{ fontWeight: 600 }}>Week {week.weekNumber}</TableCell>
                  <TableCell>{new Date(`${week.date}T12:00:00`).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={week.isPlayoff ? "Playoff" : "Regular"}
                      color={week.isPlayoff ? "secondary" : "primary"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{week.scores.length} entered</TableCell>
                  <TableCell>{week.matches.length} matches</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<ScorecardIcon />}
                      onClick={() => navigate(`/weeks/${week.weekNumber}/scores`)}
                      sx={{ mr: 1 }}
                    >
                      Scores
                    </Button>
                    <Button
                      size="small"
                      startIcon={<ResultsIcon />}
                      onClick={() => navigate(`/weeks/${week.weekNumber}/results`)}
                      sx={{ mr: 1 }}
                    >
                      Results
                    </Button>
                    <Tooltip title="Clear scores & matches for this week">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleClearScores(week.weekNumber)}
                        disabled={week.scores.length === 0 && week.matches.length === 0}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete week">
                      <IconButton size="small" color="error" onClick={() => handleDeleteWeek(week.weekNumber)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add Week {league.weeks.length + 1}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important", minWidth: 300 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={<Checkbox checked={isPlayoff} onChange={(e) => setIsPlayoff(e.target.checked)} />}
            label="Playoff week"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddWeek}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
