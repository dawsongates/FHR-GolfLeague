import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { useState } from "react";
import { useLeague } from "../hooks/useLeague";
import { getWeeklyRoles, getActivePlayer, getPlayerHandicap } from "../utils/league-data";
import type { ScheduleMatchup } from "../types";

/**
 * Determines how many handicap strokes a player gets on each hole.
 * Returns a Map of hole number → stroke count (1 or 2).
 *
 * In head-to-head: the higher-HC player gets (diff) strokes distributed
 * by hole difficulty (hdcp 1 = hardest, gets strokes first).
 * If diff > 9, the extra strokes wrap back to the hardest holes (2 strokes).
 */
function getStrokeHoles(
  playerHc: number,
  opponentHc: number,
  courseHoles: { number: number; hdcp: number }[],
): Map<number, number> {
  const diff = playerHc - opponentHc;
  if (diff <= 0) return new Map(); // this player gives strokes or it's even

  // Sort holes by difficulty (hdcp 1 = hardest, gets strokes first)
  const sortedByDifficulty = [...courseHoles].sort((a, b) => a.hdcp - b.hdcp);

  const strokeMap = new Map<number, number>();
  for (let i = 0; i < diff; i++) {
    const holeIndex = i % sortedByDifficulty.length;
    const hole = sortedByDifficulty[holeIndex];
    if (hole) {
      strokeMap.set(hole.number, (strokeMap.get(hole.number) ?? 0) + 1);
    }
  }
  return strokeMap;
}

interface ScorecardData {
  weekNumber: number;
  startingHole: number;
  team1Name: string;
  team2Name: string;
  playerA1: { name: string; hc: number; strokeHoles: Map<number, number> };
  playerB1: { name: string; hc: number; strokeHoles: Map<number, number> };
  playerA2: { name: string; hc: number; strokeHoles: Map<number, number> };
  playerB2: { name: string; hc: number; strokeHoles: Map<number, number> };
}

export function Matchups() {
  const { league } = useLeague();
  const { teams, weeks, schedule, course } = league;

  const [selectedWeek, setSelectedWeek] = useState<number>(
    weeks.length > 0 ? (weeks[0]?.weekNumber ?? 1) : 1,
  );

  const weekSchedule = schedule.find((s) => s.weekNumber === selectedWeek);
  const weekData = weeks.find((w) => w.weekNumber === selectedWeek);

  function buildScorecardData(matchup: ScheduleMatchup): ScorecardData | null {
    const team1 = teams.find((t) => t.id === matchup.team1Id);
    const team2 = teams.find((t) => t.id === matchup.team2Id);
    if (!team1 || !team2) return null;

    // Get dynamic A/B roles
    const roles1 = getWeeklyRoles(league, team1, selectedWeek);
    const roles2 = getWeeklyRoles(league, team2, selectedWeek);

    // Resolve subs
    const active1A = getActivePlayer(league, team1.id, roles1.playerA, selectedWeek).player;
    const active1B = getActivePlayer(league, team1.id, roles1.playerB, selectedWeek).player;
    const active2A = getActivePlayer(league, team2.id, roles2.playerA, selectedWeek).player;
    const active2B = getActivePlayer(league, team2.id, roles2.playerB, selectedWeek).player;

    // Get handicaps
    const hc1A = getPlayerHandicap(league, active1A.id, selectedWeek);
    const hc1B = getPlayerHandicap(league, active1B.id, selectedWeek);
    const hc2A = getPlayerHandicap(league, active2A.id, selectedWeek);
    const hc2B = getPlayerHandicap(league, active2B.id, selectedWeek);

    // Compute stroke holes for each player (A vs A matchup, B vs B matchup)
    const strokeHoles1A = getStrokeHoles(hc1A, hc2A, course.holes);
    const strokeHoles2A = getStrokeHoles(hc2A, hc1A, course.holes);
    const strokeHoles1B = getStrokeHoles(hc1B, hc2B, course.holes);
    const strokeHoles2B = getStrokeHoles(hc2B, hc1B, course.holes);

    return {
      weekNumber: selectedWeek,
      startingHole: matchup.startingHole,
      team1Name: team1.name,
      team2Name: team2.name,
      playerA1: { name: active1A.name, hc: hc1A, strokeHoles: strokeHoles1A },
      playerB1: { name: active1B.name, hc: hc1B, strokeHoles: strokeHoles1B },
      playerA2: { name: active2A.name, hc: hc2A, strokeHoles: strokeHoles2A },
      playerB2: { name: active2B.name, hc: hc2B, strokeHoles: strokeHoles2B },
    };
  }

  const scorecards: ScorecardData[] = (weekSchedule?.matchups ?? [])
    .map(buildScorecardData)
    .filter((s): s is ScorecardData => s !== null);

  function handlePrint() {
    const container = document.querySelector(".print-container");
    if (!container) return;

    // Print from a clean iframe — zero MUI interference, landscape orientation
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

.print-container {
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

.scorecard-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scorecard-title {
  font-size: 13px;
  font-weight: 700;
  color: #000;
  font-family: Arial, sans-serif;
}

.scorecard-meta {
  font-size: 10px;
  color: #555;
  font-family: Arial, sans-serif;
}

.scorecard-start-hole {
  font-size: 16px;
  font-weight: 900;
  color: #1565c0;
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
  background: #1565c0;
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

.team-separator td {
  background: #e0e0e0;
  font-weight: 700;
  text-align: left;
  padding-left: 4px;
  font-size: 10px;
  border-top: 2px solid #000;
  height: 18px;
}

.team-label {
  font-size: 10px;
}

.player-row td {
  height: 24px;
}

.player-row .player-col {
  font-size: 10px;
  font-weight: 500;
}

.stroke-cell {
  background: #fff176;
  border: 1px solid #000;
}

.stroke-cell-2 {
  background: #ffca28;
  border: 1px solid #000;
}

.hc-badge {
  font-size: 9px;
  color: #555;
  margin-left: 2px;
}
</style>
</head>
<body>
${container.innerHTML}
</body>
</html>`);
    doc.close();

    // Wait for the iframe to render, then print
    const win = iframe.contentWindow;
    if (!win) { document.body.removeChild(iframe); return; }
    win.focus();
    setTimeout(() => {
      win.print();
      // Clean up after print dialog closes
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 250);
  }

  return (
    <Box>
      {/* Screen-only controls */}
      <Box className="no-print" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Matchup Scorecards</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Week</InputLabel>
            <Select
              value={selectedWeek}
              label="Week"
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
            >
              {weeks.map((w) => (
                <MenuItem key={w.weekNumber} value={w.weekNumber}>
                  Week {w.weekNumber} — {w.date}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={scorecards.length === 0}
          >
            Print Scorecards
          </Button>
        </Box>
      </Box>

      {scorecards.length === 0 ? (
        <Box className="no-print" sx={{ textAlign: "center", mt: 4 }}>
          <Typography color="text.secondary">
            No schedule found for this week. Generate a schedule first.
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" className="no-print" sx={{ mb: 2 }}>
            {scorecards.length} matchups — {Math.ceil(scorecards.length / 4)} page(s) when printed.
            Light yellow = 1 stroke, darker yellow = 2 strokes on that hole.
          </Typography>

          {/* Print container: plain HTML to avoid MUI class interference */}
          <div className="print-container">
            {scorecards.map((card) => (
              <div
                key={`card-${card.team1Name}-${card.team2Name}`}
                className="scorecard"
              >
                {/* Card header */}
                <div className="scorecard-header">
                  <div className="scorecard-header-row">
                    <span className="scorecard-title">
                      {card.team1Name} vs {card.team2Name}
                    </span>
                    <span className="scorecard-meta">
                      Wk {card.weekNumber} {weekData ? `— ${weekData.date}` : ""}
                    </span>
                  </div>
                  <div className="scorecard-start-hole">
                    Starting Hole: #{card.startingHole}
                  </div>
                </div>

                {/* Scorecard table */}
                <table className="scorecard-table">
                  <thead>
                    <tr>
                      <th className="player-col">Hole</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
                          <th key={`hdr-${hole}`} className="hole-col">
                            {hole}
                          </th>
                        ))}
                      <th className="total-col">TOT</th>
                    </tr>
                    <tr className="par-row">
                      <td className="player-col">Par</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => {
                        const holeData = course.holes.find((h) => h.number === hole);
                        return (
                          <td key={`par-${hole}`} className="hole-col">
                            {holeData?.par ?? ""}
                          </td>
                        );
                      })}
                      <td className="total-col">{course.totalPar}</td>
                    </tr>
                    <tr className="hdcp-row">
                      <td className="player-col">Hdcp</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => {
                        const holeData = course.holes.find((h) => h.number === hole);
                        return (
                          <td key={`hdcp-${hole}`} className="hole-col">
                            {holeData?.hdcp ?? ""}
                          </td>
                        );
                      })}
                      <td className="total-col" />
                    </tr>
                  </thead>
                  <tbody>
                    {/* Team 1 players */}
                    <tr className="team-separator">
                      <td colSpan={11} className="team-label">{card.team1Name}</td>
                    </tr>
                    <PlayerRow
                      label={`A: ${card.playerA1.name}`}
                      hc={card.playerA1.hc}
                      strokeHoles={card.playerA1.strokeHoles}
                      playingOrder={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                    />
                    <PlayerRow
                      label={`B: ${card.playerB1.name}`}
                      hc={card.playerB1.hc}
                      strokeHoles={card.playerB1.strokeHoles}
                      playingOrder={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                    />
                    {/* Team 2 players */}
                    <tr className="team-separator">
                      <td colSpan={11} className="team-label">{card.team2Name}</td>
                    </tr>
                    <PlayerRow
                      label={`A: ${card.playerA2.name}`}
                      hc={card.playerA2.hc}
                      strokeHoles={card.playerA2.strokeHoles}
                      playingOrder={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                    />
                    <PlayerRow
                      label={`B: ${card.playerB2.name}`}
                      hc={card.playerB2.hc}
                      strokeHoles={card.playerB2.strokeHoles}
                      playingOrder={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
                    />
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          /* Hide all MUI chrome and non-print elements */
          .no-print,
          header, nav,
          .MuiAppBar-root,
          .MuiDrawer-root,
          .MuiToolbar-root,
          .MuiDrawer-paper {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          /* Reset the page */
          @page {
            size: 8.5in 11in;
            margin: 0.2in;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 8.1in !important;
            height: 10.6in !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Kill all MUI Box padding/margin — but NOT our print container or its children */
          body *[class*="MuiBox"],
          body *[class*="css-"],
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: auto !important;
            display: block !important;
          }

          /* The print container uses float-based layout — plain divs, no MUI classes */
          .print-container {
            display: block !important;
            width: 8.1in !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          .scorecard {
            float: left !important;
            display: block !important;
            width: 3.95in !important;
            height: 5.15in !important;
            box-sizing: border-box !important;
            padding: 0.1in !important;
            margin: 0 !important;
            border: 1px dashed #999 !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: white !important;
          }

          /* Force page break after every 4th card */
          .scorecard:nth-child(4n) {
            break-after: page !important;
            page-break-after: always !important;
          }

          /* Start each row on the left */
          .scorecard:nth-child(2n+1) {
            clear: left !important;
          }

          /* Force table borders in print */
          .scorecard-table th,
          .scorecard-table td {
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Stroke cells: keep border AND background */
          .scorecard-table td.stroke-cell {
            background: #fff176 !important;
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .scorecard-table td.stroke-cell-2 {
            background: #ffca28 !important;
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Screen preview: show as 2x2 grid */
        @media screen {
          .print-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .scorecard {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            background: white;
          }
        }

        /* Scorecard internal styles (shared between screen and print) */
        .scorecard-header {
          margin-bottom: 4px;
          padding-bottom: 3px;
          border-bottom: 1px solid #ccc;
        }

        .scorecard-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .scorecard-title {
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #000;
          font-family: Arial, sans-serif;
        }

        .scorecard-meta {
          font-size: 9px;
          color: #555;
          white-space: nowrap;
          font-family: Arial, sans-serif;
        }

        .scorecard-start-hole {
          font-size: 16px;
          font-weight: 900;
          color: #1565c0;
          margin-top: 4px;
          text-align: center;
          font-family: Arial, sans-serif;
          letter-spacing: 0.5px;
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
          background: #1565c0 !important;
          color: white !important;
          font-weight: 700;
          font-size: 10px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
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

        .hole-col {
          width: auto;
        }

        .total-col {
          width: 8% !important;
          font-weight: 700;
        }

        .par-row td {
          background: #c8e6c9 !important;
          font-weight: 700;
          font-size: 10px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .hdcp-row td {
          background: #eeeeee !important;
          font-size: 9px;
          color: #555;
          font-style: italic;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .team-separator td {
          background: #e0e0e0 !important;
          font-weight: 700;
          text-align: left !important;
          padding-left: 4px !important;
          font-size: 9px;
          border-top: 2px solid #000;
          height: 16px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .team-label {
          font-size: 9px;
        }

        .player-row td {
          height: 22px;
        }

        .player-row .player-col {
          font-size: 9px;
          font-weight: 500;
        }

        .stroke-cell {
          background: #fff176 !important;
          border: 1px solid #000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .stroke-cell-2 {
          background: #ffca28 !important;
          border: 1px solid #000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .hc-badge {
          font-size: 8px;
          color: #555;
          margin-left: 2px;
        }
      `}</style>
    </Box>
  );
}

function PlayerRow({
  label,
  hc,
  strokeHoles,
  playingOrder,
}: {
  label: string;
  hc: number;
  strokeHoles: Map<number, number>;
  playingOrder: number[];
}) {
  return (
    <tr className="player-row">
      <td className="player-col">
        {label} <span className="hc-badge">({hc})</span>
      </td>
      {playingOrder.map((hole) => {
        const strokes = strokeHoles.get(hole) ?? 0;
        const cellClass = strokes >= 2 ? "stroke-cell-2" : strokes === 1 ? "stroke-cell" : "";
        return (
          <td
            key={`score-${hole}`}
            className={cellClass}
          />
        );
      })}
      <td className="total-col" />
    </tr>
  );
}
