import { Outlet } from "react-router-dom"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { GatekeeperModal } from "../components/modals/GatekeeperModal"
import { ReminderToasts } from "../components/ReminderToasts"
import NativeReminderNotifications from "../components/NativeReminderNotifications"
import { Omnibar } from "../components/Omnibar/Omnibar"
import { ToastContainer, showToast } from "../components/Toast"
import {
    useExternalCalendarObserver,
    useInsightNotificationBridge,
    useProactiveInsights,
    useWidgetDataBridge
} from "../modules/intelligence"
import { useOmnibar } from "../components/Omnibar/useOmnibar"
import "../components/Omnibar/FloatingOmnibarFab.css"
import athenaLogo from "../assets/img/Athena-logo.png"

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    const { openOmnibar } = useOmnibar();
    const { insights } = useProactiveInsights();
    useInsightNotificationBridge(true);
    useExternalCalendarObserver(true);
    useWidgetDataBridge(true);

    const highInsightsCount = insights.filter((insight) => insight.severity === 'high').length;

    const handleOmnibarActionExecuted = (result) => {
        if (result?.success) {
            showToast(result.message || 'Action completed', 'success', 2600, '✓');
            return;
        }

        showToast(result?.message || 'Action could not be completed', 'warning', 3200, '!');
    };

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
            <NativeReminderNotifications />
            <Omnibar defaultHub="WorkHub" onActionExecuted={handleOmnibarActionExecuted} />
            <ToastContainer />
            <button
                type="button"
                className={`omnibar-fab ${highInsightsCount > 0 ? 'has-alert' : ''}`}
                onClick={openOmnibar}
                aria-label="Open Athenea Omnibar"
            >
                <img className="omnibar-fab-logo" src={athenaLogo} alt="Athenea" />
                {highInsightsCount > 0 && (
                    <span className="omnibar-fab-badge">{highInsightsCount > 9 ? '9+' : highInsightsCount}</span>
                )}
            </button>
        </ScrollToTop>
    )
}