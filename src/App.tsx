import { CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { LeagueProvider } from "./hooks/useLeague";
import { router } from "./routes";
import { theme } from "./theme";

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LeagueProvider>
        <RouterProvider router={router} />
      </LeagueProvider>
    </ThemeProvider>
  );
}
