import './pages/match-page/match-page.js'
import './pages/vsordi-page/vsordi-page.js'
function updateView() {
    const app = document.getElementById('app');
    const hash = window.location.hash;

    if (hash === '#JCJ') {
        console.log("Mode JcJ activé");
        app.innerHTML = '<match-page></match-page>';

    }
    else if (hash === '#JCO') {
        console.log("Mode JcO activé");
        app.innerHTML = '<vsordi-page></vsordi-page>';

    } else {
        console.log("Accueil");
        // language=HTML
        app.innerHTML = `
            <div class="homescreen">
                <h1>Bienvenue sur Akhet Potter</h1>
                <button id="btn-JcJ">Jouer JcJ</button>
                <button id="btn-JcO">Jouer JcO</button>
            </div>
        `;

        const btnJcJ = document.getElementById('btn-JcJ');
        const btnJcO = document.getElementById('btn-JcO');
        if(btnJcJ){
            btnJcJ.addEventListener('click', () => {
                window.location.hash = 'JCJ';
            });
        }
        if(btnJcO){
            btnJcO.addEventListener('click', () => {
                window.location.hash = 'JCO';
            });
        }
    }
}

window.addEventListener('load', updateView);
window.addEventListener('hashchange', updateView);