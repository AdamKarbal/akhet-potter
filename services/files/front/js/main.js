import './pages/match-page/match-page.js'
import './pages/vsordi-page/vsordi-page.js'
import './pages/login-page/login-page.js'
import './components/social-component/social-component.js'
import './pages/request-page/request-component.js'
import './pages/home-page/home-page.js'
import { RequestService } from './services/RequestService.js'
import { socket } from "./socket.js";

function initGlobalNotifications() {
    socket.on("NEW_FRIEND_REQ", (data) => {
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

        toast.querySelector("#toast-accept").onclick = async () => {
            const success = await this.RequestService.handleDecision(data.from, "accept");

            if(success){
                if (success) {
                    toast.innerHTML = "Demande acceptée !";
                    setTimeout(() => toast.remove(), 2000);
                    /*
                    window.dispatchEvent(new CustomEvent('refresh-requests'));
                    */
                }
            }
        }


        toast.querySelector("#toast-deny").onclick = async () => {
            const success = await this.RequestService.handleDecision(data.from, "deny");

            if(success){
                if (success) {
                    toast.innerHTML = "Demande refusée.";
                    setTimeout(() => toast.remove(), 2000);
                    /*
                    window.dispatchEvent(new CustomEvent('refresh-requests'));
                    */
                }
            }
        }

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = '0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    });
}

initGlobalNotifications();

function updateView() {
    const app = document.getElementById('app');
    const hash = window.location.hash;

    if (hash === '#JCJ') {
        console.log("Mode JcJ activé");
        app.innerHTML = '';
        app.innerHTML = '<match-page></match-page>';

    }
    else if (hash === '#JCO') {
        console.log("Mode JcO activé");
        app.innerHTML = '';
        app.innerHTML = '<vsordi-page></vsordi-page>';

    }
    else if(hash === '#SOC'){
        console.log("Page sociale activée");
        app.innerHTML = '';
        app.innerHTML = '<social-component></social-component>';
    }
    else if (hash === '#LGN') {
        console.log("Page login activé");
        app.innerHTML = '';
        app.innerHTML = '<login-page></login-page>';
    }
    else if (hash === '#REQ') {
        console.log("Page demande d'amis activé");
        app.innerHTML = '';
        app.innerHTML = '<request-component></request-component>';
    }
    else {
        app.innerHTML = '';
        app.innerHTML = `
            <home-page></home-page>
        `;
    }
}

window.addEventListener('load', updateView);
window.addEventListener('hashchange', updateView);