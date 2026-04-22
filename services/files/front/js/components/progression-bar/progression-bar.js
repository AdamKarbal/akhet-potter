export class RankProgressBar extends HTMLElement {
    constructor() {
        super();
        this.RANK_MAPPER = {
            "Non classé" : 'assets/webp/unranked.webp',
            "1ère année" : 'assets/annee1.webp',
            "2ème année" : 'assets/annee2.webp',
            "3ème année" : 'assets/annee3.webp',
            "4ème année" : 'assets/annee4.webp',
            "5ème année" : 'assets/annee5.webp',
            "6ème année" : 'assets/annee6.webp',
            "7ème année" : 'assets/annee7.webp'
        };
        this.RANK_ORDER = ["1ère année", "2ème année", "3ème année", "4ème année", "5ème année", "6ème année", "7ème année"];
        this.unkProg = 'assets/webp/unknownprog.webp';
    }

    async connectedCallback() {
        const htmlUrl = new URL('./progression-bar.html', import.meta.url);
        const cssUrl = new URL('./progression-bar.css', import.meta.url);

        try {
            const [htmlRes, cssRes] = await Promise.all([
                fetch(htmlUrl),
                fetch(cssUrl)
            ]);

            const html = await htmlRes.text();
            const css = await cssRes.text();

            this.innerHTML = `
                <style>${css}</style>
                ${html}
            `;

            if (this._pendingData) {
                this.updateProgress(this._pendingData.rank, this._pendingData.elo);
                this._pendingData = null;
            }
        } catch (error) {
            console.error("Erreur chargement RankProgressBar resources:", error);
        }
    }

    updateProgress(rank, elo) {
        const fill = this.querySelector('.progress-fill');
        if (!fill) {
            this._pendingData = { rank, elo };
            return;
        }

        const currentImg = rank ? this.RANK_MAPPER[rank] : this.RANK_MAPPER["Non classé"];
        const progressPercent = elo ? ((elo % 1000) / 1000) * 100 : 0;

        const nextRankIndex = this.RANK_ORDER.indexOf(rank) + 1;
        let nextRankImg = this.unkProg;

        if (rank && nextRankIndex < this.RANK_ORDER.length) {
            nextRankImg = this.RANK_MAPPER[this.RANK_ORDER[nextRankIndex]];
        }

        fill.style.width = `${progressPercent}%`;
        this.querySelector('.current-rank-img').src = currentImg;
        this.querySelector('.next-rank-img').src = nextRankImg;
    }
}

customElements.define('progression-bar', RankProgressBar);