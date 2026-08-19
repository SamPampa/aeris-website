// 1. Gestione dell'animazione Acronimo -> Testo (Hero Section)
const acronym = document.getElementById('acronym');
const fullText = document.getElementById('full-text');

window.addEventListener('scroll', () => {
  const scrollPosition = window.scrollY;

  // Soglia ritardata a 150 pixel
  if (scrollPosition > 30) {
    acronym.classList.add('scrolled');
    fullText.classList.add('scrolled');
  } else {
    acronym.classList.remove('scrolled');
    fullText.classList.remove('scrolled');
  }
});

// 2. Gestione dei blocchi che compaiono dal basso (Scroll Reveal)
document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.scroll-reveal');

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    // Il blocco appare solo quando è entrato per il 35% nello schermo
    threshold: 0.35 
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); 
      }
    });
  }, observerOptions);

  revealElements.forEach(el => {
    observer.observe(el);
  });
});