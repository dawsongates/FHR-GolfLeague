import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import LeaderboardIcon from "@mui/icons-material/EmojiEvents";
import GroupIcon from "@mui/icons-material/Group";
import CalendarIcon from "@mui/icons-material/CalendarMonth";
import HandicapIcon from "@mui/icons-material/TrendingDown";
import AnalyticsIcon from "@mui/icons-material/QueryStats";
import SubsIcon from "@mui/icons-material/PersonAdd";
import MenuIcon from "@mui/icons-material/Menu";
import GolfCourseIcon from "@mui/icons-material/GolfCourse";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ScheduleIcon from "@mui/icons-material/ViewTimeline";
import NotesIcon from "@mui/icons-material/StickyNote2";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ScorecardIcon from "@mui/icons-material/ContentPaste";
import { useRef, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useLeague } from "../hooks/useLeague";

const DRAWER_WIDTH = 220;

const navItems = [
  { label: "Leaderboard", path: "/", icon: <LeaderboardIcon /> },
  { label: "Teams", path: "/teams", icon: <GroupIcon /> },
  { label: "Subs", path: "/subs", icon: <SubsIcon /> },
  { label: "Schedule", path: "/schedule", icon: <ScheduleIcon /> },
  { label: "Matchups", path: "/matchups", icon: <ScorecardIcon /> },
  { label: "Weeks", path: "/weeks", icon: <CalendarIcon /> },
  { label: "Handicaps", path: "/handicaps", icon: <HandicapIcon /> },
  { label: "Notes", path: "/notes", icon: <NotesIcon /> },
  { label: "Finance", path: "/finance", icon: <AttachMoneyIcon /> },
  { label: "Analytics", path: "/analytics", icon: <AnalyticsIcon /> },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [snack, setSnack] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const { exportData, importData, loading } = useLeague();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(file);
      setSnack({ message: "League data imported successfully!", severity: "success" });
    } catch (err) {
      setSnack({ message: `Import failed: ${err instanceof Error ? err.message : "Unknown error"}`, severity: "error" });
    }
    // Reset so the same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const drawerContent = (
    <>
      <Toolbar />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <GolfCourseIcon sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Golf League 2026
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Andover Municipal
          </Typography>
          <Tooltip title="Save to file">
            <IconButton color="inherit" onClick={exportData} sx={{ ml: 1 }}>
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Load from file">
            <IconButton color="inherit" onClick={() => fileInputRef.current?.click()}>
              <FileUploadIcon />
            </IconButton>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            hidden
            onChange={handleImport}
          />
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 3 }, maxWidth: "100%" }}>
        <Toolbar />
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <Typography variant="h6" color="text.secondary">Loading league data…</Typography>
          </Box>
        ) : (
          <Outlet />
        )}
      </Box>

      <Snackbar
        open={snack !== null}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack?.severity ?? "success"} onClose={() => setSnack(null)} variant="filled">
          {snack?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
