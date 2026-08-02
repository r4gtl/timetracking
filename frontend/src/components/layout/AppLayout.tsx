import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "./AppLayout.css";

const NAV_ITEMS: { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/clients", label: "Clienti" },
  { to: "/projects", label: "Progetti" },
  { to: "/tracker", label: "Tracker" },
  { to: "/reports", label: "Report" },
  { to: "/invoices", label: "Fatture" },
];

export function AppLayout() {
  const { logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">Timetracking</div>
        <nav className="app-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? "app-sidebar__link app-sidebar__link--active"
                  : "app-sidebar__link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="app-sidebar__logout" onClick={logout}>
          Logout
        </button>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
