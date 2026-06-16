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
  Checkbox,
  TextField,
  Button,
  Tabs,
  Tab,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import { useLeague } from "../hooks/useLeague";
import type { PlayerPayment } from "../types";

export function Finance() {
  const { league, updateLeague } = useLeague();
  const { teams, weeks, payments } = league;

  const [tab, setTab] = useState(0); // 0 = by week, 1 = by player summary

  // Build a map: `${playerId}-${weekNumber}` -> PaymentRecord
  const [localPayments, setLocalPayments] = useState<Record<string, PlayerPayment>>(() => {
    const map: Record<string, PlayerPayment> = {};
    for (const p of payments) {
      map[`${p.playerId}-${p.weekNumber}`] = p;
    }
    return map;
  });

  // All players (from teams)
  const allPlayers = teams.flatMap((t) => [
    { id: t.playerA.id, name: t.playerA.name, teamName: t.name },
    { id: t.playerB.id, name: t.playerB.name, teamName: t.name },
  ]);

  function getPayment(playerId: string, weekNumber: number): PlayerPayment {
    const key = `${playerId}-${weekNumber}`;
    return localPayments[key] ?? { playerId, weekNumber, greenFee: 0, buyIn: 0, paid: false };
  }

  function updatePayment(playerId: string, weekNumber: number, update: Partial<PlayerPayment>) {
    const key = `${playerId}-${weekNumber}`;
    setLocalPayments((prev) => ({
      ...prev,
      [key]: { ...getPayment(playerId, weekNumber), ...update },
    }));
  }

  function handleSave() {
    const newPayments = Object.values(localPayments).filter(
      (p) => p.paid || p.greenFee > 0 || p.buyIn > 0,
    );
    updateLeague((prev) => ({ ...prev, payments: newPayments }));
  }

  // Summary calculations
  function getPlayerTotal(playerId: string): { greenFees: number; buyIns: number; total: number; weeksPaid: number } {
    let greenFees = 0;
    let buyIns = 0;
    let weeksPaid = 0;
    for (const week of weeks) {
      const p = getPayment(playerId, week.weekNumber);
      if (p.paid) {
        weeksPaid++;
        greenFees += p.greenFee;
        buyIns += p.buyIn;
      }
    }
    return { greenFees, buyIns, total: greenFees + buyIns, weeksPaid };
  }

  // Count paid players per week for the accordion summary
  function getWeekPaidCount(weekNumber: number): number {
    return allPlayers.filter((p) => getPayment(p.id, weekNumber).paid).length;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Finances</Typography>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
          Save
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Track green fee payments and weekly buy-ins per player.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="By Week" />
        <Tab label="Player Summary" />
      </Tabs>

      {tab === 0 && (
        <Box>
          {weeks.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">Add weeks first.</Typography>
            </Paper>
          ) : (
            weeks.map((week) => {
              const paidCount = getWeekPaidCount(week.weekNumber);
              return (
                <Accordion key={`fin-wk-${week.weekNumber}`} defaultExpanded={false}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "primary.main", color: "white" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", pr: 2 }}>
                      <Typography variant="h6" sx={{ color: "white" }}>Week {week.weekNumber} — {week.date}</Typography>
                      <Chip
                        label={`${paidCount}/${allPlayers.length} paid`}
                        size="small"
                        sx={{ bgcolor: paidCount === allPlayers.length ? "success.main" : "rgba(255,255,255,0.2)", color: "white" }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Player</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Paid?</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Green Fee ($)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Buy-In ($)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {allPlayers.map((player) => {
                            const payment = getPayment(player.id, week.weekNumber);
                            return (
                              <TableRow key={`${player.id}-${week.weekNumber}`}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{player.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">{player.teamName}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox
                                    checked={payment.paid}
                                    onChange={(e) => updatePayment(player.id, week.weekNumber, { paid: e.target.checked })}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center" sx={{ p: 0.5 }}>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={payment.greenFee || ""}
                                    onChange={(e) => updatePayment(player.id, week.weekNumber, { greenFee: Number(e.target.value) || 0 })}
                                    inputProps={{ min: 0, style: { textAlign: "center", width: 50, padding: "4px" } }}
                                    variant="outlined"
                                    placeholder="0"
                                  />
                                </TableCell>
                                <TableCell align="center" sx={{ p: 0.5 }}>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={payment.buyIn || ""}
                                    onChange={(e) => updatePayment(player.id, week.weekNumber, { buyIn: Number(e.target.value) || 0 })}
                                    inputProps={{ min: 0, style: { textAlign: "center", width: 50, padding: "4px" } }}
                                    variant="outlined"
                                    placeholder="0"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {payment.greenFee + payment.buyIn > 0 ? `$${payment.greenFee + payment.buyIn}` : "—"}
                                  </Typography>
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
        </Box>
      )}

      {tab === 1 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Player</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Team</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Weeks Paid</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Green Fees</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Buy-Ins</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Total Paid</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allPlayers.map((player) => {
                const totals = getPlayerTotal(player.id);
                return (
                  <TableRow key={player.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{player.name}</TableCell>
                    <TableCell>{player.teamName}</TableCell>
                    <TableCell align="center">
                      <Chip label={`${totals.weeksPaid}/${weeks.length}`} size="small" color={totals.weeksPaid === weeks.length ? "success" : "default"} />
                    </TableCell>
                    <TableCell align="center">${totals.greenFees}</TableCell>
                    <TableCell align="center">${totals.buyIns}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>${totals.total}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
