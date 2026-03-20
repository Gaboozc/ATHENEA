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

class PendingTasksWidget : AppWidgetProvider() {

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
            val ids = manager.getAppWidgetIds(ComponentName(context, PendingTasksWidget::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
            val data = WidgetDataHelper.getData(context)
            val views = RemoteViews(context.packageName, R.layout.widget_pending_tasks)

            val pending = WidgetDataHelper.tasksPending(data)
            val critical = WidgetDataHelper.tasksCritical(data)

            if (pending == 0) {
                views.setTextViewText(R.id.wptCount, "✓")
                views.setTextColor(R.id.wptCount, Color.parseColor("#22c55e"))
                views.setTextViewText(R.id.wptCritical, "Al día")
                views.setTextColor(R.id.wptCritical, Color.parseColor("#22c55e"))
            } else {
                views.setTextViewText(R.id.wptCount, "$pending")
                val countColor = if (critical > 0) Color.parseColor("#ef4444") else Color.parseColor("#1ec9ff")
                views.setTextColor(R.id.wptCount, countColor)
                views.setTextViewText(R.id.wptCritical, "$critical críticas")
            }

            val launchIntent = buildDeeplinkIntent(context, "athenea://tasks")
            val pi = PendingIntent.getActivity(
                context, id + 3300, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.wptRoot, pi)

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
