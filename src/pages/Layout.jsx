import { Outlet, useLocation } from "react-router-dom"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { GatekeeperModal } from "../components/modals/GatekeeperModal"
import { ReminderToasts } from "../components/ReminderToasts"
import NativeReminderNotifications from "../components/NativeReminderNotifications"
import { Omnibar } from "../components/Omnibar/Omnibar"
import { FloatingOmnibarFab } from "../components/Omnibar/FloatingOmnibarFab"
import { FABShowToggle } from "../components/Omnibar/FABShowToggle"
import { ToastContainer, showToast } from "../components/Toast"
import {
    useExternalCalendarObserver,
    useInsightNotificationBridge,
    useProactiveInsights,
    useWidgetDataBridge
} from "../modules/intelligence"
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary"

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    const location = useLocation();
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
            <ErrorBoundary message="La barra de navegación tuvo un error.">
                <Navbar />
            </ErrorBoundary>
            <div className="app-shell">
                <main className="app-content">
                    {/* key={pathname} reinicia el boundary al navegar, aislando cada página */}
                    <ErrorBoundary key={location.pathname} message="Esta página tuvo un error inesperado.">
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
            <GatekeeperModal />
            <ReminderToasts />
            <NativeReminderNotifications />
            <ErrorBoundary message="El asistente tuvo un error.">
                <Omnibar defaultHub="WorkHub" onActionExecuted={handleOmnibarActionExecuted} />
            </ErrorBoundary>
            <ToastContainer />
            <FloatingOmnibarFab highInsightsCount={highInsightsCount} />
            <FABShowToggle />
        </ScrollToTop>
    )
}