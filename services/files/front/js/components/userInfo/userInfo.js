export class PlayerInfo extends HTMLElement {

    constructor(){
        super();
    }

    connectedCallback(){
        // language=HTML
        this.innerHTML = `
            <style>
                .player-info{
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 1vw;
                }
                
                .userImg{
                  width: fit-content;
                }
                
                .userImg > img{
                    width: 45px;
                    height: auto;
                }
                
                .userName{
                    font-family: "Agency FB";
                    color: #c5a059;
                    font-size: 1.2em;
                    background: linear-gradient(
                            to bottom,
                            #FFF8DC 0%,
                            #FFD700  50%,
                            #8B4513 100%
                    );
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
                }
                
            </style>
            <div class="player-info">
                <div class="userImg"><img src="assets/goodplayer.png"></div>
                <div class="userName">Guest122459978</div>
            </div>
    `;
    }

    setPlayerInfo(data){
        this.querySelector('.userName').innerHTML = data.username;
    }
}

customElements.define('player-info', PlayerInfo);

