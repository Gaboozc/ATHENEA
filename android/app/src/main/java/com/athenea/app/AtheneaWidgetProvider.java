package com.athenea.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONObject;

public class AtheneaWidgetProvider extends AppWidgetProvider {

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(WidgetBridgePlugin.PREFS_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(WidgetBridgePlugin.KEY_WIDGET_STATE, "{}");

        String pulse = "Stable";
        String insightTitle = "No urgent insights";
        String eventTitle = "No upcoming event";
        String eventAt = "";
        String prompt = "Open ATHENEA Omnibar";
        String taskId = "";

        try {
            JSONObject json = new JSONObject(raw);
            pulse = json.optString("pulseStatus", pulse);
            insightTitle = json.optString("topInsightTitle", insightTitle);
            eventTitle = json.optString("nextEventTitle", eventTitle);
            eventAt = json.optString("nextEventAt", eventAt);
            prompt = json.optString("topInsightPrompt", prompt);
            taskId = json.optString("checkTaskId", "");
        } catch (Exception ignored) {
        }

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.athenea_widget);
        views.setTextViewText(R.id.widgetPulse, pulse);
        views.setTextViewText(R.id.widgetInsightTitle, insightTitle);
        views.setTextViewText(R.id.widgetEventTitle, eventTitle);
        views.setTextViewText(R.id.widgetEventAt, eventAt);

        Intent openIntent = new Intent(context, AtheneaWidgetActionReceiver.class);
        openIntent.setAction("com.athenea.app.WIDGET_OPEN_OMNIBAR");
        openIntent.putExtra("prompt", prompt);
        PendingIntent openPendingIntent = PendingIntent.getBroadcast(
            context,
            appWidgetId,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widgetRoot, openPendingIntent);

        Intent micIntent = new Intent(context, AtheneaWidgetActionReceiver.class);
        micIntent.setAction("com.athenea.app.WIDGET_OPEN_VOICE");
        micIntent.putExtra("prompt", "Sync my calendar");
        PendingIntent micPendingIntent = PendingIntent.getBroadcast(
            context,
            appWidgetId + 1000,
            micIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widgetMicButton, micPendingIntent);

        Intent checkIntent = new Intent(context, AtheneaWidgetActionReceiver.class);
        checkIntent.setAction("com.athenea.app.WIDGET_CHECK_TASK");
        checkIntent.putExtra("taskId", taskId);
        PendingIntent checkPendingIntent = PendingIntent.getBroadcast(
            context,
            appWidgetId + 2000,
            checkIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widgetCheckButton, checkPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void requestUpdate(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] ids = appWidgetManager.getAppWidgetIds(new ComponentName(context, AtheneaWidgetProvider.class));
        for (int id : ids) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }
}
