// ═══════════════════════════════════════════════════════════════
//  SLIDING SIDE MENU
// ═══════════════════════════════════════════════════════════════
const slidingMenuPull = document.getElementById('slidingMenuPull');
const slidingMenuContent = document.getElementById('slidingMenuContent');

if (slidingMenuPull && slidingMenuContent) {
    slidingMenuPull.addEventListener('click', () => {
        slidingMenuContent.classList.toggle('open');
    });
}

