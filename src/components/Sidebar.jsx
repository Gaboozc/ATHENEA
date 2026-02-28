import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Projects", path: "/projects" },
  { label: "Stats", path: "/stats" },
  { label: "Settings", path: "/settings" }
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">ATHENEA</span>
        <span className="sidebar-subtitle">Operations</span>
      </div>
      <nav className="sidebar-nav" aria-label="Operational navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="sidebar-link-text">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
