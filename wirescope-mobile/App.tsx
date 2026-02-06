/**
 * WireScope Mobile App
 * Structured Cabling & Data Network Project Management
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { store, persistor } from './src/store';
import { theme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import NetworkStatusProvider from './src/providers/NetworkStatusProvider';
import AuthProvider from './src/providers/AuthProvider';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ReduxProvider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <PaperProvider theme={theme}>
              <SafeAreaProvider>
                <NetworkStatusProvider>
                  <AuthProvider>
                    <StatusBar
                      barStyle="light-content"
                      backgroundColor={theme.colors.primary}
                    />
                    <RootNavigator />
                  </AuthProvider>
                </NetworkStatusProvider>
              </SafeAreaProvider>
            </PaperProvider>
          </PersistGate>
        </ReduxProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;