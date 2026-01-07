const scrollContainer = document.documentElement; // html element
const progressBar = document.getElementById('scroll-progress');
const progressBarFill = document.querySelector('.scroll-progress-bar');

const startOffset = window.innerHeight; // Height of the first section (Accueil)

function updateProgressBar() {
    // Calculate scroll relative to the START of the second section
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    const maxScroll = scrollHeight - clientHeight;
    const availableScroll = maxScroll - startOffset; // Scrollable area after Accueil

    // Check if we are past the first section
    if (scrollTop > startOffset - 100) { // Slight buffer
        progressBar.style.opacity = '1';
    } else {
        progressBar.style.opacity = '0';
    }

    // Calculate progress
    let progress = 0;
    if (scrollTop > startOffset) {
        progress = ((scrollTop - startOffset) / availableScroll) * 100;
    }

    // Clamp 0-100
    progress = Math.min(Math.max(progress, 0), 100);

    if (progressBarFill) {
        progressBarFill.style.height = `${progress}%`;
    }
}

// Initialize
updateProgressBar();

// Listen to scroll
window.addEventListener('scroll', updateProgressBar);
window.addEventListener('resize', () => {
    // Re-run on resize in case vh changes
    updateProgressBar();
});
