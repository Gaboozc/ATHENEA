package com.athenea.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    public static final String PREFS_NAME = "athenea_widget_store";
    public static final String KEY_WIDGET_STATE = "widget_state_json";
    public static final String KEY_PENDING_ACTION = "widget_pending_action_json";

    @PluginMethod
    public void updateWidgetState(PluginCall call) {
        String payload = call.getString("payload", "{}");

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_WIDGET_STATE, payload).apply();

        Intent updateIntent = new Intent(getContext(), AtheneaWidgetProvider.class);
        updateIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(getContext())
            .getAppWidgetIds(new ComponentName(getContext(), AtheneaWidgetProvider.class));
        updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        getContext().sendBroadcast(updateIntent);

        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    @PluginMethod
    public void consumePendingAction(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String action = prefs.getString(KEY_PENDING_ACTION, null);
        prefs.edit().remove(KEY_PENDING_ACTION).apply();

        JSObject result = new JSObject();
        result.put("action", action);
        call.resolve(result);
    }
}
