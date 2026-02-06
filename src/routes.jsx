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
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetails } from "./pages/ProjectDetails";
import { FloorPlan } from "./pages/FloorPlan";
import { CreateProject } from "./pages/CreateProject";
import { PointDetails } from "./pages/PointDetails";
import { Users } from "./pages/Users";
import { Inventory } from "./pages/Inventory";
import { ProductionTracking } from "./pages/ProductionTracking";

export const router = createHashRouter(
    createRoutesFromElements(
      <>
        {/* Login Route - No Layout */}
        <Route path="/login" element={<Login />} />
        
        {/* App Routes with Layout */}
        <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/create" element={<CreateProject />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="projects/:id/floorplan" element={<FloorPlan />} />
          <Route path="points/:id" element={<PointDetails />} />
          <Route path="users" element={<Users />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="production" element={<ProductionTracking />} />
          
          {/* Old routes for reference */}
          <Route path="single/:theId" element={<Single />} />
          <Route path="demo" element={<Demo />} />
          <Route path="home" element={<Home />} />
        </Route>
      </>
    )
);