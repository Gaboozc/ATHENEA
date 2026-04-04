package com.athenea.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(AtheneaWidgetPlugin.class);
        registerPlugin(NotificationListenerPlugin.class);

        // Edge-to-edge: let app draw behind system bars
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Hide navigation bar (back/home/recents) in sticky immersive mode
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.navigationBars());
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
    }
}
