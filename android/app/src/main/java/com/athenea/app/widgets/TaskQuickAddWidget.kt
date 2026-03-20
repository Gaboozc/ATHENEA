package com.athenea.app.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.athenea.app.R

class TaskQuickAddWidget : AppWidgetProvider() {

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
            val ids = manager.getAppWidgetIds(ComponentName(context, TaskQuickAddWidget::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_task_quick_add)

            val intent = buildNewTaskIntent(context)
            val pi = PendingIntent.getActivity(
                context, id + 1100, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            // Both the "input field" and the "+" button open the app
            views.setOnClickPendingIntent(R.id.wtqaRoot, pi)
            views.setOnClickPendingIntent(R.id.wtqaInput, pi)
            views.setOnClickPendingIntent(R.id.wtqaAddBtn, pi)

            manager.updateAppWidget(id, views)
        }

        private fun buildNewTaskIntent(context: Context): Intent {
            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
                ?: Intent()
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            launch.putExtra("capacitor_deeplink", "athenea://task/new")
            return launch
        }
    }
}
