import {
  createHashRouter,
  createRoutesFromElements,
  Route,
  Navigate,
  useRouteError,
  Link,
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
import { Todos } from "./pages/Todos";
import { Payments } from "./pages/Payments";
import { WorkHub } from "./pages/WorkHub";
import { PersonalHub } from "./pages/PersonalHub";
import { FinanceHub } from "./pages/FinanceHub";
import { FinanceHistory } from "./pages/FinanceHistory";
import { FinanceGoals } from "./pages/FinanceGoals";
import { FinanceBudgeting } from "./pages/FinanceBudgeting";
import { IdentityHub } from "./pages/IdentityHub";
import StatsPage from "./pages/StatsPage";

const AppRouteError = () => {
  const error = useRouteError();
  const message =
    error?.statusText ||
    error?.message ||
    (typeof error === 'string' ? error : 'Unknown routing error');

  return (
    <div style={{ padding: 24, color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Route Error</h1>
      <p style={{ marginBottom: 12 }}>{message}</p>
      <Link to="/dashboard" style={{ color: '#38bdf8' }}>Go to Dashboard</Link>
    </div>
  );
};

export const router = createHashRouter(
    createRoutesFromElements(
      <>
        {/* App Routes with Layout */}
        <Route
          path="/"
          element={<Layout />}
          errorElement={<AppRouteError />}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="work" element={<WorkHub />} />
          <Route path="personal" element={<PersonalHub />} />
          <Route path="finance" element={<FinanceHub />} />
          <Route path="finance/history" element={<FinanceHistory />} />
          <Route path="finance/goals" element={<FinanceGoals />} />
          <Route path="finance/budgeting" element={<FinanceBudgeting />} />
          <Route path="budgeting" element={<Navigate to="/finance/budgeting" replace />} />
          <Route path="identity" element={<IdentityHub />} />
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
          <Route path="inbox" element={<Navigate to="/calendar" replace />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
      </>
    )
);