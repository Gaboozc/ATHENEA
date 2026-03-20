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
import kotlin.math.roundToInt

class FinanceSnapshotWidget : AppWidgetProvider() {

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
            val ids = manager.getAppWidgetIds(ComponentName(context, FinanceSnapshotWidget::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
            val data = WidgetDataHelper.getData(context)
            val views = RemoteViews(context.packageName, R.layout.widget_finance_snapshot)

            val budget = WidgetDataHelper.financeBudget(data).let { if (it == 0.0) 1.0 else it }
            val spent = WidgetDataHelper.financeSpent(data)
            val pctSpent = ((spent / budget) * 100).roundToInt().coerceIn(0, 100)
            val pctAvailable = 100 - pctSpent

            // Progress bar
            views.setProgressBar(R.id.wfsProgressBar, 100, pctSpent, false)
            // Tint via setInt is not available for progressTint; color is set in XML defaults.
            // Override progress tint to red if overspent
            if (pctSpent >= 90) {
                views.setInt(R.id.wfsProgressBar, "setProgressTintList", Color.parseColor("#ef4444"))
            }

            // Available % color
            val availColor = when {
                pctAvailable > 30 -> Color.parseColor("#22c55e")
                pctAvailable >= 10 -> Color.parseColor("#f59e0b")
                else -> Color.parseColor("#ef4444")
            }
            views.setTextViewText(R.id.wfsAvailable, "Disponible: $pctAvailable%")
            views.setTextColor(R.id.wfsAvailable, availColor)

            views.setTextViewText(
                R.id.wfsAmounts,
                "${WidgetDataHelper.formatMoney(spent)} / ${WidgetDataHelper.formatMoney(budget)}"
            )

            val lastExpense = WidgetDataHelper.financeLastExpense(data)
            val lastText = if (lastExpense != null) {
                val note = lastExpense.optString("note", "—")
                val amount = lastExpense.optDouble("amount", 0.0)
                "Último: $note ${WidgetDataHelper.formatMoney(amount)}"
            } else "Último: —"
            views.setTextViewText(R.id.wfsLastExpense, lastText)

            // Log button
            val logIntent = buildDeeplinkIntent(context, "athenea://finance/log")
            val logPi = PendingIntent.getActivity(
                context, id + 2200, logIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.wfsLogBtn, logPi)

            // Root tap
            val rootIntent = buildDeeplinkIntent(context, "athenea://finance")
            val rootPi = PendingIntent.getActivity(
                context, id + 2201, rootIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.wfsRoot, rootPi)

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
