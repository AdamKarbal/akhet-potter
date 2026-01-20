import './pages/match-page/match-page.js'
function updateView() {
    const app = document.getElementById('app');
    const hash = window.location.hash;

    if (hash === '#game') {
        console.log("Mode Jeu activé");
        app.innerHTML = '<match-page></match-page>';
    } else {
        console.log("Accueil");
        // language=HTML
        app.innerHTML = `
            <div class="homescreen">
                <h1>Bienvenue sur Akhet Potter</h1>
                <button id="btn-start">Jouer</button>
            </div>
        `;

        const btn = document.getElementById('btn-start');
        if(btn){
            btn.addEventListener('click', () => {
                window.location.hash = 'game';
            });
        }
    }
}

window.addEventListener('load', updateView);
window.addEventListener('hashchange', updateView);