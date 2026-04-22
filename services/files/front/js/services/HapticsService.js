export const HapticsService = {
    async vibrateMove() {
        console.log("[HAPTICS] Vibration LÉGÈRE (Déplacement)");
        try {
            if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
                await window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' });
            }
        } catch (e) {
        }
    },

    async vibrateDestroy() {
        console.log("[HAPTICS] Vibration FORTE (Destruction)");
        try {
            if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
                await window.Capacitor.Plugins.Haptics.impact({ style: 'HEAVY' });
                await window.Capacitor.Plugins.Haptics.vibrate({ duration: 200 });
            }
        } catch (e) {
        }
    },

    async vibrateMatchFound() {
        console.log("[HAPTICS] Vibration SUCCÈS (Match trouvé)");
        try {
            if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
                await window.Capacitor.Plugins.Haptics.notification({ type: 'SUCCESS' });
                await window.Capacitor.Plugins.Haptics.vibrate({ duration: 200 });
            }
        } catch (e) {
        }
    }
};