import './pages/match-page/match-page.js'
import './pages/vsordi-page/vsordi-page.js'
import './pages/login-page/login-page.js'
import './components/social-component/social-component.js'
import './pages/request-page/request-component.js'
import './pages/home-page/home-page.js'
import './pages/help-page/help-page.js'
import './pages/settings-page/settings-page.js'
import { connectSocket, disconnectSocket, socket } from "./socket.js";
import {audioService} from "./services/AudioService.js";
import {WaitlistComponent} from "./components/waitlist-component/waitlist-component.js";
import './components/gameloader-component/gameloader-component.js'
import {RequestService} from "./services/RequestService.js";
import { AuthService } from "./services/AuthService.js";
import './pages/achievement-page/achievement-page.js';
import './pages/profile-page/profile-page.js'
import './pages/mobile-settings-help-page/mobile-settings-help-page.js';
import { HapticsService } from "./services/HapticsService.js";
import { API_URL } from "../config.js";
import { NotificationService } from './services/NotificationService.js';

const configureAndroidStyles = async () => {
    try {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getInfo();
        if (info.platform === 'android') {
            document.body.classList.add('is-android');
        }
    } catch (error) {
        console.warn("Mode Web détecté.");
        if (window.innerWidth < 768) {
            document.body.classList.add('is-android');
        }
    }
};

async function lockOrientation() {
    const isMobile = window.Capacitor && window.Capacitor.getPlatform() !== 'web';

    if (isMobile) {
        try {
            if (window.Capacitor.Plugins.ScreenOrientation) {
                await window.Capacitor.Plugins.ScreenOrientation.lock({ type: 'portrait' });
                console.log("Orientation bloquée en mode portrait.");
            }
        } catch (e) {
            console.warn("ScreenOrientation plugin non disponible", e);
        }
    }
}

function initGlobalNotifications() {
    socket.on("NEW_FRIEND_REQ", (data) => {
        markFriendRequestToastSeen(data.from);
        toast(data, "NEW_FRIEND_REQ");
        console.log(`Invitation d'ami reçue de ${data.from}`);
        NotificationService.send(
            "🤝 Nouvelle demande d'ami",
            `${data.from} souhaite devenir votre allié !`
        );
    });


    socket.on("NEW_FRIENDLY_MATCH", (data) => {
        toast(data, "NEW_FRIENDLY_MATCH");
        console.log(`Invitation de match amical reçue de ${data.from}`);
        NotificationService.send(
            "⚡ Défi en duel !",
            `${data.from} vous invite pour un match amical !`
        );
    });

    socket.on("match-found", (matchInfo) => {
        removeWaitlist();
        console.log("Match trouvé !", matchInfo);
        HapticsService.vibrateMatchFound();
        localStorage.setItem('matchMode', matchInfo.isFriendly ? 'friendly' : 'ranked');
        sessionStorage.setItem('matchInfo', JSON.stringify(matchInfo));
        window.location.hash = 'JCJ';
    });

    socket.on("friendly-match-found", (matchInfo) => {
        console.log("Match amical créé !", matchInfo);
        HapticsService.vibrateMatchFound();
        const gameloader = document.createElement('game-loader');
        document.body.appendChild(gameloader);
        gameloader.addEventListener('loader-finished', () => {
            localStorage.setItem('matchMode', matchInfo.isFriendly ? 'friendly' : 'ranked');
            sessionStorage.setItem('matchInfo', JSON.stringify(matchInfo));
            window.location.hash = 'JCJ';
        });
    });

    socket.on("waiting-for-opponent", () => {
        // Prevent adding multiple waitlist popups if one already exists
        if (!document.querySelector('waitlist-component')) {
            const waitlistPopup = document.createElement('waitlist-component');
            waitlistPopup.addEventListener('cancel-search', () => {
                socket.emit("queue-out");
                console.log("Recherche annulée par l'utilisateur");
            });
            document.body.appendChild(waitlistPopup);
        }
    });
}

function removeWaitlist() {
    const waitlist = document.querySelector('waitlist-component');
    if (waitlist) {
        waitlist.remove();
    }
}

function getSeenFriendRequestSendersKey() {
    const username = localStorage.getItem('username') || 'anonymous';
    return `seenFriendReqToasts:${username}`;
}

function getSeenFriendRequestSenders() {
    try {
        return new Set(JSON.parse(localStorage.getItem(getSeenFriendRequestSendersKey()) || '[]'));
    } catch (_) {
        return new Set();
    }
}

function setSeenFriendRequestSenders(seen) {
    localStorage.setItem(getSeenFriendRequestSendersKey(), JSON.stringify([...seen]));
}

function markFriendRequestToastSeen(sender) {
    if (!sender) return;
    const seen = getSeenFriendRequestSenders();
    seen.add(sender);
    setSeenFriendRequestSenders(seen);
}

function warningToast(data) {
    const toast = document.createElement('div');
    toast.className = 'toast-warning-centered';
    const isMobile = document.body.classList.contains('is-android');

    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.7);
        background: #1a0f05;
        border: 3px double #c5a059;
        color: #fff8dc;
        padding: ${isMobile ? '20px 18px' : '30px'};
        border-radius: 12px;
        z-index: 10002;
        font-family: 'Agency FB', sans-serif;
        box-shadow: 0 0 50px rgba(0,0,0,0.9), 0 0 20px rgba(197, 160, 89, 0.3);
        text-align: center;
        ${isMobile ? 'width: 80vw; box-sizing: border-box;' : 'min-width: 300px;'}
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    toast.innerHTML = `
        <div style="font-size: ${isMobile ? '1.4em' : '2em'}; color: #d4af37; margin-bottom: 10px;">⚡</div>
        <div style="font-size: ${isMobile ? '0.95em' : '1.4em'}; margin-bottom: ${isMobile ? '16px' : '20px'}; letter-spacing: 1px; line-height: 1.4;">
            ${data.message}
        </div>
        <button id="close-warning" style="
            background: linear-gradient(135deg, #6b4c1e, #3d2a0e);
            color: #ffd700;
            border: 1px solid #c5a059;
            padding: ${isMobile ? '8px 20px' : '8px 25px'};
            font-family: 'Agency FB', sans-serif;
            font-weight: bold;
            font-size: ${isMobile ? '0.95em' : '1.1em'};
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.2s;
            letter-spacing: 1px;
        ">COMPRIS</button>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    const closeBtn = toast.querySelector("#close-warning");

    closeBtn.onmouseover = () => closeBtn.style.transform = 'scale(1.1)';
    closeBtn.onmouseout = () => closeBtn.style.transform = 'scale(1)';

    closeBtn.onclick = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => toast.remove(), 300);
    };

    setTimeout(() => {
        if (toast.parentNode) closeBtn.onclick();
    }, 8000);
}

socket.on("invitation-expired", (data) => {
    warningToast(data);
});

function toast(data, event) {
    const toastEl = document.createElement('div');
    toastEl.className = 'toast';
    const isMobile = document.body.classList.contains('is-android');

    toastEl.style.cssText = isMobile ? `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1a0f05;
        border: 2px solid #c5a059;
        color: #fff8dc;
        padding: 14px 16px;
        border-radius: 12px;
        z-index: 10000;
        font-family: 'Agency FB', sans-serif;
        box-shadow: 0 0 20px rgba(197, 160, 89, 0.5);
        width: 82vw;
        box-sizing: border-box;
        animation: slideDown 0.4s ease-out;
    ` : `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2a1a0a;
        border: 2px solid #ffd700;
        color: #ffd700;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        font-family: 'Agency FB', sans-serif;
        box-shadow: 0 0 15px rgba(0,0,0,0.5);
        animation: slideIn 0.5s ease-out;
    `;

    toastEl.style.opacity = '1';

    toastEl.innerHTML = `
        <div style="font-size: ${isMobile ? '0.95em' : '1em'}; margin-bottom: 10px; line-height: 1.4;">${data.message}</div>
        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; gap: ${isMobile ? '10px' : '8px'}; margin-top: ${isMobile ? '10px' : '8px'}">
            <button id="toast-accept" style="
                background: linear-gradient(135deg, #6b4c1e, #3d2a0e);
                color: #ffd700;
                border: 1px solid #c5a059;
                padding: ${isMobile ? '8px 18px' : '5px 10px'};
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Agency FB', sans-serif;
                font-size: ${isMobile ? '0.9em' : '0.85em'};
                font-weight: bold;
                letter-spacing: 1px;
                transition: all 0.2s;
            ">Accepter</button>
            <button id="toast-deny" style="
                background: rgba(80, 60, 40, 0.4);
                color: #a08060;
                border: 1px solid #5a3e28;
                padding: ${isMobile ? '8px 18px' : '5px 10px'};
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Agency FB', sans-serif;
                font-size: ${isMobile ? '0.9em' : '0.85em'};
                font-weight: bold;
                letter-spacing: 1px;
                transition: all 0.2s;
            ">Refuser</button>
        </div>
    `;

    document.body.appendChild(toastEl);

    toastEl.querySelector("#toast-accept").onclick = async (e) => {
        e.target.disabled = true;
        switch (event) {
            case 'NEW_FRIEND_REQ':
                const success = await RequestService.handleDecision(data.from, "accept");
                if (success) {
                    toastEl.innerHTML = `<div style="color:#d4af37;font-family:'Agency FB';padding:4px 0;">Demande acceptée !</div>`;
                    window.dispatchEvent(new Event('friendrequests-changed'));
                } else {
                    toastEl.innerHTML = `<div style="color:#c5a059;font-family:'Agency FB';">Erreur: impossible d'accepter</div>`;
                }
                break;
            case 'NEW_FRIENDLY_MATCH':
                socket.emit("join-friendly", { from: data.from });
                toastEl.innerHTML = `<div style="color:#d4af37;font-family:'Agency FB';padding:4px 0;">Connexion à la partie...</div>`;
                break;
        }
        setTimeout(() => toastEl.remove(), 4000);
    };

    toastEl.querySelector("#toast-deny").onclick = async (e) => {
        e.target.disabled = true;
        switch (event) {
            case 'NEW_FRIEND_REQ':
                const success = await RequestService.handleDecision(data.from, "deny");
                if (success) {
                    toastEl.innerHTML = `<div style="color:#a08060;font-family:'Agency FB';padding:4px 0;">Demande refusée.</div>`;
                    window.dispatchEvent(new Event('friendrequests-changed'));
                } else {
                    toastEl.innerHTML = `<div style="color:#c5a059;font-family:'Agency FB';">Erreur : impossible de refuser</div>`;
                }
                break;
            case 'NEW_FRIENDLY_MATCH':
                toastEl.innerHTML = `<div style="color:#a08060;font-family:'Agency FB';padding:4px 0;">Invitation refusée.</div>`;
                break;
            default:
                toastEl.innerHTML = `<div style="color:#a08060;font-family:'Agency FB';padding:4px 0;">Refus enregistré.</div>`;
        }
        setTimeout(() => toastEl.remove(), 2000);
    };

    const autoCloseDelay = event === 'NEW_FRIEND_REQ' ? 5000 : 60000;

    setTimeout(() => {
        toastEl.style.opacity = '0';
        toastEl.style.transition = '0.5s';
        setTimeout(() => toastEl.remove(), 500);
    }, autoCloseDelay);
}
initGlobalNotifications();

async function bootstrapRealtimeConnection() {
    const token = localStorage.getItem('token');

    if (!token) {
        disconnectSocket();
        return;
    }

    try {
        await connectSocket();
    } catch (error) {
        console.error("Impossible d'initialiser la socket temps réel :", error);
    }
}

async function replayPendingFriendRequestToasts() {
    const token = await AuthService.getValidToken();
    if (!token) return;

    try {
        const response = await fetch(API_URL + `/api/requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const requests = await response.json();
        const seen = getSeenFriendRequestSenders();
        const pendingSenders = new Set(
            requests.map((requestUser) => requestUser.username).filter(Boolean)
        );

        requests.forEach((requestUser) => {
            const sender = requestUser.username;
            if (!sender || seen.has(sender)) return;

            toast({
                from: sender,
                message: `Nouvelle demande d'ami de ${sender} !`
            }, "NEW_FRIEND_REQ");

            seen.add(sender);
        });

        const filteredSeen = new Set([...seen].filter((sender) => pendingSenders.has(sender)));
        setSeenFriendRequestSenders(filteredSeen);
    } catch (error) {
        console.error("Impossible de rejouer les demandes d'ami en attente :", error);
    }
}

function updateView() {
    const app = document.getElementById('app');
    const hash = window.location.hash;
    configureAndroidStyles();
    if (hash === '#JCJ') {
        console.log("Mode JcJ activé");
        audioService.stopMainTheme();
        audioService.playInGameTheme();
        app.innerHTML = '';
        app.innerHTML = '<match-page></match-page>';

    }
    else if ( hash === '#SUCCES') {
        app.innerHTML = '<achievement-page></achievement-page>';
    }
    else if (hash === '#JCO') {
        audioService.stopMainTheme();
        audioService.playInGameTheme();
        console.log("Mode JcO activé");
        app.innerHTML = '';
        app.innerHTML = '<vsordi-page></vsordi-page>';

    }

    else if (hash === '#HELP') {
        audioService.stopInGameTheme();
        audioService.playMainTheme();
        console.log("Page aide activée");
        app.innerHTML = '<help-page></help-page>';
    }

    else if (hash === '#SETTINGS') {
        audioService.stopInGameTheme();
        audioService.playMainTheme();
        app.innerHTML = '<settings-page></settings-page>';
    }

    else if(hash === '#SOC'){
        audioService.stopInGameTheme();
        audioService.playMainTheme();
        console.log("Page sociale activée");
        app.innerHTML = '';
        app.innerHTML = '<social-component></social-component>';
    }
    else if (hash === '#LGN') {
        audioService.stopInGameTheme();
        audioService.playMainTheme();
        console.log("Page login activé");
        app.innerHTML = '';
        app.innerHTML = '<login-page></login-page>';
    }
    else if (hash === '#REQ') {
        audioService.stopInGameTheme();
        audioService.playMainTheme();
        console.log("Page demande d'amis activé");
        app.innerHTML = '';
        app.innerHTML = '<request-component></request-component>';
    }
    else if (hash === '#MSHP') {
        audioService.stopInGameTheme();
        audioService.playMainTheme();
        console.log("Page mobile settings/help activé");
        app.innerHTML = '';
        app.innerHTML = '<mobile-settings-help-page></mobile-settings-help-page>';
    }
    else if (hash === '#PROF'){
        audioService.stopInGameTheme();
        audioService.playMainTheme();
        console.log("Page profil du joueur activée");
        app.innerHTML = '';
        app.innerHTML = '<profile-page></profile-page>';
    }
    else {
        audioService.stopInGameTheme();
        audioService.playMainTheme();
        app.innerHTML = '';
        app.innerHTML = `
            <home-page></home-page>
        `;
    }
}

async function handleSplashScreen() {
    const isMobile = window.Capacitor && window.Capacitor.getPlatform() !== 'web';

    if (isMobile) {
        try {
            await window.Capacitor.Plugins.SplashScreen.hide();
        } catch (e) {
            console.warn("SplashScreen plugin non disponible", e);
        }
        setTimeout(() => {
            const splash = document.getElementById('custom-splash');
            if (splash) {
                splash.style.opacity = '0';
                setTimeout(() => splash.remove(), 500);
            }
        }, 2500);

    } else {
        setTimeout(() => {
            const splash = document.getElementById('custom-splash');
            if (splash) {
                splash.style.opacity = '0';
                setTimeout(() => splash.remove(), 500);
            }
        }, 2000);
    }
}

window.addEventListener('load', async () => {
    await NotificationService.requestPermission();
    NotificationService.initListeners();
    await bootstrapRealtimeConnection();
    await replayPendingFriendRequestToasts();
    updateView();
    handleSplashScreen();
    lockOrientation();
});
window.addEventListener('hashchange', updateView);window.addEventListener('hashchange', updateView);
