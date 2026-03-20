import {
  createHashRouter,
  createRoutesFromElements,
  Route,
  Navigate,
  useRouteError,
  Link,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { Layout } from "./pages/Layout";
import { Skeleton } from "./components/Skeleton/Skeleton";

// ── Lazy-loaded pages (code splitting) ────────────────────────────────────
const Dashboard      = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const WorkHub        = lazy(() => import("./pages/WorkHub").then(m => ({ default: m.WorkHub })));
const PersonalHub    = lazy(() => import("./pages/PersonalHub").then(m => ({ default: m.PersonalHub })));
const FinanceHub     = lazy(() => import("./pages/FinanceHub").then(m => ({ default: m.FinanceHub })));
const FinanceHistory = lazy(() => import("./pages/FinanceHistory").then(m => ({ default: m.FinanceHistory })));
const FinanceGoals   = lazy(() => import("./pages/FinanceGoals").then(m => ({ default: m.FinanceGoals })));
const FinanceBudgeting = lazy(() => import("./pages/FinanceBudgeting").then(m => ({ default: m.FinanceBudgeting })));
const FinanceWallets   = lazy(() => import("./pages/FinanceWallets").then(m => ({ default: m.FinanceWallets }))); /* WALLETS-12 */
const Routines         = lazy(() => import("./pages/Routines").then(m => ({ default: m.Routines }))); /* ROUTINES-2 */
const Calendar       = lazy(() => import("./pages/Calendar").then(m => ({ default: m.Calendar })));
const Projects       = lazy(() => import("./pages/Projects").then(m => ({ default: m.Projects })));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails").then(m => ({ default: m.ProjectDetails })));
const Intelligence   = lazy(() => import("./pages/Intelligence").then(m => ({ default: m.Intelligence })));
const Fleet          = lazy(() => import("./pages/Fleet").then(m => ({ default: m.Fleet })));
const Notes          = lazy(() => import("./pages/Notes").then(m => ({ default: m.Notes })));
const Journal        = lazy(() => import("./pages/Journal").then(m => ({ default: m.Journal })));
const WeeklyReview   = lazy(() => import("./pages/WeeklyReview").then(m => ({ default: m.WeeklyReview })));
const FocusMode      = lazy(() => import("./pages/FocusMode").then(m => ({ default: m.FocusMode })));
const StatsPage      = lazy(() => import("./pages/StatsPage"));
const IdentityHub    = lazy(() => import("./pages/IdentityHub").then(m => ({ default: m.IdentityHub })));
const Settings       = lazy(() => import("./pages/Settings"));
const Todos          = lazy(() => import("./pages/Todos").then(m => ({ default: m.Todos })));
const Payments       = lazy(() => import("./pages/Payments").then(m => ({ default: m.Payments })));
const MyTasks        = lazy(() => import("./pages/MyTasks").then(m => ({ default: m.MyTasks })));
const Notifications  = lazy(() => import("./pages/Notifications").then(m => ({ default: m.Notifications })));
const Profile        = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Inbox          = lazy(() => import("./pages/Inbox").then(m => ({ default: m.Inbox })));
const Login          = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));

// ── Preload critical routes after initial mount ────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      import("./pages/Dashboard");
      import("./pages/WorkHub");
      import("./pages/FinanceHub");
    }, 1500);
  });
}

// ── Loading fallback ───────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ padding: '2rem' }}>
    <Skeleton lines={4} />
  </div>
);

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

// ── Wrap element in Suspense ───────────────────────────────────────────────
const S = (element) => <Suspense fallback={<PageLoader />}>{element}</Suspense>;

export const router = createHashRouter(
    createRoutesFromElements(
      <>
        {/* Standalone routes (no Navbar/Layout) */}
        <Route path="/login" element={S(<Login />)} errorElement={<AppRouteError />} />
        {/* Redirect legacy auth routes → dashboard */}
        <Route path="/register" element={<Navigate to="/dashboard" replace />} />
        <Route path="/awaiting-command" element={<Navigate to="/dashboard" replace />} />

        {/* App Routes with Layout */}
        <Route
          path="/"
          element={<Layout />}
          errorElement={<AppRouteError />}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"          element={S(<Dashboard />)} />
          <Route path="work"               element={S(<WorkHub />)} />
          <Route path="personal"           element={S(<PersonalHub />)} />
          <Route path="finance"            element={S(<FinanceHub />)} />
          <Route path="finance/history"    element={S(<FinanceHistory />)} />
          <Route path="finance/goals"      element={S(<FinanceGoals />)} />
          <Route path="finance/budgeting"  element={S(<FinanceBudgeting />)} />
          <Route path="finance/wallets"   element={S(<FinanceWallets />)} /> {/* WALLETS-12 */}
          <Route path="budgeting"          element={<Navigate to="/finance/budgeting" replace />} />
          <Route path="identity"           element={S(<IdentityHub />)} />
          <Route path="todos"              element={S(<Todos />)} />
          <Route path="payments"           element={S(<Payments />)} />
          <Route path="projects"           element={S(<Projects />)} />
          <Route path="projects/:id"       element={S(<ProjectDetails />)} />
          <Route path="settings"           element={S(<Settings />)} />
          <Route path="intelligence"       element={S(<Intelligence />)} />
          <Route path="fleet"              element={S(<Fleet />)} />
          <Route path="my-tasks"           element={S(<MyTasks />)} />
          <Route path="notifications"      element={S(<Notifications />)} />
          <Route path="profile"            element={S(<Profile />)} />
          <Route path="notes"              element={S(<Notes />)} />
          <Route path="calendar"           element={S(<Calendar />)} />
          <Route path="inbox"              element={S(<Inbox />)} />
          <Route path="stats"              element={S(<StatsPage />)} />
          <Route path="journal"            element={S(<Journal />)} />
          <Route path="weekly-review"      element={S(<WeeklyReview />)} />
          <Route path="routines"           element={S(<Routines />)} /> {/* ROUTINES-2 */}
          <Route path="focus"              element={S(<FocusMode />)} />
        </Route>
      </>
    )
);
