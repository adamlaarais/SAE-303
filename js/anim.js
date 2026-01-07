const loader = document.getElementById('loader-wrapper');
if (loader) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('loader-hidden');
            setTimeout(() => {
                loader.style.display = 'none';
                // Enable scroll only after loader (optional, but good for UX)
                // document.body.style.overflow = 'auto'; 
                if (typeof animateHomeEntrance === 'function') animateHomeEntrance();
            }, 500); // Trigger slightly earlier for seamlessness
        }, 2200); // Shorter loader wait for better UX
    });
}

function animateHomeEntrance() {
    const title = document.querySelector('.accueil-content h1');
    const subtitle = document.querySelector('.accueil-content p');
    const cards = document.querySelectorAll('.data-container .card');
    const scrollIcon = document.querySelector('.scroll-icon');

    // Add delay classes dynamically (cleaner than hardcoding in HTML for JS control)
    if (title) title.classList.add('delay-100');
    if (subtitle) subtitle.classList.add('delay-200');
    if (scrollIcon) scrollIcon.classList.add('delay-800');

    if (cards.length > 0) {
        cards.forEach((card, index) => {
            const delay = 400 + (index * 200);
            card.style.transitionDelay = `${delay}ms`;
        });
    }

    // Trigger Visibility
    // Small timeout to Ensure CSS load and Layout paint
    setTimeout(() => {
        // Background Fade
        const accueilSection = document.getElementById('accueil');
        if (accueilSection) accueilSection.classList.add('bg-visible');

        if (title) title.classList.add('entrance-visible');
        if (subtitle) subtitle.classList.add('entrance-visible');
        if (scrollIcon) scrollIcon.classList.add('entrance-visible');

        cards.forEach(card => card.classList.add('entrance-visible'));

        // Start Numbers
        cards.forEach((card, index) => {
            const valueEl = card.querySelector('.value');
            // Sync with card appearance (faster sync)
            setTimeout(() => startNumberAnimation(valueEl), 400 + (index * 200));
        });

    }, 50);
}

function startNumberAnimation(valueEl) {
    if (!valueEl) return;

    // Polling for data availability
    const checkData = () => {
        const rawText = valueEl.textContent.trim();
        let targetVal = parseFloat(rawText.replace(/[^0-9,.]/g, '').replace(',', '.'));

        if (isNaN(targetVal) || targetVal === 0) {
            if (!valueEl.hasAttribute('data-retries')) valueEl.setAttribute('data-retries', 0);
            let retries = parseInt(valueEl.getAttribute('data-retries'));
            if (retries < 30) {
                valueEl.setAttribute('data-retries', retries + 1);
                setTimeout(checkData, 100);
            }
            return;
        }
        // Go!
        animateValue(valueEl, 0, targetVal, 2000, rawText.includes('kW'));
    };
    checkData();
}

function animateValue(obj, start, end, duration, isKw) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);

        // Easing (Out Expo)
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        let currentVal = easeProgress * (end - start) + start;

        // Format
        let formatted;
        if (isKw) {
            // Keep 1 decimal for kW
            formatted = currentVal.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            formatted += ' kW';
        } else {
            // Integers for counts
            formatted = Math.floor(currentVal).toLocaleString('fr-FR');
        }

        obj.innerHTML = formatted;

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            // Ensure EXACT final value
            if (isKw) {
                obj.innerHTML = end.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' kW';
            } else {
                obj.innerHTML = Math.floor(end).toLocaleString('fr-FR');
            }
        }
    };
    window.requestAnimationFrame(step);
}
