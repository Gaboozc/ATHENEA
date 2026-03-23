import {
  createHashRouter,
  createRoutesFromElements,
  Route,
  Navigate,
  Outlet,
  useRouteError,
  Link,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { Layout } from "./pages/Layout";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

// ── Lazy-loaded pages (code splitting) ────────────────────────────────────
const Dashboard      = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const WorkHub        = lazy(() => import("./pages/WorkHub").then(m => ({ default: m.WorkHub })));
const PersonalHub    = lazy(() => import("./pages/PersonalHub").then(m => ({ default: m.PersonalHub })));
const FinanceHub     = lazy(() => import("./pages/FinanceHub").then(m => ({ default: m.FinanceHub })));
const FinanceHistory = lazy(() => import("./pages/FinanceHistory").then(m => ({ default: m.FinanceHistory })));
const FinanceGoals   = lazy(() => import("./pages/FinanceGoals").then(m => ({ default: m.FinanceGoals })));
const FinanceBudgeting = lazy(() => import("./pages/FinanceBudgeting").then(m => ({ default: m.FinanceBudgeting })));
const FinanceWallets   = lazy(() => import("./pages/FinanceWallets").then(m => ({ default: m.FinanceWallets }))); /* WALLETS-12 */
const FinanceDebts     = lazy(() => import("./pages/FinanceDebts").then(m => ({ default: m.FinanceDebts }))); /* DEBTS-9 */
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
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    color: 'var(--color-text-tertiary)',
    fontSize: '13px'
  }}>
    <span>Cargando...</span>
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

// ── Single Suspense boundary via layout route ──────────────────────────────
const SuspenseLayout = () => (
  <Suspense fallback={<PageLoader />}>
    <Outlet />
  </Suspense>
);

export const router = createHashRouter(
    createRoutesFromElements(
      <>
        {/* Standalone routes (no Navbar/Layout) */}
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} errorElement={<AppRouteError />} />
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

          {/* Single Suspense boundary — all lazy pages go here */}
          <Route element={<SuspenseLayout />}>
            <Route path="dashboard"          element={<Dashboard />} />
            <Route path="work"               element={<ErrorBoundary title="Error en Work" description="El área de trabajo encontró un error."><WorkHub /></ErrorBoundary>} />
            <Route path="personal"           element={<ErrorBoundary title="Error en Personal" description="El área personal encontró un error."><PersonalHub /></ErrorBoundary>} />
            <Route path="finance"            element={<ErrorBoundary title="Error en Finanzas" description="El área financiera encontró un error."><FinanceHub /></ErrorBoundary>} />
            <Route path="finance/history"    element={<FinanceHistory />} />
            <Route path="finance/goals"      element={<FinanceGoals />} />
            <Route path="finance/budgeting"  element={<FinanceBudgeting />} />
            <Route path="finance/wallets"    element={<ErrorBoundary title="Error en Billeteras"><FinanceWallets /></ErrorBoundary>} /> {/* WALLETS-12 */}
            <Route path="finance/debts"      element={<ErrorBoundary title="Error en Deudas"><FinanceDebts /></ErrorBoundary>} /> {/* DEBTS-9 */}
            <Route path="budgeting"          element={<Navigate to="/finance/budgeting" replace />} />
            <Route path="identity"           element={<IdentityHub />} />
            <Route path="todos"              element={<Todos />} />
            <Route path="payments"           element={<Payments />} />
            <Route path="projects"           element={<Projects />} />
            <Route path="projects/:id"       element={<ProjectDetails />} />
            <Route path="settings"           element={<Settings />} />
            <Route path="intelligence"       element={<Intelligence />} />
            <Route path="fleet"              element={<Fleet />} />
            <Route path="my-tasks"           element={<MyTasks />} />
            <Route path="notifications"      element={<Notifications />} />
            <Route path="profile"            element={<Profile />} />
            <Route path="notes"              element={<Notes />} />
            <Route path="calendar"           element={<ErrorBoundary title="Error en Calendario"><Calendar /></ErrorBoundary>} />
            <Route path="inbox"              element={<Inbox />} />
            <Route path="stats"              element={<StatsPage />} />
            <Route path="journal"            element={<Journal />} />
            <Route path="weekly-review"      element={<WeeklyReview />} />
            <Route path="routines"           element={<Routines />} /> {/* ROUTINES-2 */}
            <Route path="focus"              element={<FocusMode />} />
          </Route>
        </Route>
      </>
    )
);
