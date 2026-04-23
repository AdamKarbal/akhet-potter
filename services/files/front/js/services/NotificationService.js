const NOTIFICATION_SETTING_KEY = "notificationsEnabled";
const LocalNotifications = window.Capacitor?.Plugins?.LocalNotifications;

export const NotificationService = {
    isEnabled() {
        return localStorage.getItem(NOTIFICATION_SETTING_KEY) !== "false";
    },

    setEnabled(enabled) {
        localStorage.setItem(NOTIFICATION_SETTING_KEY, String(Boolean(enabled)));

        if (window.AndroidNotificationSettings?.setNotificationsEnabled) {
            window.AndroidNotificationSettings.setNotificationsEnabled(Boolean(enabled));
        }
    },

    syncNativeSetting() {
        this.setEnabled(this.isEnabled());
    },

    clearLocalStoragePreservingSetting() {
        const enabled = this.isEnabled();
        localStorage.clear();
        this.setEnabled(enabled);
    },

    getPlugin() {
        const plugin = window.Capacitor?.Plugins?.LocalNotifications;
        if (!plugin) {
            console.warn("[Notifications] Plugin LocalNotifications non trouve.");
        }
        return plugin;
    },

    async requestPermission() {
        if (!this.isEnabled()) return;

        if (!LocalNotifications) {
            console.log("[Notifications] Desactivees (Mode Web)");
            return;
        }

        await LocalNotifications.createChannel({
            id: 'duel-notifications',
            name: 'Invitations de duel/amis',
            description: 'Notifications pour les defis et demandes d amis',
            importance: 5,
            visibility: 1,
            vibration: true
        });

        const status = await LocalNotifications.requestPermissions();
        if (status.display !== 'granted') {
            console.warn("Permissions de notification refusees.");
        }
    },

    async send(title, body, id = Math.floor(Math.random() * 10000)) {
        if (!this.isEnabled()) return;

        const notifs = this.getPlugin();

        if (!notifs) {
            console.log("[Notifications Web Sim] :", title, body);
            return;
        }

        try {
            await notifs.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id,
                        channelId: "duel-notifications",
                        schedule: { at: new Date(Date.now() + 100) },
                        actionTypeId: "GOTO_PAGE"
                    }
                ]
            });
            console.log("[Notifications] Notif envoyee avec succes");
        } catch (err) {
            console.error("[Notifications] Erreur schedule:", err);
        }
    },

    initListeners() {
        if (!LocalNotifications) return;
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            console.log('Notification cliquee:', action.notification);
        });
    }
};
