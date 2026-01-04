const cursor = document.createElement('div');
cursor.classList.add('custom-cursor');
document.body.appendChild(cursor);

const cursorDot = document.createElement('div');
cursorDot.classList.add('custom-cursor-dot');
document.body.appendChild(cursorDot);

// Mouvement du curseur
document.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    cursor.style.left = `${posX}px`;
    cursor.style.top = `${posY}px`;
    cursor.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

// Liste des sélecteurs interactifs (incluant les éléments dynamiques)
const hoverSelectors = [
    '.france path',
    '.hex-item',
    '.battery-visual',   // Charts Power
    '.orbit-node',       // Experience System (Planets)
    '.branch-node',      // Plug Network (Hexagons)
    '.kpi-card',         // KPI Updates
    '.network-core',     // Center of plug network
    '.scroll-icon'
].join(', ');

// Gestion centralisée du Hover via délégation (plus performant et gère le dynamique)
document.body.addEventListener('mouseover', (e) => {
    // On vérifie si l'élément survolé (ou un de ses parents) est interactif
    const target = e.target.closest(hoverSelectors);

    if (target) {
        cursor.classList.add('hover');
        cursorDot.style.backgroundColor = 'var(--blanc)';
        cursorDot.style.boxShadow = '0 0 15px var(--blanc)';
    } else {
        cursor.classList.remove('hover');
        cursorDot.style.backgroundColor = 'var(--vert)';
        cursorDot.style.boxShadow = '0 0 10px var(--vert)';
    }
});

