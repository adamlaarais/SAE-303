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
    const deptStats = {}; // Clé: "FR-XX" (ex: FR-69)

    data.forEach(borne => {
        const pdc = borne.nbre_pdc ? parseInt(borne.nbre_pdc) : 1;
        totalPdc += pdc;

        if (borne.puiss_max) {
            totalPuissance += parseFloat(borne.puiss_max);
            nbBornesAvecPuissance++;
        }

        // Aggrégation par département via code insee
        // Le code insee commune (ex: "69123") permet de déduire le département ("69")
        if (borne.code_insee_commune) {
            let codeDept = borne.code_insee_commune.toString().trim();

            // Gestion départements standards (01 à 95) et Corse (2A, 2B)
            // On prend les 2 premiers caractères
            if (codeDept.length >= 2) {
                codeDept = codeDept.substring(0, 2);
                // Si c'est un DOM (97), on pourrait avoir besoin de 3 chiffres, mais la carte semble être France métro
                // On garde la logique simple FR-XX pour l'instant
            }

            const deptKey = `FR-${codeDept}`;

            if (!deptStats[deptKey]) {
                // Initialisation si pas encore rencontré
                // On essaie de capturer le nom du département s'il est présent dans la donnée
                deptStats[deptKey] = {
                    count: 0,
                    name: borne.departement || `Département ${codeDept}`
                };
            }

            deptStats[deptKey].count += pdc;

            // Mise å jour du nom si on trouve une donnée plus propre (non vide)
            if (borne.departement && deptStats[deptKey].name.startsWith('Département')) {
                deptStats[deptKey].name = borne.departement;
            }
        }
    });

    // 2b. Top 5 Régions
    const sortedRegions = Object.values(deptStats).sort((a, b) => b.count - a.count).slice(0, 5);
    const topRegionsContainer = document.getElementById('regions-list');

    if (topRegionsContainer && sortedRegions.length > 0) {
        const maxCount = sortedRegions[0].count; // Pour le calcul du % de la barre

        topRegionsContainer.innerHTML = sortedRegions.map((region, index) => {
            const percentage = (region.count / maxCount) * 100;
            return `
                <div class="region-item" style="transition-delay: ${index * 100}ms">
                    <div class="region-info">
                        <span class="region-name">${region.name}</span>
                        <span class="region-count">${region.count.toLocaleString()}</span>
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Animation des barres au chargement (petit délai pour l'effet visuel)
        setTimeout(() => {
            const bars = document.querySelectorAll('.bar-fill');
            bars.forEach(bar => {
                // On force un reflow ou on utilise une classe si besoin, 
                // mais ici l'insertion HTML avec style="width: X%" pourrait déjà afficher la barre pleine.
                // Pour animer, il vaut mieux initialiser à 0 puis mettre la valeur.
                // On va refaire la logique d'animation :
                const targetWidth = bar.style.width;
                bar.style.width = '0%';
                requestAnimationFrame(() => {
                    bar.style.width = targetWidth;
                });
            });
        }, 100);
    }

    // 2c. Distribution de la Puissance
    const powerBuckets = {
        'low': { min: 0, max: 3.7, count: 0 },         // <= 3.7
        'medium-low': { min: 3.7, max: 7.4, count: 0 }, // > 3.7 - 7.4
        'medium-high': { min: 7.4, max: 22, count: 0 }, // > 7.4 - 22
        'high': { min: 22, max: 50, count: 0 },         // > 22 - 50
        'super': { min: 50, max: 9999, count: 0 }       // > 50
    };

    data.forEach(borne => {
        if (borne.puiss_max) {
            const p = parseFloat(borne.puiss_max);
            const count = borne.nbre_pdc ? parseInt(borne.nbre_pdc) : 1;

            if (p <= 3.7) powerBuckets['low'].count += count;
            else if (p <= 7.4) powerBuckets['medium-low'].count += count;
            else if (p <= 22) powerBuckets['medium-high'].count += count;
            else if (p <= 50) powerBuckets['high'].count += count;
            else powerBuckets['super'].count += count;
        }
    });

    // Génération des visualisations de batterie (HTML pur)
    const maxBars = 10; // Nombre max de barres VISUELLES

    Object.keys(powerBuckets).forEach(key => {
        const bucket = powerBuckets[key];
        const container = document.getElementById(`power-${key}`);
        if (container) {
            // Count display
            const countEl = container.querySelector('.power-count');
            if (countEl) countEl.textContent = bucket.count.toLocaleString();

            const visualEl = container.querySelector('.battery-visual');
            if (visualEl) {
                // Clear previous content
                visualEl.innerHTML = '';

                // Calculate ratios
                const maxCategoryCount = Math.max(...Object.values(powerBuckets).map(b => b.count));
                const ratio = bucket.count / maxCategoryCount;
                const numBars = Math.max(1, Math.round(ratio * maxBars));

                // Generate HTML bars
                for (let i = 0; i < numBars; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'battery-bar';
                    // Petite variation de délai pour l'effet "stack"
                    bar.style.animationDelay = `${i * 0.1}s`;
                    // Espace entre les barres géré par margin-top (flex-col-reverse)
                    bar.style.marginTop = '4px';
                    bar.style.height = '8%'; // Hauteur relative

                    visualEl.appendChild(bar);
                }
            }
        }
    });

    // Moyenne de puissance en kW
    const moyennePuissance = nbBornesAvecPuissance > 0 ? (totalPuissance / nbBornesAvecPuissance).toFixed(1) : 0;

    // Affichage des KPIs globaux
    const vertCard = document.querySelector('.vert.card .value');
    if (vertCard) vertCard.textContent = totalPdc.toLocaleString();

    const bleuCard = document.querySelector('.bleu.card .value');
    if (bleuCard) bleuCard.textContent = moyennePuissance + " kW";

    // 3. Gestion de la Carte Interactive
    const tooltip = document.getElementById('tooltip');

    // Sélectionner tous les éléments qui ont un ID commençant par FR-
    // Cela inclut les <g> et les <path> directs
    const mapElements = document.querySelectorAll('.france [id^="FR-"]');

    mapElements.forEach((element) => {
        element.addEventListener('mouseenter', (e) => {
            const id = element.id; // Ex: FR-69
            const deptData = deptStats[id];

            const regionName = deptData ? deptData.name : "Données indisponibles";
            const count = deptData ? deptData.count : 0;

            if (tooltip) {
                tooltip.innerHTML = `
                    <h3>${regionName}</h3>
                    <p>Bornes disponibles</p>
                    <span class="count">${count.toLocaleString()}</span>
                `;
                tooltip.style.display = 'block';
            }

            // Effet visuel : déplacer l'élément à la fin du conteneur pour qu'il soit au-dessus (z-index SVG)
            if (element.nextSibling) {
                element.parentNode.appendChild(element);
            }
        });

        element.addEventListener('mousemove', (e) => {
            if (tooltip) {
                // Positionner le tooltip près de la souris avec un léger décalage pour ne pas gêner
                tooltip.style.left = `${e.clientX + 15}px`;
                tooltip.style.top = `${e.clientY + 15}px`;
            }
        });

        element.addEventListener('mouseleave', () => {
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        });
    });
});
