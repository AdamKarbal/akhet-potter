import './pages/match-page/match-page.js'
import './pages/vsordi-page/vsordi-page.js'
import './pages/login-page/login-page.js'
import './components/social-component/social-component.js'
import './pages/request-page/request-component.js'
import './pages/home-page/home-page.js'
import { socket } from "./socket.js";
import {audioService} from "./services/AudioService.js";
import {WaitlistComponent} from "./components/waitlist-component/waitlist-component.js";
import {GameLoaderComponent} from "./components/gameloader-component/gameloader-component.js";

function initGlobalNotifications() {
    socket.on("NEW_FRIEND_REQ", (data) => {
        toast(data);
        console.log(`Invitation d'ami reçue de ${data.from}`);
    });


    socket.on("NEW_FRIENDLY_MATCH", (data) => {
        toast(data);
        console.log(`Invitation de match amical reçue de ${data.from}`);
    });

    socket.on("match-found", (matchInfo) => {
        socket.off("waiting-for-opponent");
        removeWaitlist();
        console.log("Match trouvé !", matchInfo);
        localStorage.setItem('matchMode', matchInfo.isFriendly ? 'friendly' : 'ranked');
        sessionStorage.setItem('matchInfo', JSON.stringify(matchInfo));
        window.location.hash = 'JCJ';
    });

    socket.on("friendly-match-found", (matchInfo) => {
        console.log("Match amical créé !", matchInfo);
        const gameloader = document.createElement('game-loader');
        document.body.appendChild(gameloader);
        gameloader.addEventListener('loader-finished', () => {
            localStorage.setItem('matchMode', matchInfo.isFriendly ? 'friendly' : 'ranked');
            sessionStorage.setItem('matchInfo', JSON.stringify(matchInfo));
            window.location.hash = 'JCJ';
        });
    });

    socket.on("waiting-for-opponent", () => {
        const waitlistPopup = document.createElement('waitlist-component');
        waitlistPopup.addEventListener('cancel-search', () => {
            socket.emit("queue-out");
            console.log("Recherche annulée par l'utilisateur");
        });
        document.body.appendChild(waitlistPopup);
    });
}

function removeWaitlist() {
    const waitlist = document.querySelector('waitlist-component');
    if (waitlist) {
        waitlist.remove();
    }
}

function warningToast(data) {
    const toast = document.createElement('div');
    toast.className = 'toast-warning-centered';

    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.7);
        background: #1a0f05;
        border: 3px double #c5a059;
        color: #fff8dc;
        padding: 30px;
        border-radius: 12px;
        z-index: 10002;
        font-family: 'Agency FB', sans-serif;
        box-shadow: 0 0 50px rgba(0,0,0,0.9), 0 0 20px rgba(197, 160, 89, 0.3);
        text-align: center;
        min-width: 300px;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    toast.innerHTML = `
        <div style="font-size: 2em; color: #d4af37; margin-bottom: 10px;">⚡</div>
        <div style="font-size: 1.4em; margin-bottom: 20px; letter-spacing: 1px;">
            ${data.message}
        </div>
        <button id="close-warning" style="
            background: #c5a059;
            color: #1a0f05;
            border: none;
            padding: 8px 25px;
            font-family: 'Agency FB', sans-serif;
            font-weight: bold;
            font-size: 1.1em;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.2s;
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

function toast(data){
    const toast = document.createElement('div');
    toast.className = 'toast';

    toast.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: #2a1a0a; border: 2px solid #ffd700;
            color: #ffd700; padding: 15px; border-radius: 8px;
            z-index: 10000; font-family: 'Agency FB', sans-serif;
            box-shadow: 0 0 15px rgba(0,0,0,0.5);
            animation: slideIn 0.5s ease-out;
        `;

    toast.style.opacity = '1';

    toast.innerHTML = `
            <div>${data.message}</div>
            <div style="display: flex; gap=1rem; justify-content: flex-end;">
                <button id="toast-accept" style="background: #27ae60; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Accepter</button>
                <button id="toast-deny" style="background: #c0392b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Refuser</button>
            </div>
        `;

    document.body.appendChild(toast);
    toast.querySelector("#toast-accept").onclick = async (e) => {
        e.target.disabled = true;
        toast.innerHTML = "Demande acceptée ! Connexion à la partie...";
        socket.emit("join-friendly", {from: data.from});
        setTimeout(() => toast.remove(), 4000);
    }

    toast.querySelector("#toast-deny").onclick = async () => {
        toast.innerHTML = "Demande refusée.";
        setTimeout(() => toast.remove(), 2000);
    }

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = '0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 60000);
}

initGlobalNotifications();

function updateView() {
    const app = document.getElementById('app');
    const hash = window.location.hash;

    if (hash === '#JCJ') {
        console.log("Mode JcJ activé");
        audioService.stopMainTheme();
        audioService.playInGameTheme();
        app.innerHTML = '';
        app.innerHTML = '<match-page></match-page>';

    }
    else if (hash === '#JCO') {
        audioService.stopMainTheme();
        audioService.playInGameTheme();
        console.log("Mode JcO activé");
        app.innerHTML = '';
        app.innerHTML = '<vsordi-page></vsordi-page>';

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
    else {
        audioService.stopInGameTheme();
        audioService.playMainTheme();
        app.innerHTML = '';
        app.innerHTML = `
            <home-page></home-page>
        `;
    }
}

window.addEventListener('load', updateView);
window.addEventListener('hashchange', updateView);