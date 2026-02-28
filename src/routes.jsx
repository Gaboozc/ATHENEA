import {
  createHashRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetails } from "./pages/ProjectDetails";
import Settings from "./pages/Settings";
import { Intelligence } from "./pages/Intelligence";
import { Fleet } from "./pages/Fleet";
import { Notifications } from "./pages/Notifications";
import { Profile } from "./pages/Profile";
import { MyTasks } from "./pages/MyTasks";
import { Notes } from "./pages/Notes";
import { Calendar } from "./pages/Calendar";
import { Inbox } from "./pages/Inbox";
import { Todos } from "./pages/Todos";
import { Payments } from "./pages/Payments";
import { WorkHub } from "./pages/WorkHub";
import { PersonalHub } from "./pages/PersonalHub";
import { FinanceHub } from "./pages/FinanceHub";
import StatsPage from "./pages/StatsPage";

export const router = createHashRouter(
    createRoutesFromElements(
      <>
        {/* App Routes with Layout */}
        <Route
          path="/"
          element={<Layout />}
          errorElement={<h1>Not found!</h1>}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="work" element={<WorkHub />} />
          <Route path="personal" element={<PersonalHub />} />
          <Route path="finance" element={<FinanceHub />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="todos" element={<Todos />} />
          <Route path="payments" element={<Payments />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="settings" element={<Settings />} />
          <Route path="intelligence" element={<Intelligence />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notes" element={<Notes />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
      </>
    )
);