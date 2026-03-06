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

// Clear localStorage if ?clear=true is in URL (for testing)
if (new URLSearchParams(window.location.search).get('clear') === 'true') {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.pathname;
}

const Main = () => {
    return (
        <React.StrictMode>  
            {/* Provide Redux state to all components */}
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
        </React.StrictMode>
    );
}

// Render the Main component into the root DOM element.
ReactDOM.createRoot(document.getElementById('root')).render(<Main />)
