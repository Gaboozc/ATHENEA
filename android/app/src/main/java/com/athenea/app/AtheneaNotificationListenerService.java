package com.athenea.app;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import com.getcapacitor.JSObject;

public class AtheneaNotificationListenerService extends NotificationListenerService {
    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) {
            return;
        }

        CharSequence titleSeq = sbn.getNotification().extras.getCharSequence("android.title", "");
        CharSequence textSeq = sbn.getNotification().extras.getCharSequence("android.text", "");

        JSObject payload = new JSObject();
        payload.put("id", sbn.getPackageName() + "-" + sbn.getPostTime());
        payload.put("packageName", sbn.getPackageName());
        payload.put("appName", sbn.getPackageName());
        payload.put("title", titleSeq != null ? titleSeq.toString() : "");
        payload.put("text", textSeq != null ? textSeq.toString() : "");
        payload.put("postedAt", sbn.getPostTime());

        NotificationInterceptStore.push(payload);
    }
}
