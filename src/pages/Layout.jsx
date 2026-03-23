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
import { useRoutineAlarms } from "../hooks/useRoutineAlarms"
import { useDeepLink } from "../hooks/useDeepLink"
import { useAppWidgetSync } from "../hooks/useAppWidgetSync"

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    const location = useLocation();
    const { insights } = useProactiveInsights();
    useInsightNotificationBridge(true);
    useExternalCalendarObserver(true);
    useWidgetDataBridge(true);
    useRoutineAlarms();  /* ROUTINES-2 */
    useDeepLink();       /* ANDROID-2 */
    useAppWidgetSync(); /* WIDGETS: sync Redux state → all 9 Android home-screen widgets */

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
            <ErrorBoundary message="The navigation bar had an error.">
                <Navbar />
            </ErrorBoundary>
            <div className="app-shell">
                <main className="app-content">
                    {/* key={pathname} resets boundary on navigation, isolating each page */}
                    <ErrorBoundary key={location.pathname} message="This page had an unexpected error.">
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
            <GatekeeperModal />
            <ReminderToasts />
            <NativeReminderNotifications />
            <Omnibar defaultHub="WorkHub" onActionExecuted={handleOmnibarActionExecuted} />
            <ToastContainer />
            <FloatingOmnibarFab highInsightsCount={highInsightsCount} />
            <FABShowToggle />
        </ScrollToTop>
    )
}