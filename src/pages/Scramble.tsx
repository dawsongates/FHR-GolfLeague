import {
  Box,
  Typography,
  Button,
  Autocomplete,
  TextField,
  IconButton,
  Paper,
  Chip,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import { useLeague } from "../hooks/useLeague";

interface ScrambleGroup {
  id: number;
  players: string[]; // player names (free text or selected)
  startingHole: number;
}

export function Scramble() {
  const { league } = useLeague();
  const { teams, subs, course } = league;

  // Build a flat list of all known player names for the autocomplete
  const allPlayers: string[] = [
    ...teams.flatMap((t) => [t.playerA.name, t.playerB.name]),
    ...subs.map((s) => s.name),
  ].sort();

  const [groups, setGroups] = useState<ScrambleGroup[]>([
    { id: 1, players: ["", "", "", ""], startingHole: 1 },
  ]);

  function addGroup() {
    const nextId = Math.max(...groups.map((g) => g.id), 0) + 1;
    // Auto-assign next starting hole (skip hole 5)
    const usedHoles = groups.map((g) => g.startingHole);
    const available = [1, 2, 3, 4, 6, 7, 8, 9].filter((h) => !usedHoles.includes(h));
    const nextHole = available[0] ?? 1;
    setGroups([...groups, { id: nextId, players: ["", "", "", ""], startingHole: nextHole }]);
  }

  function removeGroup(id: number) {
    setGroups(groups.filter((g) => g.id !== id));
  }

  function updatePlayer(groupId: number, playerIndex: number, value: string) {
    setGroups(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, players: g.players.map((p, i) => (i === playerIndex ? value : p)) }
          : g,
      ),
    );
  }

  function updateStartingHole(groupId: number, hole: number) {
    setGroups(groups.map((g) => (g.id === groupId ? { ...g, startingHole: hole } : g)));
  }

  // Get players already assigned to other groups (for filtering suggestions)
  function getAssignedPlayers(excludeGroupId: number): Set<string> {
    const assigned = new Set<string>();
    for (const g of groups) {
      if (g.id === excludeGroupId) continue;
      for (const p of g.players) {
        if (p) assigned.add(p);
      }
    }
    return assigned;
  }

  function handlePrint() {
    const container = document.querySelector(".scramble-print-container");
    if (!container) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-10000px";
    iframe.style.left = "-10000px";
    iframe.style.width = "11in";
    iframe.style.height = "8.5in";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
<style>
@page {
  size: landscape;
  margin: 0.2in;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 10.6in;
  height: 8.1in;
  margin: 0;
  padding: 0;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.scramble-print-container {
  width: 10.6in;
  padding: 0;
  margin: 0;
}

.scorecard {
  float: left;
  width: 5.2in;
  height: 3.95in;
  padding: 0.1in;
  margin: 0;
  border: 1px dashed #999;
  overflow: hidden;
  page-break-inside: avoid;
  break-inside: avoid;
}

.scorecard:nth-child(4n) {
  page-break-after: always;
  break-after: page;
}

.scorecard:nth-child(2n+1) {
  clear: left;
}

.scorecard-header {
  margin-bottom: 5px;
  padding-bottom: 4px;
  border-bottom: 1px solid #ccc;
}

.scorecard-title {
  font-size: 14px;
  font-weight: 700;
  color: #000;
  font-family: Arial, sans-serif;
  text-align: center;
}

.scorecard-start-hole {
  font-size: 16px;
  font-weight: 900;
  color: #2e7d32;
  margin-top: 4px;
  text-align: center;
  font-family: Arial, sans-serif;
  letter-spacing: 0.5px;
}

.scorecard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  font-family: Arial, sans-serif;
  table-layout: fixed;
  margin-top: 4px;
}

.scorecard-table th,
.scorecard-table td {
  border: 1px solid #000;
  text-align: center;
  padding: 3px 2px;
  height: 22px;
}

.scorecard-table th {
  background: #2e7d32;
  color: white;
  font-weight: 700;
  font-size: 11px;
}

.player-col {
  width: 26%;
  text-align: left;
  padding-left: 4px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 0;
}

.hole-col {
  width: auto;
}

.total-col {
  width: 8%;
  font-weight: 700;
}

.par-row td {
  background: #c8e6c9;
  font-weight: 700;
  font-size: 11px;
}

.hdcp-row td {
  background: #eee;
  font-size: 10px;
  color: #555;
  font-style: italic;
}

.player-row td {
  height: 24px;
}

.player-row .player-col {
  font-size: 10px;
  font-weight: 500;
}

.best-ball-row td {
  background: #e8f5e9;
  font-weight: 700;
  font-size: 11px;
  border-top: 2px solid #2e7d32;
}
</style>
</head>
<body>
${container.innerHTML}
</body>
</html>`);
    doc.close();

    const win = iframe.contentWindow;
    if (!win) { document.body.removeChild(iframe); return; }
    win.focus();
    setTimeout(() => {
      win.print();
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 250);
  }

  const validGroups = groups.filter((g) => g.players.filter((p) => p.trim()).length >= 2);

  return (
    <Box>
      <Box className="no-print" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Scramble Scorecards</Typography>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={validGroups.length === 0}
          color="success"
        >
          Print Scorecards
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" className="no-print" sx={{ mb: 3 }}>
        Build custom scramble groups — select 4 players per scorecard. No handicaps applied.
      </Typography>

      {/* Group builder */}
      <Box className="no-print" sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
        {groups.map((group) => {
          const assigned = getAssignedPlayers(group.id);
          const available = allPlayers.filter((p) => !assigned.has(p));

          return (
            <Paper key={group.id} sx={{ p: 2 }} elevation={2}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Group {group.id}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    label="Start Hole"
                    type="number"
                    size="small"
                    value={group.startingHole}
                    onChange={(e) => updateStartingHole(group.id, Number(e.target.value))}
                    inputProps={{ min: 1, max: 9 }}
                    sx={{ width: 100 }}
                  />
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => removeGroup(group.id)}
                    disabled={groups.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                {group.players.map((player, idx) => (
                  <Autocomplete
                    key={`${group.id}-${idx}`}
                    freeSolo
                    options={available}
                    value={player}
                    onInputChange={(_e, value) => updatePlayer(group.id, idx, value)}
                    renderInput={(params) => (
                      <TextField {...params} label={`Player ${idx + 1}`} size="small" />
                    )}
                    size="small"
                  />
                ))}
              </Box>
              {group.players.filter((p) => p.trim()).length > 0 && (
                <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {group.players.filter((p) => p.trim()).map((p) => (
                    <Chip key={p} label={p} size="small" color="success" variant="outlined" />
                  ))}
                </Box>
              )}
            </Paper>
          );
        })}

        <Button variant="outlined" startIcon={<AddIcon />} onClick={addGroup} color="success">
          Add Group
        </Button>
      </Box>

      {/* Print preview / container */}
      {validGroups.length > 0 && (
        <>
          <Typography variant="h6" className="no-print" sx={{ mb: 2 }}>
            Preview ({validGroups.length} scorecard{validGroups.length > 1 ? "s" : ""})
          </Typography>
          <div className="scramble-print-container">
            {validGroups.map((group) => {
              const players = group.players.filter((p) => p.trim());
              return (
                <div key={group.id} className="scorecard">
                  <div className="scorecard-header">
                    <div className="scorecard-title">
                      Scramble — Group {group.id}
                    </div>
                    <div className="scorecard-start-hole">
                      Starting Hole: #{group.startingHole}
                    </div>
                  </div>
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th className="player-col">Hole</th>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                          <th key={`hdr-${hole}`} className="hole-col">{hole}</th>
                        ))}
                        <th className="total-col">TOT</th>
                      </tr>
                      <tr className="par-row">
                        <td className="player-col">Par</td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => {
                          const holeData = course.holes.find((h) => h.number === hole);
                          return <td key={`par-${hole}`} className="hole-col">{holeData?.par ?? ""}</td>;
                        })}
                        <td className="total-col">{course.totalPar}</td>
                      </tr>
                      <tr className="hdcp-row">
                        <td className="player-col">Hdcp</td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => {
                          const holeData = course.holes.find((h) => h.number === hole);
                          return <td key={`hdcp-${hole}`} className="hole-col">{holeData?.hdcp ?? ""}</td>;
                        })}
                        <td className="total-col" />
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((name) => (
                        <tr key={name} className="player-row">
                          <td className="player-col">{name}</td>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                            <td key={`s-${hole}`} />
                          ))}
                          <td className="total-col" />
                        </tr>
                      ))}
                      {/* Best ball row */}
                      <tr className="best-ball-row">
                        <td className="player-col">BEST BALL</td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                          <td key={`bb-${hole}`} />
                        ))}
                        <td className="total-col" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Screen styles for preview */}
      <style>{`
        @media screen {
          .scramble-print-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .scramble-print-container .scorecard {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            background: white;
          }

          .scorecard-header {
            margin-bottom: 4px;
            padding-bottom: 3px;
            border-bottom: 1px solid #ccc;
          }

          .scorecard-title {
            font-size: 13px;
            font-weight: 700;
            text-align: center;
            color: #000;
            font-family: Arial, sans-serif;
          }

          .scorecard-start-hole {
            font-size: 16px;
            font-weight: 900;
            color: #2e7d32;
            margin-top: 4px;
            text-align: center;
            font-family: Arial, sans-serif;
          }

          .scorecard-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            font-family: Arial, sans-serif;
            table-layout: fixed;
            margin-top: 4px;
          }

          .scorecard-table th,
          .scorecard-table td {
            border: 1px solid #000;
            text-align: center;
            padding: 2px 1px;
            height: 20px;
          }

          .scorecard-table th {
            background: #2e7d32 !important;
            color: white !important;
            font-weight: 700;
            font-size: 10px;
          }

          .player-col {
            width: 28% !important;
            text-align: left !important;
            padding-left: 4px !important;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 0;
          }

          .total-col {
            width: 8% !important;
            font-weight: 700;
          }

          .par-row td {
            background: #c8e6c9 !important;
            font-weight: 700;
            font-size: 10px;
          }

          .hdcp-row td {
            background: #eee !important;
            font-size: 9px;
            color: #555;
            font-style: italic;
          }

          .player-row td {
            height: 22px;
          }

          .player-row .player-col {
            font-size: 9px;
            font-weight: 500;
          }

          .best-ball-row td {
            background: #e8f5e9 !important;
            font-weight: 700;
            font-size: 10px;
            border-top: 2px solid #2e7d32;
          }
        }
      `}</style>
    </Box>
  );
}
