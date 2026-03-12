package com.athenea.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import java.util.ArrayDeque;
import java.util.Queue;

public final class NotificationInterceptStore {
    private static final int MAX_ITEMS = 60;
    private static final Queue<JSObject> QUEUE = new ArrayDeque<>();

    private NotificationInterceptStore() {}

    public static synchronized void push(JSObject payload) {
        QUEUE.add(payload);
        while (QUEUE.size() > MAX_ITEMS) {
            QUEUE.poll();
        }
    }

    public static synchronized JSArray pullAll() {
        JSArray results = new JSArray();
        while (!QUEUE.isEmpty()) {
            results.put(QUEUE.poll());
        }
        return results;
    }

    public static synchronized int size() {
        return QUEUE.size();
    }
}
