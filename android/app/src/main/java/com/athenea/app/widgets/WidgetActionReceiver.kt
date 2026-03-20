package com.athenea.app.widgets

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import org.json.JSONObject

/**
 * Handles broadcast actions dispatched from all 9 widgets.
 * Writes a pending action to SharedPreferences so the JS layer
 * can consume it via WidgetBridgePlugin.consumePendingAction().
 * For routine toggles it also triggers an immediate widget refresh.
 */
class WidgetActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent == null || intent.action == null) return

        val prefs: SharedPreferences = context.getSharedPreferences(
            WidgetDataHelper.PREFS_NAME, Context.MODE_PRIVATE
        )

        when (intent.action) {
            "com.athenea.app.WIDGET_TOGGLE_ROUTINE" -> {
                val routineId = intent.getStringExtra("routine_id") ?: return
                val newDone = intent.getBooleanExtra("routine_done", true)

                // Write pending action for JS consumption
                try {
                    val payload = JSONObject()
                    payload.put("type", "toggle_routine")
                    payload.put("routineId", routineId)
                    payload.put("done", newDone)
                    prefs.edit()
                        .putString("widget_pending_action_json", payload.toString())
                        .apply()
                } catch (e: Exception) { /* ignore */ }

                // Optimistically update SharedPrefs data and refresh widget
                try {
                    val raw = prefs.getString(WidgetDataHelper.KEY_WIDGET_DATA, "{}") ?: "{}"
                    val data = JSONObject(raw)
                    val routines = data.optJSONArray("routines_today")
                    if (routines != null) {
                        for (i in 0 until routines.length()) {
                            val r = routines.optJSONObject(i) ?: continue
                            if (r.optString("id") == routineId) {
                                r.put("done", newDone)
                                break
                            }
                        }
                        data.put("routines_today", routines)
                        prefs.edit().putString(WidgetDataHelper.KEY_WIDGET_DATA, data.toString()).apply()
                    }
                } catch (e: Exception) { /* ignore */ }

                HabitTrackerWidget.updateAllWidgets(context)

                // Launch app to sync state back
                val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    context.startActivity(launch)
                }
            }

            else -> {
                // Generic — launch app
                val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    context.startActivity(launch)
                }
            }
        }
    }
}
