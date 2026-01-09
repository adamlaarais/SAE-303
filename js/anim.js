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


        // Cleanup delays after animation finishes to fix hover lag
        setTimeout(() => {
            if (title) title.classList.remove('delay-100');
            if (subtitle) subtitle.classList.remove('delay-200');
            if (scrollIcon) scrollIcon.classList.remove('delay-800');
            if (cards.length > 0) {
                cards.forEach(card => card.style.transitionDelay = '');
            }
        }, 1500);

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

// --- Global Scroll Animations ---
function initScrollAnimations() {
    const sections = document.querySelectorAll('.carte, .puissance, .experience, .maj'); // Select all main sections

    if (sections.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;

                    // 1. Title & Subtitle Animation (Global)
                    const title = section.querySelector('h1');
                    const subtitle = section.querySelector('p');
                    if (title) title.classList.add('animate-title');
                    if (subtitle) subtitle.classList.add('animate-subtitle');

                    // 2. Specific Section Logic
                    if (section.classList.contains('carte')) {
                        // Container Animation
                        const container = document.getElementById('top-regions');
                        if (container) setTimeout(() => container.classList.add('container-visible'), 200);

                        // Map Animation
                        const mapPaths = section.querySelectorAll('.france svg path');
                        mapPaths.forEach((path) => {
                            const delay = Math.random() * 1000;
                            setTimeout(() => path.classList.add('map-visible'), delay);
                        });

                        // List Animation
                        const listItems = section.querySelectorAll('.region-item');
                        listItems.forEach((item, index) => {
                            const delay = index * 200;
                            setTimeout(() => {
                                item.classList.add('item-visible');
                                const bar = item.querySelector('.bar-fill');
                                if (bar && bar.dataset.width) {
                                    setTimeout(() => bar.style.width = bar.dataset.width, 300);
                                }
                            }, delay + 500);
                        });
                    }

                    // 3. Puissance Section Logic (Batteries)
                    if (section.classList.contains('puissance')) {
                        const batteries = section.querySelectorAll('.battery-bar');
                        const containers = section.querySelectorAll('.battery-visual');

                        // Animate Containers First
                        containers.forEach((container, index) => {
                            setTimeout(() => {
                                container.classList.add('container-visible');
                            }, index * 100);
                        });

                        // Then Animate Bars (slightly delayed to start after container appears)
                        batteries.forEach((bar, index) => {
                            // Calculate global stagger for effect
                            const delay = 300 + (index * 30);
                            setTimeout(() => {
                                bar.classList.add('battery-visible');
                            }, delay);
                        });
                    }

                    // 4. Experience Section Logic (Solar & Network)
                    if (section.classList.contains('experience')) {

                        // Solar System (Galactic Expansion)
                        const solarSystem = section.querySelector('.orbital-system');
                        if (solarSystem) {
                            setTimeout(() => solarSystem.classList.add('solar-visible'), 200);

                            // Synchronized Stagger (Start at 0.3s, fast pop)
                            const nodes = solarSystem.querySelectorAll('.orbit-node');
                            nodes.forEach((node, i) => {
                                node.style.transitionDelay = `${0.3 + (i * 0.1)}s`;
                            });
                        }

                        // Plug Network (Simple Pop)
                        const network = section.querySelector('.plug-types-network');
                        if (network) {
                            setTimeout(() => network.classList.add('network-visible'), 200);

                            // Synchronized Stagger (Start at 0.3s, matches Solar System)
                            const branchNodes = network.querySelectorAll('.branch-node');
                            branchNodes.forEach((node, i) => {
                                node.style.transitionDelay = `${0.3 + (i * 0.1)}s`;
                            });
                        }
                    }

                    // 5. Updates Section Logic (Timeline & KPIs)
                    if (section.classList.contains('maj')) {
                        const timeline = section.querySelector('.hex-timeline');
                        const kpiContainer = section.querySelector('.kpi-container');

                        // Animate Timeline Items & Connectors (1 by 1)
                        if (timeline) {
                            setTimeout(() => timeline.classList.add('timeline-visible'), 200);

                            // Select ALL children (items + connectors) in order
                            const children = timeline.querySelectorAll('.hex-item, .hex-connector');
                            children.forEach((child, index) => {
                                child.style.transitionDelay = `${index * 0.1}s`; // Faster, smoother flow
                            });

                            // Cleanup: Remove delay after animation so hover is instant
                            setTimeout(() => {
                                children.forEach(child => child.style.transitionDelay = '');
                            }, 2000);
                        }

                        // Animate KPI Cards (Simple Pop)
                        if (kpiContainer) {
                            setTimeout(() => kpiContainer.classList.add('kpi-visible'), 400);
                            const cards = kpiContainer.querySelectorAll('.kpi-card');
                            cards.forEach((card, index) => {
                                card.style.transitionDelay = `${0.2 + (index * 0.1)}s`;
                                const val = card.querySelector('.kpi-value');
                                setTimeout(() => startNumberAnimation(val), 500 + (index * 100));
                            });

                            // Cleanup: Remove delay after animation
                            setTimeout(() => {
                                cards.forEach(card => card.style.transitionDelay = '');
                            }, 2000);
                        }
                    }

                    observer.unobserve(section); // Run once per section
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(section => observer.observe(section));
    }
}

window.addEventListener('load', () => {
    initScrollAnimations();
});
