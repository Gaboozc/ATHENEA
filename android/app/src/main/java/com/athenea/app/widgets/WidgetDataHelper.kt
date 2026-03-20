package com.athenea.app.widgets

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

object WidgetDataHelper {
    const val PREFS_NAME = "athenea_widget_store"
    const val KEY_WIDGET_DATA = "athenea_widget_data"

    fun getPrefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun getData(context: Context): JSONObject {
        val raw = getPrefs(context).getString(KEY_WIDGET_DATA, "{}")
        return try { JSONObject(raw ?: "{}") } catch (e: Exception) { JSONObject() }
    }

    // ---- Convenience accessors ----

    fun tasksPending(data: JSONObject): Int = data.optInt("tasks_pending", 0)
    fun tasksCritical(data: JSONObject): Int = data.optInt("tasks_critical", 0)
    fun focusActive(data: JSONObject): Boolean = data.optBoolean("focus_active", false)
    fun focusMinutesToday(data: JSONObject): Int = data.optInt("focus_minutes_today", 0)
    fun focusStreak(data: JSONObject): Int = data.optInt("focus_streak", 0)
    fun focusCurrentTask(data: JSONObject): String = data.optString("focus_current_task", "Sin tarea activa")
    fun financeBalance(data: JSONObject): Double = data.optDouble("finance_balance", 0.0)
    fun financeBudget(data: JSONObject): Double = data.optDouble("finance_budget", 1.0)
    fun financeSpent(data: JSONObject): Double = data.optDouble("finance_spent", 0.0)
    fun financeLastExpense(data: JSONObject): JSONObject? = data.optJSONObject("finance_last_expense")
    fun todayEvents(data: JSONObject): JSONArray = data.optJSONArray("today_events") ?: JSONArray()
    fun latestInsight(data: JSONObject): JSONObject? = data.optJSONObject("latest_insight")
    fun routinesToday(data: JSONObject): JSONArray = data.optJSONArray("routines_today") ?: JSONArray()
    fun systemHealth(data: JSONObject): Int = data.optInt("system_health", 0)
    fun expenseCategories(data: JSONObject): JSONArray = data.optJSONArray("expense_categories") ?: JSONArray()

    fun formatMoney(amount: Double): String = "$%.0f".format(amount)

    fun relativeTime(isoTimestamp: String): String {
        return try {
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
            val date = sdf.parse(isoTimestamp) ?: return isoTimestamp
            val diffMs = System.currentTimeMillis() - date.time
            val diffMin = diffMs / 60000
            when {
                diffMin < 1 -> "ahora"
                diffMin < 60 -> "hace ${diffMin}min"
                diffMin < 1440 -> "hace ${diffMin / 60}h"
                else -> "hace ${diffMin / 1440}d"
            }
        } catch (e: Exception) {
            isoTimestamp
        }
    }
}
