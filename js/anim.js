const loader = document.getElementById('loader-wrapper');
if (loader) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('loader-hidden');
            setTimeout(() => { loader.style.display = 'none'; }, 800);
        }, 2500);
    });
}
