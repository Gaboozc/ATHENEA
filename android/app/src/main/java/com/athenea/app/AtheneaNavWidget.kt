package com.athenea.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.app.PendingIntent
import android.content.Intent
import android.net.Uri

class AtheneaNavWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_nav)

        // Botón Work
        val workIntent = Intent(Intent.ACTION_VIEW,
            Uri.parse("athenea://work"), context, MainActivity::class.java)
        val workPending = PendingIntent.getActivity(
            context, 0, workIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_btn_work, workPending)

        // Botón Personal
        val personalIntent = Intent(Intent.ACTION_VIEW,
            Uri.parse("athenea://personal"), context, MainActivity::class.java)
        val personalPending = PendingIntent.getActivity(
            context, 1, personalIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_btn_personal, personalPending)

        // Botón Finance
        val financeIntent = Intent(Intent.ACTION_VIEW,
            Uri.parse("athenea://finance"), context, MainActivity::class.java)
        val financePending = PendingIntent.getActivity(
            context, 2, financeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_btn_finance, financePending)

        // Botón Omnibar
        val omnibarIntent = Intent(Intent.ACTION_VIEW,
            Uri.parse("athenea://omnibar"), context, MainActivity::class.java)
        val omnibarPending = PendingIntent.getActivity(
            context, 3, omnibarIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_btn_omnibar, omnibarPending)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
