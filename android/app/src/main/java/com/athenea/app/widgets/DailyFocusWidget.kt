package com.athenea.app.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import com.athenea.app.R

class DailyFocusWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) {
            updateWidget(context, appWidgetManager, id)
        }
    }

    companion object {
        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, DailyFocusWidget::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
            val data = WidgetDataHelper.getData(context)
            val views = RemoteViews(context.packageName, R.layout.widget_daily_focus)

            val focusActive = WidgetDataHelper.focusActive(data)
            val streak = WidgetDataHelper.focusStreak(data)
            val minutesToday = WidgetDataHelper.focusMinutesToday(data)
            val currentTask = WidgetDataHelper.focusCurrentTask(data)

            views.setTextViewText(R.id.wdfStreak, "racha: $streak 🔥")
            views.setTextViewText(R.id.wdfTask, "Tarea: $currentTask")

            if (focusActive) {
                views.setTextViewText(R.id.wdfTimer, "⏱ ${minutesToday}:00")
                views.setTextColor(R.id.wdfTimer, Color.parseColor("#1ec9ff"))
                views.setTextViewText(R.id.wdfPlayPause, "⏸ Pausar")
            } else {
                views.setTextViewText(R.id.wdfTimer, "⏱ 25:00")
                views.setTextColor(R.id.wdfTimer, Color.parseColor("#9aa3ad"))
                views.setTextViewText(R.id.wdfPlayPause, "▶ Iniciar")
            }

            // Tap entire widget → open app
            val launchIntent = buildDeeplinkIntent(context, "athenea://focus")
            val pi = PendingIntent.getActivity(
                context, id, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.wdfRoot, pi)

            // Play/pause button → open app focus screen
            val playIntent = buildDeeplinkIntent(context, "athenea://focus/toggle")
            val playPi = PendingIntent.getActivity(
                context, id + 9000, playIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.wdfPlayPause, playPi)

            manager.updateAppWidget(id, views)
        }

        private fun buildDeeplinkIntent(context: Context, deeplink: String): Intent {
            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
                ?: Intent()
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            launch.putExtra("capacitor_deeplink", deeplink)
            return launch
        }
    }
}
