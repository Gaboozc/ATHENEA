import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.athenea.app',
  appName: 'ATHENEA',
  webDir: 'dist',
  appUrlScheme: 'athenea',   // ANDROID-2: deep link scheme
  server: {
    androidScheme: 'https',   // enforce HTTPS in WebView (SEC-3)
    allowNavigation: [
      'api.openai.com',
      'api.groq.com',
      'www.googleapis.com',
      'oauth2.googleapis.com',
    ],
  },
};

export default config;
