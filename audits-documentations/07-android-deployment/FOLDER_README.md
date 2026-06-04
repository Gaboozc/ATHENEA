# 07 — Android Deployment

## Documents in this folder

| File | Description |
|------|-------------|
| [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md) | Full APK build process |
| [APK_SETUP.md](APK_SETUP.md) | Environment setup for Android builds |
| [GUIA_INSTALACION_VISUAL.md](GUIA_INSTALACION_VISUAL.md) | Visual installation guide (Spanish) |

## Build Pipeline

```
npm run build          (Vite → dist/)
     ↓
npx cap sync android   (copy dist/ → android/app/src/main/assets/public/)
     ↓
Android Studio         (open scope/android/)
     ↓
Build → Generate Signed Bundle/APK
```

## App Configuration

| Setting | Value |
|---------|-------|
| App ID | `com.athenea.app` |
| App Name | ATHENEA |
| Web Dir | `dist` |
| Min SDK | 22 (Android 5.1) |
| Target SDK | 34 (Android 14) |

## Capacitor Plugins Registered

In `MainActivity.java`:
```java
registerPlugin(WidgetBridgePlugin.class);
registerPlugin(AtheneaWidgetPlugin.class);     // 9 widgets
registerPlugin(NotificationListenerPlugin.class);
```

## Android Widgets (9)

All registered in `AndroidManifest.xml`:
| Widget | Class | Purpose |
|--------|-------|---------|
| DailyFocusWidget | `.widgets.DailyFocusWidget` | Today's focus task |
| FinanceSnapshotWidget | `.widgets.FinanceSnapshotWidget` | Balance overview |
| QuickCaptureWidget | `.widgets.QuickCaptureWidget` | Quick task input |
| TaskStatusWidget | `.widgets.TaskStatusWidget` | Task completion |
| RoutineCheckWidget | `.widgets.RoutineCheckWidget` | Habit check-off |
| InsightWidget | `.widgets.InsightWidget` | AI insight |
| FocusTimerWidget | `.widgets.FocusTimerWidget` | Pomodoro timer |
| HealthSnapshotWidget | `.widgets.HealthSnapshotWidget` | Wellbeing status |
| CalendarPeekWidget | `.widgets.CalendarPeekWidget` | Next event |

## Keystore Signing (Pending)

For Play Store distribution, a release keystore is required:
```bash
keytool -genkey -v -keystore android/app/keystore.jks \
  -alias athenea -keyalg RSA -keysize 2048 -validity 10000
```

Then add to `android/app/build.gradle`:
```groovy
signingConfigs {
  release {
    storeFile file('keystore.jks')
    storePassword System.getenv("KEYSTORE_PASSWORD")
    keyAlias 'athenea'
    keyPassword System.getenv("KEY_PASSWORD")
  }
}
```

> ⚠️ Never commit `keystore.jks` or passwords to git. Use environment variables or a secrets manager.

## Notification Channels

Android requires declaring notification channels. Current channels:
- `tactical-alerts` — Agent AI notifications (high priority)
- `reminders` — Date-based reminders (default priority)
