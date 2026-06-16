import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useState } from "react";
import { useLeague } from "../hooks/useLeague";

export function Notes() {
  const { league, updateLeague } = useLeague();
  const { weeks, notes } = league;

  // Local state: map weekNumber -> text
  const [localNotes, setLocalNotes] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const note of notes) {
      map[note.weekNumber] = note.text;
    }
    return map;
  });

  function handleSave() {
    const newNotes = Object.entries(localNotes)
      .filter(([, text]) => text.trim().length > 0)
      .map(([weekNum, text]) => ({ weekNumber: Number(weekNum), text }));
    updateLeague((prev) => ({ ...prev, notes: newNotes }));
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Notes</Typography>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          Save Notes
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Quick notes per week — subs needed, reminders, special rules, etc.
      </Typography>

      {weeks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">Add weeks first to start taking notes.</Typography>
        </Paper>
      ) : (
        weeks.map((week) => (
          <Paper key={`note-wk-${week.weekNumber}`} sx={{ mb: 2, p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Week {week.weekNumber} — {week.date}
            </Typography>
            <TextField
              multiline
              minRows={2}
              maxRows={6}
              fullWidth
              placeholder="Add notes for this week..."
              value={localNotes[week.weekNumber] ?? ""}
              onChange={(e) => setLocalNotes((prev) => ({ ...prev, [week.weekNumber]: e.target.value }))}
              variant="outlined"
              size="small"
            />
          </Paper>
        ))
      )}
    </Box>
  );
}
