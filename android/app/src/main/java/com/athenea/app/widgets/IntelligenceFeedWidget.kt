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

class IntelligenceFeedWidget : AppWidgetProvider() {

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
            val ids = manager.getAppWidgetIds(ComponentName(context, IntelligenceFeedWidget::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
            val data = WidgetDataHelper.getData(context)
            val views = RemoteViews(context.packageName, R.layout.widget_intelligence_feed)

            val insight = WidgetDataHelper.latestInsight(data)
            if (insight != null) {
                val title = insight.optString("title", "Sin insights recientes")
                val severity = insight.optString("severity", "info").uppercase()
                val timestamp = insight.optString("timestamp", "")

                views.setTextViewText(R.id.wifInsightText, title)
                views.setTextViewText(R.id.wifSeverityBadge, severity)
                views.setTextViewText(
                    R.id.wifTimestamp,
                    if (timestamp.isNotEmpty()) WidgetDataHelper.relativeTime(timestamp) else "—"
                )

                val badgeColor = when (severity) {
                    "HIGH" -> Color.parseColor("#ef4444")
                    "MEDIUM" -> Color.parseColor("#f59e0b")
                    "LOW" -> Color.parseColor("#3b82f6")
                    else -> Color.parseColor("#4a5568")
                }
                views.setInt(R.id.wifSeverityBadge, "setBackgroundColor", badgeColor)
            } else {
                views.setTextViewText(R.id.wifInsightText, "No hay insights recientes")
                views.setTextViewText(R.id.wifSeverityBadge, "INFO")
                views.setTextViewText(R.id.wifTimestamp, "—")
            }

            val launchIntent = buildDeeplinkIntent(context, "athenea://intelligence")
            val pi = PendingIntent.getActivity(
                context, id + 5500, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.wifRoot, pi)
            views.setOnClickPendingIntent(R.id.wifViewBtn, pi)

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
