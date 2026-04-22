const { LocalNotifications } = Capacitor.Plugins;

export const NotificationService = {
    // Demander les permissions au démarrage
    async requestPermission() {
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
                    sound: 'beep.wav', // Assure-toi d'avoir ce fichier dans assets/res/raw sur Android
                    actionTypeId: "GOTO_PAGE",
                    extra: null
                }
            ]
        });
    },

    initListeners() {
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            // Logique de redirection si besoin
            console.log('Notification cliquée:', action.notification);
        });
    }
};