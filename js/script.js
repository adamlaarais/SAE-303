window.addEventListener('load', async () => {
    // 1. Loader
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('loader-hidden');
            setTimeout(() => { loader.style.display = 'none'; }, 800);
        }, 2500);
    }

    // 2. Récupération des données
    const response = await fetch('js/bornes-irve.json');
    const data = await response.json();

    let totalPdc = 0;
    let totalPuissance = 0;
    let nbBornesAvecPuissance = 0;

    data.forEach(borne => {
        totalPdc += borne.nbre_pdc ? parseInt(borne.nbre_pdc) : 1;

        if (borne.puiss_max) {
            totalPuissance += parseFloat(borne.puiss_max);
            nbBornesAvecPuissance++;
        }
    });

    // Moyenne de puissance en kW
    const moyennePuissance = nbBornesAvecPuissance > 0 ? (totalPuissance / nbBornesAvecPuissance).toFixed(1) : 0;

    // Affichage direct sans animation
    document.querySelector('.vert.card .value').textContent = totalPdc.toLocaleString();
    document.querySelector('.bleu.card .value').textContent = moyennePuissance + " kW";
});
