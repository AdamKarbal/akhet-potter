const LocalNotifications = window.Capacitor?.Plugins?.LocalNotifications;

export const NotificationService = {
    getPlugin() {
        const plugin = window.Capacitor?.Plugins?.LocalNotifications;
        if (!plugin) {
            console.warn("[Notifications] Plugin LocalNotifications non trouvé.");
        }
        return plugin;
    },

    async requestPermission() {
        if (!LocalNotifications) {
            console.log("[Notifications] Désactivées (Mode Web)");
            return;
        }

        await LocalNotifications.createChannel({
            id: 'duel-notifications',
            name: 'Invitations de duel/amis',
            description: 'Notifications pour les défis et demandes d amis',
            importance: 5,
            visibility: 1,
            vibration: true
        });

        const status = await LocalNotifications.requestPermissions();
        if (status.display !== 'granted') {
            console.warn("Permissions de notification refusées.");
        }
    },

    async send(title, body, id = Math.floor(Math.random() * 10000)) {
        const notifs = this.getPlugin();

        if (!notifs) {
            console.log("[Notifications Web Sim] :", title, body);
            return;
        }

        try {
            await notifs.schedule({
                notifications: [
                    {
                        title: title,
                        body: body,
                        id: id,
                        channelId: "duel-notifications",
                        schedule: { at: new Date(Date.now() + 100) },
                        actionTypeId: "GOTO_PAGE"
                    }
                ]
            });
            console.log("[Notifications] Notif envoyée avec succès");
        } catch (err) {
            console.error("[Notifications] Erreur schedule:", err);
        }
    },

    initListeners() {
        if (!LocalNotifications) return;
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            console.log('Notification cliquée:', action.notification);
        });
    }
};