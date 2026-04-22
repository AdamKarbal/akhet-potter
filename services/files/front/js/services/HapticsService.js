const HAPTICS_STORAGE_KEY = "hapticsEnabled";

const isEnabled = () => localStorage.getItem(HAPTICS_STORAGE_KEY) !== "false";

export const HapticsService = {
    setEnabled(enabled) {
        localStorage.setItem(HAPTICS_STORAGE_KEY, String(Boolean(enabled)));
    },

    isEnabled() {
        return isEnabled();
    },

    async vibrateMove() {
        if (!isEnabled()) return;
        console.log("[HAPTICS] Vibration LEGERE (Deplacement)");
        try {
            if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
                await window.Capacitor.Plugins.Haptics.impact({ style: "LIGHT" });
            }
        } catch (e) {
        }
    },

    async vibrateDestroy() {
        if (!isEnabled()) return;
        console.log("[HAPTICS] Vibration FORTE (Destruction)");
        try {
            if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
                await window.Capacitor.Plugins.Haptics.impact({ style: "HEAVY" });
                await window.Capacitor.Plugins.Haptics.vibrate({ duration: 200 });
            }
        } catch (e) {
        }
    },

    async vibrateMatchFound() {
        if (!isEnabled()) return;
        console.log("[HAPTICS] Vibration SUCCES (Match trouve)");
        try {
            if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
                await window.Capacitor.Plugins.Haptics.notification({ type: "SUCCESS" });
                await window.Capacitor.Plugins.Haptics.vibrate({ duration: 200 });
            }
        } catch (e) {
        }
    }
};
