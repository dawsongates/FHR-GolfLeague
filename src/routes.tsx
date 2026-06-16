import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Leaderboard } from "./pages/Leaderboard";
import { Teams } from "./pages/Teams";
import { Weeks } from "./pages/Weeks";
import { ScoreEntry } from "./pages/ScoreEntry";
import { WeekResults } from "./pages/WeekResults";
import { Handicaps } from "./pages/Handicaps";
import { Subs } from "./pages/Subs";
import { Schedule } from "./pages/Schedule";
import { Notes } from "./pages/Notes";
import { Finance } from "./pages/Finance";
import { Analytics } from "./pages/Analytics";
import { Matchups } from "./pages/Matchups";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Leaderboard /> },
      { path: "/teams", element: <Teams /> },
      { path: "/subs", element: <Subs /> },
      { path: "/schedule", element: <Schedule /> },
      { path: "/weeks", element: <Weeks /> },
      { path: "/weeks/:weekNumber/scores", element: <ScoreEntry /> },
      { path: "/weeks/:weekNumber/results", element: <WeekResults /> },
      { path: "/handicaps", element: <Handicaps /> },
      { path: "/matchups", element: <Matchups /> },
      { path: "/notes", element: <Notes /> },
      { path: "/finance", element: <Finance /> },
      { path: "/analytics", element: <Analytics /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });
