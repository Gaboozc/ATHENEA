// Import necessary components and functions from react-router-dom.

import {
  createHashRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Onboarding } from "./pages/Onboarding";
import { AwaitingCommand } from "./pages/AwaitingCommand";
import { RequireMembership } from "./components/RequireMembership";
import { RequireAccess } from "./components/RequireAccess";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetails } from "./pages/ProjectDetails";
import { PointDetails } from "./pages/PointDetails";
import { Users } from "./pages/Users";
import { Inventory } from "./pages/Inventory";
import { ProductionTracking } from "./pages/ProductionTracking";
import { Settings } from "./pages/Settings";
import { Intelligence } from "./pages/Intelligence";
import { Workstreams } from "./pages/Workstreams";
import { WorkstreamDetail } from "./pages/WorkstreamDetail";
import { AuditDetail } from "./pages/AuditDetail";
import { Fleet } from "./pages/Fleet";
import { Notifications } from "./pages/Notifications";
import { Profile } from "./pages/Profile";
import { FieldReports } from "./pages/FieldReports";
import { MyTasks } from "./pages/MyTasks";

export const router = createHashRouter(
    createRoutesFromElements(
      <>
        {/* Login Routes - No Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/awaiting-command" element={<AwaitingCommand />} />
        
        {/* App Routes with Layout */}
        <Route
          path="/"
          element={
            <RequireMembership>
              <Layout />
            </RequireMembership>
          }
          errorElement={<h1>Not found!</h1>}
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="points/:id" element={<PointDetails />} />
          <Route path="users" element={<Users />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="production" element={<ProductionTracking />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="intelligence"
            element={
              <RequireAccess allow={["admin", "manager"]} requireWorkstreamsFor={["admin", "manager"]}>
                <Intelligence />
              </RequireAccess>
            }
          />
          <Route
            path="workstreams"
            element={
              <RequireAccess allow={["admin", "manager"]}>
                <Workstreams />
              </RequireAccess>
            }
          />
          <Route
            path="workstreams/:id"
            element={
              <RequireAccess allow={["admin", "manager", "worker"]}>
                <WorkstreamDetail />
              </RequireAccess>
            }
          />
          <Route
            path="audits/:id"
            element={
              <RequireAccess allow={["admin", "manager", "worker"]}>
                <AuditDetail />
              </RequireAccess>
            }
          />
          <Route
            path="fleet"
            element={
              <RequireAccess allow={["admin", "manager"]} requireWorkstreamsFor={["admin", "manager"]}>
                <Fleet />
              </RequireAccess>
            }
          />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route
            path="field-reports"
            element={
              <RequireAccess allow={["admin", "manager", "worker"]}>
                <FieldReports />
              </RequireAccess>
            }
          />
          <Route
            path="notifications"
            element={
              <RequireAccess allow={["admin", "manager"]}>
                <Notifications />
              </RequireAccess>
            }
          />
          <Route path="profile" element={<Profile />} />
          
          {/* Old routes for reference */}
          <Route path="single/:theId" element={<Single />} />
          <Route path="demo" element={<Demo />} />
          <Route path="home" element={<Home />} />
        </Route>
      </>
    )
);