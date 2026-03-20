package com.athenea.app.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews
import com.athenea.app.R

class HabitTrackerWidget : AppWidgetProvider() {

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
        private val ROUTINE_ROWS = listOf(
            Triple(R.id.whtRoutine1Row, R.id.whtRoutine1Check, R.id.whtRoutine1Name),
            Triple(R.id.whtRoutine2Row, R.id.whtRoutine2Check, R.id.whtRoutine2Name),
            Triple(R.id.whtRoutine3Row, R.id.whtRoutine3Check, R.id.whtRoutine3Name)
        )

        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, HabitTrackerWidget::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
            val data = WidgetDataHelper.getData(context)
            val views = RemoteViews(context.packageName, R.layout.widget_habit_tracker)

            val routines = WidgetDataHelper.routinesToday(data)
            val total = routines.length()
            var done = 0

            // Hide all routine rows
            for ((rowId, _, _) in ROUTINE_ROWS) {
                views.setViewVisibility(rowId, View.GONE)
            }
            views.setViewVisibility(R.id.whtEmpty, View.GONE)

            if (total == 0) {
                views.setViewVisibility(R.id.whtEmpty, View.VISIBLE)
                views.setTextViewText(R.id.whtProgress, "0/0 ✓")
            } else {
                val visible = minOf(total, 3)
                for (i in 0 until visible) {
                    val routine = routines.optJSONObject(i) ?: continue
                    val isDone = routine.optBoolean("done", false)
                    val routineId = routine.optString("id", "")
                    val name = routine.optString("name", "")
                    if (isDone) done++

                    val (rowId, checkId, nameId) = ROUTINE_ROWS[i]
                    views.setViewVisibility(rowId, View.VISIBLE)
                    views.setTextViewText(nameId, name)

                    if (isDone) {
                        views.setTextViewText(checkId, "✓")
                        views.setTextColor(checkId, Color.parseColor("#22c55e"))
                    } else {
                        views.setTextViewText(checkId, "○")
                        views.setTextColor(checkId, Color.parseColor("#9aa3ad"))
                    }

                    // Tap on row → toggle routine via widget action
                    val toggleIntent = Intent(context, WidgetActionReceiver::class.java).apply {
                        action = "com.athenea.app.WIDGET_TOGGLE_ROUTINE"
                        putExtra("routine_id", routineId)
                        putExtra("routine_done", !isDone)
                    }
                    val togglePi = PendingIntent.getBroadcast(
                        context, id * 100 + i + 6600, toggleIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    views.setOnClickPendingIntent(rowId, togglePi)
                }

                views.setTextViewText(R.id.whtProgress, "$done/$total ✓")
            }

            val launchIntent = buildDeeplinkIntent(context, "athenea://routines")
            val pi = PendingIntent.getActivity(
                context, id + 6601, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.whtRoot, pi)

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
