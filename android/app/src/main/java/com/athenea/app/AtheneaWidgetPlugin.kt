package com.athenea.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import com.athenea.app.widgets.DailyFocusWidget
import com.athenea.app.widgets.FinanceQuickLogWidget
import com.athenea.app.widgets.FinanceSnapshotWidget
import com.athenea.app.widgets.HabitTrackerWidget
import com.athenea.app.widgets.IntelligenceFeedWidget
import com.athenea.app.widgets.PendingTasksWidget
import com.athenea.app.widgets.SystemHealthWidget
import com.athenea.app.widgets.TaskQuickAddWidget
import com.athenea.app.widgets.TodayAgendaWidget
import com.athenea.app.widgets.WidgetDataHelper
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * AtheneaWidgetPlugin
 *
 * Capacitor plugin that bridges JS (Redux state) → Android SharedPreferences
 * and triggers a refresh of all 9 home-screen widgets.
 *
 * JS usage:
 *   import { Plugins } from '@capacitor/core';
 *   const { AtheneaWidget } = Plugins;
 *   await AtheneaWidget.updateWidgetData({ payload: JSON.stringify(widgetData) });
 */
@CapacitorPlugin(name = "AtheneaWidget")
class AtheneaWidgetPlugin : Plugin() {

    /**
     * Write the full widget data JSON blob to SharedPreferences
     * and force-refresh all 9 widget providers.
     *
     * Expected call from JS:
     *   AtheneaWidget.updateWidgetData({ payload: '{"tasks_pending":3,...}' })
     */
    @PluginMethod
    fun updateWidgetData(call: PluginCall) {
        val payload = call.getString("payload", "{}") ?: "{}"

        val prefs: SharedPreferences = context.getSharedPreferences(
            WidgetDataHelper.PREFS_NAME, Context.MODE_PRIVATE
        )
        prefs.edit().putString(WidgetDataHelper.KEY_WIDGET_DATA, payload).apply()

        // Refresh all 9 widget families
        refreshAll(context)

        val result = JSObject()
        result.put("ok", true)
        call.resolve(result)
    }

    /**
     * Read and clear the pending action written by WidgetActionReceiver
     * (e.g. routine toggle triggered from the Habit Tracker widget).
     *
     * JS usage:
     *   const { action } = await AtheneaWidget.consumePendingAction();
     *   if (action) { const parsed = JSON.parse(action); ... }
     */
    @PluginMethod
    fun consumePendingAction(call: PluginCall) {
        val prefs: SharedPreferences = context.getSharedPreferences(
            WidgetDataHelper.PREFS_NAME, Context.MODE_PRIVATE
        )
        val action = prefs.getString("widget_pending_action_json", null)
        prefs.edit().remove("widget_pending_action_json").apply()

        val result = JSObject()
        result.put("action", action)
        call.resolve(result)
    }

    /**
     * Manually request a widget refresh without changing stored data.
     */
    @PluginMethod
    fun refreshWidgets(call: PluginCall) {
        refreshAll(context)
        val result = JSObject()
        result.put("ok", true)
        call.resolve(result)
    }

    companion object {
        fun refreshAll(context: Context) {
            DailyFocusWidget.updateAllWidgets(context)
            TaskQuickAddWidget.updateAllWidgets(context)
            FinanceSnapshotWidget.updateAllWidgets(context)
            PendingTasksWidget.updateAllWidgets(context)
            TodayAgendaWidget.updateAllWidgets(context)
            IntelligenceFeedWidget.updateAllWidgets(context)
            HabitTrackerWidget.updateAllWidgets(context)
            FinanceQuickLogWidget.updateAllWidgets(context)
            SystemHealthWidget.updateAllWidgets(context)
        }
    }
}
