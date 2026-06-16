import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#2e7d32", // golf green
      light: "#4caf50",
      dark: "#1b5e20",
    },
    secondary: {
      main: "#ff8f00",
      light: "#ffa726",
      dark: "#e65100",
    },
    background: {
      default: "#f1f8e9",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: "1px solid", borderColor: "rgba(0,0,0,0.12)" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
  },
});
