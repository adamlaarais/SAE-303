(async () => {

    // Récupération des données
    const response = await fetch('js/bornes-irve.json');
    const data = await response.json();

    let totalPdc = 0;
    let totalPuissance = 0;
    let nbBornesAvecPuissance = 0;
    const deptStats = {}; // Clé: "FR-XX" (ex: FR-69)

    let count24h = 0;
    let countPayant = 0;
    let countPMR = 0;

    data.forEach(borne => {
        const pdc = borne.nbre_pdc ? parseInt(borne.nbre_pdc) : 1;
        totalPdc += pdc;

        if (borne.puiss_max) {
            totalPuissance += parseFloat(borne.puiss_max);
            nbBornesAvecPuissance++;
        }

        // Stats Experience Utilisateur (Solar System)
        if (borne.accessibilite && borne.accessibilite.toLowerCase().includes('24')) {
            count24h += pdc;
        }

        if (borne.acces_recharge && borne.acces_recharge.toLowerCase().includes('payant')) {
            countPayant += pdc;
        }

        // PMR detection: Check 'accessibilite' AND 'observations'
        // Many PMR notes are hidden in observations
        if ((borne.accessibilite && borne.accessibilite.toLowerCase().includes('pmr')) ||
            (borne.observations && (borne.observations.toLowerCase().includes('pmr') || borne.observations.toLowerCase().includes('handicap')))) {
            countPMR += pdc;
        }

        // Aggrégation par département via code insee
        // Le code insee commune (ex: "69123") permet de déduire le département ("69")
        if (borne.code_insee_commune) {
            let codeDept = borne.code_insee_commune.toString().trim();

            // Gestion départements standards (01 à 95) et Corse (2A, 2B)
            // On prend les 2 premiers caractères
            if (codeDept.length >= 2) {
                codeDept = codeDept.substring(0, 2);
            }

            const deptKey = `FR-${codeDept}`;

            if (!deptStats[deptKey]) {
                // Initialisation si pas encore rencontré
                deptStats[deptKey] = {
                    count: 0,
                    name: borne.departement || `Département ${codeDept}`
                };
            }

            deptStats[deptKey].count += pdc;

            // Mise à jour du nom si on trouve une donnée plus propre
            if (borne.departement && deptStats[deptKey].name.startsWith('Département')) {
                deptStats[deptKey].name = borne.departement;
            }
        }
    });

    // Top 5 Régions
    const sortedRegions = Object.entries(deptStats)
        .map(([code, data]) => ({ ...data, code }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    const topRegionsContainer = document.getElementById('regions-list');

    if (topRegionsContainer && sortedRegions.length > 0) {
        const maxCount = sortedRegions[0].count; // Pour le calcul du % de la barre

        topRegionsContainer.innerHTML = sortedRegions.map((region, index) => {
            const percentage = (region.count / maxCount) * 100;
            return `
                <div class="region-item" data-code="${region.code}">
                    <div class="region-info">
                        <span class="region-name">${region.name}</span>
                        <span class="region-count">${region.count.toLocaleString()}</span>
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill" data-width="${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Add Hover Sync
        const regionItems = topRegionsContainer.querySelectorAll('.region-item');
        regionItems.forEach(item => {
            const code = item.getAttribute('data-code');
            const mapRegion = document.getElementById(code);

            if (mapRegion) {
                item.addEventListener('mouseenter', () => {
                    // Remove active class from all first (safety)
                    document.querySelectorAll('.france svg .active-region').forEach(p => p.classList.remove('active-region'));

                    // Add to specific
                    mapRegion.classList.add('active-region');


                });

                item.addEventListener('mouseleave', () => {
                    document.querySelectorAll('.france svg .active-region').forEach(p => p.classList.remove('active-region'));
                });
            }
        });


    }

    // Distribution de la Puissance
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
    const moyennePuissance = nbBornesAvecPuissance > 0 ? (totalPuissance / nbBornesAvecPuissance).toFixed(1).replace('.', ',') : 0;

    // --- Update Experience Stats (Solar System) ---
    const pct24h = totalPdc > 0 ? ((count24h / totalPdc) * 100).toFixed(0) : 0;
    const pctPayant = totalPdc > 0 ? ((countPayant / totalPdc) * 100).toFixed(0) : 0;
    const pctPMR = totalPdc > 0 ? ((countPMR / totalPdc) * 100).toFixed(2) : 0;

    const statDispo = document.getElementById('stat-dispo');
    if (statDispo) statDispo.textContent = pct24h + "%";

    const statPayant = document.getElementById('stat-payant');
    if (statPayant) statPayant.textContent = pctPayant + "%";

    const statPMR = document.getElementById('stat-pmr');
    if (statPMR) statPMR.textContent = pctPMR + "%";

    // Affichage des KPIs globaux
    const vertCard = document.querySelector('.vert.card .value');
    if (vertCard) vertCard.textContent = totalPdc.toLocaleString();

    const bleuCard = document.querySelector('.bleu.card .value');
    if (bleuCard) bleuCard.textContent = moyennePuissance + " kW";

    //  Gestion de la Carte Interactive
    const tooltip = document.getElementById('tooltip');

    // Sélectionner tous les éléments qui ont un ID commençant par FR-
    // Cela inclut les <g> et les <path> directs
    const mapElements = document.querySelectorAll('.france [id^="FR-"]');

    mapElements.forEach((element) => {
        element.addEventListener('mouseenter', (e) => {
            const id = element.id; // Ex: FR-69
            const deptData = deptStats[id];

            let regionName = deptData ? deptData.name : "Données indisponibles";
            const count = deptData ? deptData.count : 0;

            // Manual override for missing data regions
            if (id === 'FR-55' && !deptData) {
                regionName = 'La Meuse';
            }

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
                tooltip.style.left = `${e.clientX}px`;
                tooltip.style.top = `${e.clientY - 40}px`;
            }
        });

        element.addEventListener('mouseleave', () => {
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        });
    });


    // --- Data Aggregation (Shared for KPIs & Timeline) ---
    const majByYear = {};

    data.forEach(borne => {
        if (borne.date_maj) {
            // Format attendu: YYYY-MM-DD
            const year = borne.date_maj.split('-')[0];
            if (year && !isNaN(year)) {
                // Count records instead of PDCs for accurate update statistics
                majByYear[year] = (majByYear[year] || 0) + 1;
            }
        }
    });

    const sortedYears = Object.keys(majByYear).sort();
    const recentYears = sortedYears.slice(-5);


    // --- KPIs Mise à jour (Dynamic Calculation) ---

    // Plug Types Aggregation (New Logic)
    const plugTypes = {};

    data.forEach(borne => {
        // ... existing aggregation ... (I need to be careful not to delete existing loop content if I use replace. Better to insert counting logic IN the existing loop or create a new loop if performance allows. Data size is ~50k lines, one loop is better. But editing the loop reliably with replace is hard if I don't see counting lines.)
        // Let's create a NEW small loop for plug types to avoid breaking the regex matching of the big loop.
        // It's client side, iterating 50k items twice is fast enough (ms).

        if (borne.type_prise) {
            // Rough normalization
            // Split by common separators: +, /, -, comma, or " et "
            const rawTypes = borne.type_prise.split(/[\+\/,\-]|\s+et\s+/);
            const uniqueTypes = new Set();

            rawTypes.forEach(t => {
                let type = t.trim().toUpperCase();
                // Simple normalization map
                if (type.includes('T2') || type.includes('TYPE 2')) type = 'TYPE 2';
                else if (type.includes('E/F') || type.includes('DOMESTIQUE') || type.includes('EF')) type = 'DOMESTIQUE (E/F)';
                else if (type.includes('T3')) type = 'TYPE 3';
                else if (type.includes('CHADEMO')) type = 'CHADEMO';
                else if (type.includes('COMBO') || type.includes('CCS')) type = 'COMBO CCS';

                if (type.length > 2) { // Filter noise
                    uniqueTypes.add(type);
                }
            });

            if (uniqueTypes.size > 0) {
                const pdcCount = borne.nbre_pdc ? parseInt(borne.nbre_pdc) : 1;
                const countPerType = pdcCount / uniqueTypes.size; // Distribute count evenly

                uniqueTypes.forEach(type => {
                    plugTypes[type] = (plugTypes[type] || 0) + countPerType;
                });
            }
        }
    });

    const sortedPlugs = Object.entries(plugTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6); // Top 6

    const totalPlugsCount = sortedPlugs.reduce((acc, [_, count]) => acc + count, 0);

    // Render Plug Types Network
    const networkContainer = document.querySelector('.plug-types-network');
    if (networkContainer && sortedPlugs.length > 0) {

        // Create SVG container for lines if not exists
        let svgContainer = networkContainer.querySelector('.network-lines-svg');
        if (!svgContainer) {
            svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgContainer.classList.add('network-lines-svg');
            svgContainer.setAttribute('viewBox', '0 0 480 480');
            networkContainer.insertBefore(svgContainer, networkContainer.firstChild);
        }

        // Clear previous content to avoid dupes/gradient issues
        svgContainer.innerHTML = '';

        const centerX = 240;
        const centerY = 240;
        const radius = 170; // Slightly tighter radius for hexes
        const angleStep = (2 * Math.PI) / sortedPlugs.length;

        sortedPlugs.forEach((item, index) => {
            const [name, count] = item;
            const percentage = totalPlugsCount > 0 ? ((count / totalPlugsCount) * 100).toFixed(1) : 0;

            // Calculate Position
            const angle = index * angleStep - (Math.PI / 2);
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            // Create Node
            const node = document.createElement('div');
            node.classList.add('branch-node');
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
            node.style.animationDelay = `${index * 0.1}s`;

            // Hexagon specific HTML content (Timeline Style Structure)
            node.innerHTML = `
                <div class="hex-border"></div> <!-- Gradient Border -->
                <div class="hex-content">
                    <span class="plug-name">${name}</span>
                    <span class="node-percentage">${percentage}%</span>

                </div>
            `;
            networkContainer.appendChild(node);

            // Create Line
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute('x1', centerX);
            line.setAttribute('y1', centerY);
            line.setAttribute('x2', x);
            line.setAttribute('y2', y);
            line.classList.add('connection-line');
            line.style.stroke = "rgba(0, 207, 255, 0.5)"; // Solid Cyan with transparency

            // Animation handled by CSS class .network-visible via js/anim.js
            // line.animate() removed to respect scroll trigger

            svgContainer.appendChild(line);
        });
    }

    const kpiPeriodes = document.getElementById('kpi-periodes');
    const kpiTotal = document.getElementById('kpi-total');
    const kpiMoyenne = document.getElementById('kpi-moyenne');

    // Calculs réels basés sur les données chargées
    const totalUpdates = sortedYears.reduce((sum, year) => sum + majByYear[year], 0);
    const numberOfYears = sortedYears.length;
    const averageUpdates = numberOfYears > 0 ? Math.round(totalUpdates / numberOfYears) : 0;

    // Affichage direct (sans animation)
    if (kpiPeriodes) kpiPeriodes.textContent = numberOfYears.toLocaleString();
    if (kpiTotal) kpiTotal.textContent = totalUpdates.toLocaleString();
    if (kpiMoyenne) kpiMoyenne.textContent = averageUpdates.toLocaleString();

    // --- Timeline Hexagon Generator (Dynamic from JSON) ---
    const timelineContainer = document.getElementById('hex-timeline');

    if (timelineContainer) {
        // Data aggregation moved to lower scope

        // 3. Génération HTML
        timelineContainer.innerHTML = ''; // Clear static/loading content

        recentYears.forEach((year, index) => {
            const count = majByYear[year];
            const label = "Mise à jour"; // Static label requested by user
            // Création de l'élément Hexagone
            const hexItem = document.createElement('div');
            hexItem.classList.add('hex-item');
            hexItem.style.animationDelay = `${(index + 1) * 0.2}s`; // Stagger animation

            hexItem.innerHTML = `
                <div class="hex-border">
                    <div class="hex-content">
                        <span class="hex-date">${year}</span>
                        <span class="hex-data">+${count}<br><span class="hex-label">${label}</span></span>
                    </div>
                </div>
            `;

            timelineContainer.appendChild(hexItem);

            // Ajout du connecteur (sauf après le dernier élément)
            if (index < recentYears.length - 1) {
                const connector = document.createElement('div');
                connector.classList.add('hex-connector');
                timelineContainer.appendChild(connector);
            }
        });
    }

    // --- End of Data Processing ---
    console.log("Dashboard Loaded");
    window.dispatchEvent(new Event('dashboardReady'));

})();
