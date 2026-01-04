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

    // Effet Hover sur les éléments interactifs
    const interactiveElements = document.querySelectorAll('a, button, .card, .france path, .hex-item, input, textarea');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            cursorDot.style.backgroundColor = 'var(--blanc)';
            cursorDot.style.boxShadow = '0 0 15px var(--blanc)';
        });

        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            cursorDot.style.backgroundColor = 'var(--vert)';
            cursorDot.style.boxShadow = '0 0 10px var(--vert)';
        });
    });

    // Gérer aussi les éléments ajoutés dynamiquement si nécessaire (MutationObserver) ou on rebind au survol global
    // Approche déléguation pour être sûr de tout choper (plus robuste)
    document.body.addEventListener('mouseover', (e) => {
        if (e.target.matches('a, button, .card, .france path, .hex-item, input, textarea') || e.target.closest('a, button, .card, .france path, .hex-item')) {
            cursor.classList.add('hover');
            cursorDot.style.backgroundColor = 'var(--blanc)';
            cursorDot.style.boxShadow = '0 0 15px var(--blanc)';
        } else {
            cursor.classList.remove('hover');
            cursorDot.style.backgroundColor = 'var(--vert)';
            cursorDot.style.boxShadow = '0 0 10px var(--vert)';
        }
    });

