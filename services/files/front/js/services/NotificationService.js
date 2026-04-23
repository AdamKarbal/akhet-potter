const LocalNotifications = window.Capacitor?.Plugins?.LocalNotifications;

export const NotificationService = {
    async requestPermission() {
        if (!LocalNotifications) {
            console.log("[Notifications] Désactivées (Mode Web)");
            return;
        }

        const status = await LocalNotifications.requestPermissions();
        if (status.display !== 'granted') {
            console.warn("Permissions de notification refusées.");
        }
    },

    async send(title, body, id = Math.floor(Math.random() * 10000)) {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: title,
                    body: body,
                    id: id,
                    channelId: "default",
                    schedule: { at: new Date(Date.now() + 500) },
                    actionTypeId: "GOTO_PAGE",
                    extra: null
                }
            ]
        });
    },

    initListeners() {
        if (!LocalNotifications) return;
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            console.log('Notification cliquée:', action.notification);
        });
    }
};