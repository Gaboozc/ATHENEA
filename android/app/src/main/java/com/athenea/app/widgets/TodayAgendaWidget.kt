package com.athenea.app.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import com.athenea.app.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class TodayAgendaWidget : AppWidgetProvider() {

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
        private val ROW_IDS = listOf(
            Triple(R.id.wtaEvent1Row, R.id.wtaEvent1Time, R.id.wtaEvent1Title),
            Triple(R.id.wtaEvent2Row, R.id.wtaEvent2Time, R.id.wtaEvent2Title),
            Triple(R.id.wtaEvent3Row, R.id.wtaEvent3Time, R.id.wtaEvent3Title),
            Triple(R.id.wtaEvent4Row, R.id.wtaEvent4Time, R.id.wtaEvent4Title)
        )

        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, TodayAgendaWidget::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
            val data = WidgetDataHelper.getData(context)
            val views = RemoteViews(context.packageName, R.layout.widget_today_agenda)

            // Header with current date
            val dayFmt = SimpleDateFormat("EEEE d MMM", Locale("es", "ES"))
            views.setTextViewText(R.id.wtaHeader, "📅 Hoy — ${dayFmt.format(Date())}")

            val events = WidgetDataHelper.todayEvents(data)
            val count = events.length()

            // Hide all rows first
            for ((rowId, _, _) in ROW_IDS) {
                views.setViewVisibility(rowId, View.GONE)
            }
            views.setViewVisibility(R.id.wtaEmpty, View.GONE)

            if (count == 0) {
                views.setViewVisibility(R.id.wtaEmpty, View.VISIBLE)
            } else {
                val visible = minOf(count, 4)
                for (i in 0 until visible) {
                    val event = events.optJSONObject(i) ?: continue
                    val (rowId, timeId, titleId) = ROW_IDS[i]
                    views.setViewVisibility(rowId, View.VISIBLE)
                    views.setTextViewText(timeId, event.optString("time", ""))
                    views.setTextViewText(titleId, event.optString("title", ""))
                }
            }

            val launchIntent = buildDeeplinkIntent(context, "athenea://calendar")
            val pi = PendingIntent.getActivity(
                context, id + 4400, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.wtaRoot, pi)

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
