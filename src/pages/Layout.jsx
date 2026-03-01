import { Outlet } from "react-router-dom"
import { useState, useEffect } from "react"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { GatekeeperModal } from "../components/modals/GatekeeperModal"
import { ReminderToasts } from "../components/ReminderToasts"
import GlobalSearch from "../components/GlobalSearch"

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    const [searchOpen, setSearchOpen] = useState(false);

    // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <ScrollToTop>
            <Navbar />
            <div className="app-shell">
                <main className="app-content">
                    <Outlet />
                </main>
            </div>
            <GatekeeperModal />
            <ReminderToasts />
            {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
        </ScrollToTop>
    )
}