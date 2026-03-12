package com.athenea.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationListener")
public class NotificationListenerPlugin extends Plugin {

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", isNotificationListenerEnabled(getContext()));
        result.put("pendingCount", NotificationInterceptStore.size());
        call.resolve(result);
    }

    @PluginMethod
    public void openAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);

        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    @PluginMethod
    public void pullIntercepted(PluginCall call) {
        JSObject result = new JSObject();
        result.put("notifications", NotificationInterceptStore.pullAll());
        call.resolve(result);
    }

    @PluginMethod
    public void simulateIntercepted(PluginCall call) {
        JSObject payload = new JSObject();
        payload.put("id", "sim-" + System.currentTimeMillis());
        payload.put("packageName", call.getString("packageName", "sim.test"));
        payload.put("appName", call.getString("appName", "Simulated App"));
        payload.put("title", call.getString("title", "Notificacion simulada"));
        payload.put("text", call.getString("text", "Evento simulado sin monto"));
        payload.put("postedAt", System.currentTimeMillis());
        NotificationInterceptStore.push(payload);

        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    private boolean isNotificationListenerEnabled(Context context) {
        String enabledListeners = Settings.Secure.getString(
            context.getContentResolver(),
            "enabled_notification_listeners"
        );
        if (enabledListeners == null || enabledListeners.isEmpty()) {
            return false;
        }

        ComponentName componentName = new ComponentName(context, AtheneaNotificationListenerService.class);
        return enabledListeners.contains(componentName.flattenToString());
    }
}
