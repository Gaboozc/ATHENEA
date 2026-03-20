package com.athenea.app.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.athenea.app.R

class FinanceQuickLogWidget : AppWidgetProvider() {

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
        private val CAT_IDS = listOf(R.id.wfqlCat1, R.id.wfqlCat2, R.id.wfqlCat3, R.id.wfqlCat4)

        // Fallback categories in case SharedPreferences has no data yet
        private val DEFAULT_CATS = listOf(
            Pair("1", "🍔 Comida"),
            Pair("2", "🚗 Trans."),
            Pair("3", "💊 Salud"),
            Pair("4", "🎮 Ocio")
        )

        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, FinanceQuickLogWidget::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
            val data = WidgetDataHelper.getData(context)
            val views = RemoteViews(context.packageName, R.layout.widget_finance_quick_log)

            val cats = WidgetDataHelper.expenseCategories(data)
            val catList = if (cats.length() > 0) {
                (0 until minOf(cats.length(), 4)).map { i ->
                    val obj = cats.optJSONObject(i)
                    val catId = obj?.optString("id", "$i") ?: "$i"
                    val icon = obj?.optString("icon", "") ?: ""
                    val name = obj?.optString("name", "") ?: ""
                    Pair(catId, "$icon $name")
                }
            } else {
                DEFAULT_CATS
            }

            for (i in catList.indices) {
                val (catId, label) = catList[i]
                views.setTextViewText(CAT_IDS[i], label)

                val deeplink = "athenea://finance/log?category=$catId"
                val intent = buildDeeplinkIntent(context, deeplink)
                val pi = PendingIntent.getActivity(
                    context, id * 10 + i + 7700, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(CAT_IDS[i], pi)
            }

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
