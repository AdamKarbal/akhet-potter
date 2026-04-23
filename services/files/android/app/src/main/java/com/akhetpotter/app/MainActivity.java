package com.akhetpotter.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.app.Notification;
import android.webkit.JavascriptInterface;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String PLAY_REMINDER_CHANNEL_ID = "play-reminders-heads-up";
    private static final int PLAY_REMINDER_NOTIFICATION_ID = 90001;
    private static final int POST_NOTIFICATIONS_REQUEST_CODE = 42;
    private static final long PLAY_REMINDER_INTERVAL_MS = 15_000L;
    private static final String NOTIFICATION_PREFS = "notification-settings";
    private static final String NOTIFICATIONS_ENABLED_KEY = "notifications-enabled";

    private final Handler playReminderHandler = new Handler(Looper.getMainLooper());
    private boolean playReminderRunning = false;
    private final Runnable playReminderRunnable = new Runnable() {
        @Override
        public void run() {
            if (!playReminderRunning) return;

            showPlayReminderNotification();
            playReminderHandler.postDelayed(this, PLAY_REMINDER_INTERVAL_MS);
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new NotificationSettingsBridge(), "AndroidNotificationSettings");
        }
        createPlayReminderChannel();
        requestNotificationPermissionIfNeeded();
    }

    @Override
    public void onStart() {
        super.onStart();
        stopPlayReminders();
    }

    @Override
    public void onStop() {
        super.onStop();
        if (!isFinishing()) {
            startPlayReminders();
        }
    }

    @Override
    public void onDestroy() {
        stopPlayReminders();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().destroy();
        }
        super.onDestroy();
    }

    private void startPlayReminders() {
        if (!areNotificationsEnabled()) return;
        if (playReminderRunning) return;

        playReminderRunning = true;
        playReminderHandler.postDelayed(playReminderRunnable, PLAY_REMINDER_INTERVAL_MS);
    }

    private void stopPlayReminders() {
        playReminderRunning = false;
        playReminderHandler.removeCallbacks(playReminderRunnable);
        NotificationManagerCompat.from(this).cancel(PLAY_REMINDER_NOTIFICATION_ID);
    }

    private void createPlayReminderChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationChannel channel = new NotificationChannel(
            PLAY_REMINDER_CHANNEL_ID,
            "Rappels de jeu",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Rappels pour revenir jouer a Akhet Potter");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 250, 150, 250});
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        Uri soundUri = Settings.System.DEFAULT_NOTIFICATION_URI;
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        channel.setSound(soundUri, audioAttributes);

        NotificationManager notificationManager = getSystemService(NotificationManager.class);
        if (notificationManager != null) {
            notificationManager.createNotificationChannel(channel);
        }
    }

    private void requestNotificationPermissionIfNeeded() {
        if (!areNotificationsEnabled()) return;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            return;
        }

        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, POST_NOTIFICATIONS_REQUEST_CODE);
    }

    private void showPlayReminderNotification() {
        if (!areNotificationsEnabled()) {
            stopPlayReminders();
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, PLAY_REMINDER_CHANNEL_ID)
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle("Akhet Potter t'attend")
            .setContentText("Viens jouer une partie !")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);

        NotificationManagerCompat.from(this).notify(PLAY_REMINDER_NOTIFICATION_ID, builder.build());
    }

    private boolean areNotificationsEnabled() {
        return getSharedPreferences(NOTIFICATION_PREFS, MODE_PRIVATE)
            .getBoolean(NOTIFICATIONS_ENABLED_KEY, true);
    }

    private void setNotificationsEnabled(boolean enabled) {
        SharedPreferences.Editor editor = getSharedPreferences(NOTIFICATION_PREFS, MODE_PRIVATE).edit();
        editor.putBoolean(NOTIFICATIONS_ENABLED_KEY, enabled);
        editor.apply();

        if (!enabled) {
            stopPlayReminders();
        } else {
            requestNotificationPermissionIfNeeded();
        }
    }

    private class NotificationSettingsBridge {
        @JavascriptInterface
        public void setNotificationsEnabled(boolean enabled) {
            MainActivity.this.runOnUiThread(() -> MainActivity.this.setNotificationsEnabled(enabled));
        }
    }
}
