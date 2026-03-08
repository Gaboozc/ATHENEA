package com.athenea.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import org.json.JSONObject;

public class AtheneaWidgetActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String actionType;
        String prompt = intent.getStringExtra("prompt");
        String taskId = intent.getStringExtra("taskId");

        switch (intent.getAction()) {
            case "com.athenea.app.WIDGET_OPEN_OMNIBAR":
                actionType = "open_omnibar";
                break;
            case "com.athenea.app.WIDGET_OPEN_VOICE":
                actionType = "open_voice";
                break;
            case "com.athenea.app.WIDGET_CHECK_TASK":
                actionType = "complete_task";
                break;
            default:
                return;
        }

        try {
            JSONObject payload = new JSONObject();
            payload.put("type", actionType);
            if (prompt != null) payload.put("prompt", prompt);
            if (taskId != null) payload.put("taskId", taskId);

            SharedPreferences prefs = context.getSharedPreferences(WidgetBridgePlugin.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(WidgetBridgePlugin.KEY_PENDING_ACTION, payload.toString()).apply();
        } catch (Exception ignored) {
        }

        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(launch);
        }
    }
}
