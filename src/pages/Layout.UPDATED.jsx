/**
 * Layout.jsx - UPDATED WITH OMNIBAR & TOAST INTEGRATION
 * 
 * This is the updated version of Layout.jsx that integrates:
 * - Omnibar (global command palette with Ctrl+K)
 * - Toast notifications (success/error feedback)
 * - Intelligence module (skills-based execution)
 * 
 * Simply replace the current Layout.jsx with this code.
 */

import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { GatekeeperModal } from "../components/modals/GatekeeperModal";
import { ReminderToasts } from "../components/ReminderToasts";
import NativeReminderNotifications from "../components/NativeReminderNotifications";

// ✨ NEW: Omnibar & Toast Integration
import { Omnibar } from "../components/Omnibar";
import { useOmnibar } from "../components/Omnibar/useOmnibar";
import { ToastContainer, showToast } from "../components/Toast";
import "../components/Omnibar/Omnibar.css";
import "../components/Toast/Toast.css";

/**
 * Base component that maintains the navbar, omnibar, toast notifications,
 * and footer throughout the application.
 */
export const Layout = () => {
    const dispatch = useDispatch();
    const { isOpen } = useOmnibar();

    /**
     * Handle Omnibar action execution
     * - Called when user confirms an action in Omnibar
     * - Dispatches Redux actions based on skill result
     * - Shows success/error toast notification
     */
    const handleOmnibarActionExecuted = (result) => {
        console.debug('[Omnibar] Action executed:', result);

        if (result.success) {
            // Extract meaningful message
            const message = result.message || `${result.skill} executed successfully`;
            const icon = result.icon || '✓';

            // Show success toast
            showToast(message, 'success', 3000, icon);

            // Dispatch Redux action if provided
            if (result.action && dispatch) {
                try {
                    dispatch(result.action);
                } catch (err) {
                    console.error('[Omnibar] Error dispatching action:', err);
                    showToast('Action dispatched but data sync may have failed', 'warning');
                }
            }
        } else {
            // Show error toast
            const errorMessage = result.error || 'Failed to execute action';
            showToast(`Error: ${errorMessage}`, 'error', 3000, '✕');
        }
    };

    /**
     * Handle Omnibar action errors
     */
    const handleOmnibarError = (error) => {
        console.error('[Omnibar] Error:', error);
        showToast('An error occurred while processing your request', 'error', 4000);
    };

    return (
        <ScrollToTop>
            <Navbar />
            <div className="app-shell">
                <main className="app-content">
                    <Outlet />
                </main>
            </div>

            {/* Existing Components */}
            <GatekeeperModal />
            <ReminderToasts />
            <NativeReminderNotifications />

            {/* ✨ NEW: Global Omnibar (Ctrl+K to open) */}
            {isOpen && (
                <Omnibar
                    defaultHub="WorkHub"
                    onActionExecuted={handleOmnibarActionExecuted}
                    onError={handleOmnibarError}
                />
            )}

            {/* ✨ NEW: Toast Notification Container */}
            <ToastContainer />
        </ScrollToTop>
    );
};

export default Layout;
