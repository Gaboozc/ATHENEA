import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'  // Global styles for your application
import { RouterProvider } from "react-router-dom";  // Import RouterProvider to use the router
import { router } from "./routes";  // Import the router configuration
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store/index';
import { TasksProvider } from './context/TasksContext';
import { LanguageProvider } from './context/LanguageContext';
import AppInitializer from './components/AppInitializer';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Clear localStorage if ?clear=true is in URL (for testing)
if (new URLSearchParams(window.location.search).get('clear') === 'true') {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.pathname;
}

// Ensure direct URLs (e.g. /finance/budgeting) work with hash-based routing.
if (typeof window !== 'undefined') {
    const { pathname, search, hash, origin } = window.location;
    const hasHashRoute = typeof hash === 'string' && hash.startsWith('#/');
    const isDirectAppPath = pathname && pathname !== '/' && pathname !== '/index.html';
    if (!hasHashRoute && isDirectAppPath) {
        window.location.replace(`${origin}/#${pathname}${search || ''}`);
    }
}

const Main = () => {
    return (
        <>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <AppInitializer>
                    <LanguageProvider>
                        <TasksProvider>
                            {/* Set up routing for the application */}
                            <RouterProvider router={router} />
                        </TasksProvider>
                    </LanguageProvider>
                </AppInitializer>
            </PersistGate>
        </Provider>
        </GoogleOAuthProvider>
</>
    );
}

// Render the Main component into the root DOM element.
ReactDOM.createRoot(document.getElementById('root')).render(<Main />)
