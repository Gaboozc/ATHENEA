import { Outlet, useLocation } from "react-router-dom"
import ScrollToTop from "../components/ScrollToTop"
import { AppShell } from "../components/AppShell/AppShell"
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

export const Layout = () => {
    const location = useLocation();
    const { insights } = useProactiveInsights();
    useInsightNotificationBridge(true);
    useExternalCalendarObserver(true);
    useWidgetDataBridge(true);
    useRoutineAlarms();
    useDeepLink();
    useAppWidgetSync();

    const highInsightsCount = insights.filter((i) => i.severity === 'high').length;

    const handleOmnibarActionExecuted = (result) => {
        if (result?.success) {
            showToast(result.message || 'Action completed', 'success', 2600, '✓');
            return;
        }
        showToast(result?.message || 'Action could not be completed', 'warning', 3200, '!');
    };

    return (
        <ScrollToTop>
            {/* AppShell renders TopNavbar (desktop) OR BottomTabBar (mobile) */}
            <AppShell highInsightsCount={highInsightsCount} />
            <div className="app-shell">
                <main className="app-content">
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
            {/* FloatingOmnibarFab hidden on mobile via CSS — bottom tab bar has its own FAB */}
            <FloatingOmnibarFab highInsightsCount={highInsightsCount} />
            <FABShowToggle />
        </ScrollToTop>
    )
}
