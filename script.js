// 1. Motore Hero Section (Acronimo -> Testo Esteso)
const acronym = document.getElementById('acronym');
const fullText = document.getElementById('full-text');

window.addEventListener('scroll', () => {
  const scrollPosition = window.scrollY;

  // Soglia calibrata: richiede di scorrere per 150px
  if (scrollPosition > 150) {
    acronym.classList.add('scrolled');
    fullText.classList.add('scrolled');
  } else {
    acronym.classList.remove('scrolled');
    fullText.classList.remove('scrolled');
  }
});

// 2. Intersection Observer per comparsa progressiva dei blocchi
document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.scroll-reveal');

  const observerOptions = {
    root: null,
    rootMargin: '0px',
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