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
        {/* App Routes with Layout */}
        <Route
          path="/"
          element={<Layout />}
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
          <Route path="intelligence" element={<Intelligence />} />
          <Route path="workstreams" element={<Workstreams />} />
          <Route path="workstreams/:id" element={<WorkstreamDetail />} />
          <Route path="audits/:id" element={<AuditDetail />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="field-reports" element={<FieldReports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          
          {/* Old routes for reference */}
          <Route path="single/:theId" element={<Single />} />
          <Route path="demo" element={<Demo />} />
          <Route path="home" element={<Home />} />
        </Route>
      </>
    )
);