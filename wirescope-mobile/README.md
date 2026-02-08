# ATHENEA Mobile App

React Native mobile application for tactical engineering and data network project management.

## 📱 Features

- **Authentication**: Login, signup, and password reset
- **Project Management**: View and manage tactical engineering projects
- **Floor Plans**: Interactive floor plan viewer with cable point management
- **Materials**: Cable and hardware inventory management
- **Offline Support**: Offline-first design with data synchronization
- **Reports**: Project reports and analytics

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Navigate to the mobile app directory:
```bash
cd ATHENEA-mobile
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Install iOS dependencies (iOS only):
```bash
cd ios && pod install && cd ..
```

### Running the App

#### Android
```bash
npx react-native run-android
```

#### iOS
```bash
npx react-native run-ios
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── main/           # Main app screens
│   ├── projects/       # Project management screens
│   ├── floorplan/      # Floor plan screens
│   ├── materials/      # Materials screens
│   └── settings/       # Settings screens
├── store/              # Redux store and slices
├── providers/          # Context providers
├── theme/              # App theme configuration
└── utils/              # Utility functions
```

## 🔧 Tech Stack

- **Framework**: React Native 0.72.6
- **Navigation**: React Navigation 6.x
- **State Management**: Redux Toolkit with Redux Persist
- **UI Components**: React Native Paper
- **Authentication**: Auth0
- **Offline Storage**: AsyncStorage + SQLite
- **Maps**: React Native Maps
- **Camera**: React Native Vision Camera
- **File Handling**: React Native Document Picker
- **PDF Generation**: React Native PDF

## 🌐 API Integration

The mobile app connects to the ATHENEA backend API for:
- User authentication
- Project data synchronization
- File uploads and downloads
- Real-time updates via WebSocket

## 📊 State Management

Redux store is organized into slices:
- `auth`: User authentication state
- `projects`: Project data and current project
- `points`: Cable points and filtering
- `materials`: Materials inventory
- `notifications`: In-app notifications
- `sync`: Offline synchronization state

## 🔄 Offline Support

The app implements offline-first design:
- Data is cached locally using Redux Persist
- Changes are queued for synchronization when online
- Automatic sync when network is restored
- SQLite for complex offline queries

## 🎨 Theming

Consistent design system with:
- Primary color: #2196F3 (Material Blue)
- Typography scale
- Spacing system
- Component variants

## 📱 Platform Support

- **Android**: API level 21+ (Android 5.0+)
- **iOS**: iOS 11.0+

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Development

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting

### Build for Production

#### Android
```bash
cd android
./gradlew assembleRelease
```

#### iOS
```bash
npx react-native run-ios --configuration Release
```

## 🔗 Related Projects

- [ATHENEA Backend](../ATHENEA-backend/) - Node.js API server
- [ATHENEA Desktop](../ATHENEA-desktop/) - Electron desktop app
- [ATHENEA Docs](../docs/) - Project documentation

## 📄 License

This project is part of the ATHENEA application suite.