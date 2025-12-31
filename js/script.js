window.addEventListener('load', async () => {
    // Loader
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('loader-hidden');
            setTimeout(() => { loader.style.display = 'none'; }, 800);
        }, 2500);
    }

    // Récupération des données
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

    // Top 5 Régions
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
    const moyennePuissance = nbBornesAvecPuissance > 0 ? (totalPuissance / nbBornesAvecPuissance).toFixed(1) : 0;

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

    // --- Graphique Mise à jour ---
    const ctxUpdates = document.getElementById('updatesChart');
    if (ctxUpdates) {
        // Injection des données dynamiques (KPIs)
        const kpiPeriodes = document.getElementById('kpi-periodes');
        const kpiTotal = document.getElementById('kpi-total');
        const kpiMoyenne = document.getElementById('kpi-moyenne');

        // Animation des compteurs (KPIs)
        const animateCountUp = (element, target, duration) => {
            let start = 0;
            const step = Math.ceil(target / (duration / 16));
            const timer = setInterval(() => {
                start += step;
                if (start >= target) {
                    element.textContent = target;
                    clearInterval(timer);
                } else {
                    element.textContent = start;
                }
            }, 16);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (kpiPeriodes) animateCountUp(kpiPeriodes, 5, 1000);
                    if (kpiTotal) animateCountUp(kpiTotal, 3790, 2000);
                    if (kpiMoyenne) animateCountUp(kpiMoyenne, 6378, 2000);
                    observer.disconnect(); // Run only once
                }
            });
        }, { threshold: 0.5 });

        if (kpiPeriodes) observer.observe(kpiPeriodes);
        // Plugin pour la ligne verticale personnalisée
        const verticalLinePlugin = {
            id: 'verticalLine',
            afterDraw: (chart) => {
                if (chart.tooltip?._active?.length) return; // Hide if tooltip is active (optional, but keep simple for now)

                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;

                // Index de 2018 (0: 2017, 1: 2018...)
                const indexToDraw = 1;
                const x = xAxis.getPixelForValue(2018); // Value on X axis

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, yAxis.top);
                ctx.lineTo(x, yAxis.bottom);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#00CFFF'; // Cyan color
                ctx.stroke();
                ctx.restore();

                // Point brillant au croisement
                const yPoint = chart.getDatasetMeta(0).data[indexToDraw].y;

                ctx.save();
                ctx.beginPath();
                ctx.arc(x, yPoint, 6, 0, 2 * Math.PI);
                ctx.fillStyle = '#A3FF00'; // Center Green
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#1A1A2E'; // Border dark
                ctx.stroke();
                ctx.restore();

                // Tooltip statique pour 2018
                // Draw custom box
                const text = "Nombre de stations : 1005";
                const label = "2018";

                ctx.save();
                // Position relative to point
                const boxX = x + 15;
                const boxY = yPoint - 40;
                const boxWidth = 180;
                const boxHeight = 50;
                const radius = 8;

                ctx.beginPath();
                ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
                ctx.fill();
                ctx.stroke();

                // Text
                ctx.fillStyle = '#B3B3B3';
                ctx.font = '12px Montserrat';
                ctx.fillText(label, boxX + 15, boxY + 20);

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 13px Montserrat';
                // highlight count
                ctx.fillText("Nombre de stations : ", boxX + 15, boxY + 40);

                const textWidth = ctx.measureText("Nombre de stations : ").width;
                ctx.fillStyle = '#00CFFF'; // Cyan highlight
                ctx.fillText("1005", boxX + 15 + textWidth, boxY + 40);

                ctx.restore();
            }
        };

        const gradient = ctxUpdates.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#A3FF00'); // Green top
        gradient.addColorStop(1, '#00CFFF00'); // Transparent Blue bottom

        // Line Gradient
        const strokeGradient = ctxUpdates.getContext('2d').createLinearGradient(0, 0, 400, 0);
        strokeGradient.addColorStop(0, '#A3FF00');
        strokeGradient.addColorStop(1, '#00CFFF'); // Green to Cyan

        new Chart(ctxUpdates, {
            type: 'line',
            data: {
                labels: ['2017', '2018', '2019', '2020', '2021'],
                datasets: [{
                    label: 'Mises à jour',
                    data: [200, 1005, 700, 2500, 3800],
                    // 1. Line: Linear Gradient & Glow
                    // 1. Line: Linear Gradient & Glow (Project Colors)
                    // 1. Line: Real Linear Gradient (Project Colors)
                    borderColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                        gradient.addColorStop(0, '#A3FF00'); // Var --vert (Start)
                        gradient.addColorStop(1, '#00CFFF'); // Var --bleu (End)
                        return gradient;
                    },
                    borderWidth: 5,
                    tension: 0.4,
                    // Glow Effect Removed per user request

                    // 2. Fill: Subtle Vertical Gradient
                    fill: true,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(163, 255, 0, 0.2)'); // Green opacity
                        gradient.addColorStop(1, 'rgba(0, 207, 255, 0)'); // Blue/Transparent
                        return gradient;
                    },

                    pointRadius: 0,
                    pointHitRadius: 30,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#A3FF00',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: 20
                },
                plugins: {
                    legend: { display: false },
                    // 4. Heavily Styled Native Tooltip
                    tooltip: {
                        enabled: true,
                        backgroundColor: '#1E1E2F', // Dark background
                        titleColor: '#fff',
                        bodyColor: '#B3B3B3', // gris
                        borderColor: '#A3FF00', // Neon Green border
                        borderWidth: 2,
                        cornerRadius: 12,
                        padding: 15,
                        displayColors: false,
                        titleFont: { family: 'Montserrat', size: 14, weight: 'bold' },
                        bodyFont: { family: 'Montserrat', size: 13 },
                        callbacks: {
                            title: (items) => `Année ${items[0].label}`,
                            label: (ctx) => `${ctx.parsed.y} Stations`
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#B3B3B3',
                            font: { family: 'Montserrat', size: 12 },
                            padding: 10
                        }
                    },
                    y: {
                        // 3. Horizontal Grid: Dotted & Transparent
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            borderDash: [5, 5],
                            drawBorder: false
                        },
                        ticks: {
                            display: true,
                            color: '#B3B3B3',
                            font: { family: 'Montserrat', size: 12 },
                            padding: 10
                        },
                        beginAtZero: true
                    }
                }
            },
            plugins: [verticalLinePlugin]
        });
    }
});
