// 1. Motore Hero Section (Acronimo -> Testo Esteso)
const acronym = document.getElementById('acronym');
const fullText = document.getElementById('full-text');

window.addEventListener('scroll', () => {
  const scrollPosition = window.scrollY;

  // Soglia calibrata: richiede di scorrere per 20px
  if (scrollPosition > 20) {
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
    threshold: 0.40
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

// 3. Motore AERIS Global News Feed (3 righe = 12 notizie totali)
async function buildAerospaceNews() {
  const tickerTrack = document.getElementById('ticker-track');
  const newsGrid = document.getElementById('news-grid');
  const toggleBtn = document.getElementById('toggle-news-btn');
  
  if (!tickerTrack || !newsGrid) return;

  try {
    const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fspacenews.com%2Ffeed%2F');
    const data = await res.json();

    if (data.status === 'ok' && data.items.length > 0) {
      let tickerHtml = '';
      let gridHtml = '';
      
      // Impostato a 12 per coprire 3 righe da 4 card ciascuna
      const articles = data.items.slice(0, 12);

      articles.forEach((item, index) => {
        // Popola il ticker in alto
        tickerHtml += `<span class="ticker-item">${item.title}</span>`;
        
        // Estrazione dell'immagine specifica dall'HTML dell'articolo o da enclosure
        let imgUrl = '';

        if (item.thumbnail && item.thumbnail.length > 0) {
          imgUrl = item.thumbnail;
        } else if (item.enclosure && item.enclosure.link) {
          imgUrl = item.enclosure.link;
        } else {
          const rawContent = (item.content || '') + (item.description || '');
          const match = rawContent.match(/<img[^>]+src="([^">]+)"/i);
          if (match && match[1]) {
            imgUrl = match[1];
          } else {
            imgUrl = 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&q=80&w=600';
          }
        }

        const pubDate = new Date(item.pubDate).toLocaleDateString('it-IT');
        
        // Le prime 4 card sono visibili (prima riga), le successive 8 sono nascoste di default
        const hiddenClass = index >= 4 ? 'hidden-row' : '';

        gridHtml += `
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-card ${hiddenClass}">
            <img src="${imgUrl}" alt="Cover" class="news-img" loading="lazy">
            <div class="news-text">
              <div class="news-title">${item.title}</div>
              <div class="news-date">${pubDate}</div>
            </div>
          </a>
        `;
      });

      tickerTrack.innerHTML = tickerHtml + tickerHtml;
      tickerTrack.classList.add('ticker-active');
      newsGrid.innerHTML = gridHtml;

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const hiddenCards = document.querySelectorAll('.news-card.hidden-row');
          const isExpanded = toggleBtn.classList.contains('is-expanded');

          if (isExpanded) {
            hiddenCards.forEach(card => card.style.display = 'none');
            toggleBtn.innerHTML = 'Espandi &darr;';
            toggleBtn.classList.remove('is-expanded');
          } else {
            hiddenCards.forEach(card => card.style.display = 'flex');
            toggleBtn.innerHTML = 'Contrai &uarr;';
            toggleBtn.classList.add('is-expanded');
          }
        });
      }
    }
  } catch (err) {
    console.error('Errore caricamento feed aerospaziale:', err);
    tickerTrack.innerHTML = '<span class="ticker-item">Sistemi di telemetria in attesa di connessione...</span>';
  }
}

document.addEventListener('DOMContentLoaded', buildAerospaceNews);