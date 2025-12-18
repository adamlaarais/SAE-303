window.addEventListener('load', () => {
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        // Le temps (2500ms) correspond exactement à la fin de l'animation 'fillingHorizontal'
        setTimeout(() => {
            loader.classList.add('loader-hidden');
            
            // On retire du DOM après l'effet de glissement (0.8s dans le CSS)
            setTimeout(() => {
                loader.style.display = 'none';
            }, 800);
        }, 2500); 
    }
});