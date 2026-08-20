(function () {
  "use strict";

  const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";
  const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&q=80&w=600";
  const NEWSLETTER_KEY = "aeris-newsletter-email";
  const NEWS_LIMIT = 16;
  const NEWS_PREVIEW = 4;

  const NEWS_SOURCES = [
    { id: "spacenews", name: "SpaceNews", rss: "https://spacenews.com/feed/" },
    { id: "nasa", name: "NASA", rss: "https://www.nasa.gov/news-release/feed/" },
    { id: "esa", name: "ESA", rss: "https://www.esa.int/rssfeed/Our_Activities/Space_News" }
  ];

  const TREND_TAXONOMY = [
    { id: "propulsion", label: "Propulsion", keywords: ["propulsion", "engine", "rocket", "thruster", "methane", "hydrogen", "ion drive", "rs-25", "raptor", "vega", "ariane"] },
    { id: "autonomous", label: "Autonomous", keywords: ["autonomous", "uncrewed", "unmanned", "drone", "uav", "robot", "robotics", "artificial intelligence", "flight control", "guidance"] },
    { id: "launch", label: "Launch", keywords: ["launch", "liftoff", "lift-off", "countdown", "booster", "falcon", "starship", "soyuz", "payload fairing"] },
    { id: "satellite", label: "Satellite", keywords: ["satellite", "constellation", "cubesat", "payload", "orbit", "leo", "geo", "gnss", "earth observation"] },
    { id: "testing", label: "Testing", keywords: ["test", "testing", "trial", "hot fire", "static fire", "wind tunnel", "qualification", "campaign", "demonstration"] },
    { id: "regulatory", label: "Regulatory", keywords: ["faa", "fcc", "license", "regulatory", "regulation", "policy", "congress", "export", "itar", "spectrum"] },
    { id: "materials", label: "Materials", keywords: ["composite", "carbon", "alloy", "material", "thermal", "heat shield", "structure", "additive"] },
    { id: "exploration", label: "Exploration", keywords: ["artemis", "moon", "lunar", "mars", "rover", "iss", "station", "crew", "astronaut", "gateway"] }
  ];

  const STOP_WORDS = new Set([
    "the", "a", "an", "of", "and", "to", "in", "for", "on", "with", "as", "at", "by",
    "from", "after", "over", "its", "new", "says", "will", "into", "about", "their"
  ]);

  const SIMULATED_FEEDS = {
    spacenews: [
      { title: "European startup qualifies methane engine for transonic demonstrator", link: "https://spacenews.com/aeris-sim-methane-engine", pubDate: "2026-08-18", thumbnail: "", content: "Propulsion test campaign autonomous flight" },
      { title: "FAA reviews experimental license for high-Mach UAV trials", link: "https://spacenews.com/aeris-sim-faa-uav-license", pubDate: "2026-08-16", thumbnail: "", content: "Regulatory testing envelope expansion" },
      { title: "Composite wingbox survives combined thermal-structural load test", link: "https://spacenews.com/aeris-sim-composite-wingbox", pubDate: "2026-08-14", thumbnail: "", content: "Materials testing structures" },
      { title: "Smallsat rideshare adds Earth observation payload to next Vega flight", link: "https://spacenews.com/aeris-sim-vega-rideshare", pubDate: "2026-08-12", thumbnail: "", content: "Satellite launch payload" },
      { title: "Guidance software stack validated on uncrewed envelope expansion", link: "https://spacenews.com/aeris-sim-guidance-software", pubDate: "2026-08-10", thumbnail: "", content: "Autonomous flight control testing" },
      { title: "Industry consortium funds additive-manufactured nozzle research", link: "https://spacenews.com/aeris-sim-additive-nozzle", pubDate: "2026-08-08", thumbnail: "", content: "Materials propulsion additive" }
    ],
    nasa: [
      { title: "NASA hot-fire campaign clears RS-25 engine controller update", link: "https://www.nasa.gov/aeris-sim-rs25-hotfire", pubDate: "2026-08-19", thumbnail: "", content: "Propulsion testing engine" },
      { title: "Artemis ground systems complete autonomous countdown rehearsal", link: "https://www.nasa.gov/aeris-sim-artemis-countdown", pubDate: "2026-08-17", thumbnail: "", content: "Launch autonomous exploration" },
      { title: "Lunar rover robotics team demonstrates uncrewed sampling sequence", link: "https://www.nasa.gov/aeris-sim-rover-robotics", pubDate: "2026-08-15", thumbnail: "", content: "Autonomous robotics exploration" },
      { title: "New heat shield material qualifies for high-energy Earth return", link: "https://www.nasa.gov/aeris-sim-heat-shield", pubDate: "2026-08-13", thumbnail: "", content: "Materials thermal testing" },
      { title: "CubeSat swarm maps ionospheric plasma after rideshare launch", link: "https://www.nasa.gov/aeris-sim-cubesat-swarm", pubDate: "2026-08-11", thumbnail: "", content: "Satellite launch cubesat" },
      { title: "Flight rules update covers experimental high-Mach research corridors", link: "https://www.nasa.gov/aeris-sim-flight-rules", pubDate: "2026-08-09", thumbnail: "", content: "Regulatory testing policy" }
    ],
    esa: [
      { title: "ESA wind-tunnel campaign probes transonic shock-buffet on UAV planform", link: "https://www.esa.int/aeris-sim-wind-tunnel", pubDate: "2026-08-19", thumbnail: "", content: "Testing aerodynamics autonomous" },
      { title: "Ariane 6 upper stage completes guidance and avionics qualification", link: "https://www.esa.int/aeris-sim-ariane6-avionics", pubDate: "2026-08-17", thumbnail: "", content: "Launch propulsion testing" },
      { title: "Clean Space robotics trial captures uncooperative satellite mock-up", link: "https://www.esa.int/aeris-sim-clean-space", pubDate: "2026-08-15", thumbnail: "", content: "Autonomous robotics satellite" },
      { title: "GNSS next-gen payload enters thermal-vacuum test campaign", link: "https://www.esa.int/aeris-sim-gnss-tvac", pubDate: "2026-08-13", thumbnail: "", content: "Satellite testing payload" },
      { title: "Spectrum coordination framework updated for experimental UAV links", link: "https://www.esa.int/aeris-sim-spectrum-uav", pubDate: "2026-08-11", thumbnail: "", content: "Regulatory spectrum policy" },
      { title: "Hydrogen propulsion breadboard reaches steady-state firing milestone", link: "https://www.esa.int/aeris-sim-hydrogen-propulsion", pubDate: "2026-08-09", thumbnail: "", content: "Propulsion hydrogen testing" }
    ]
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.href;
      }
    } catch (_err) {
      /* ignore invalid urls */
    }
    return "";
  }

  function initHeroTitle() {
    const acronym = $("#acronym");
    const fullText = $("#full-text");
    if (!acronym || !fullText) return;

    let ticking = false;

    const update = () => {
      const scrolled = window.scrollY > 20;
      acronym.classList.toggle("scrolled", scrolled);
      fullText.classList.toggle("scrolled", scrolled);
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
  }

  function initScrollReveal() {
    const revealElements = $$(".scroll-reveal");
    if (!revealElements.length) return;

    if (prefersReducedMotion()) {
      revealElements.forEach((el) => el.classList.add("visible"));
      return;
    }

    revealElements.forEach((el, index) => {
      const delay = Math.min((index % 6) * 70, 280);
      el.style.setProperty("--reveal-delay", `${delay}ms`);
    });

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  function initDivisionFilters() {
    const chips = $$("[data-filter]");
    const cards = $$(".discipline-card");
    if (!chips.length || !cards.length) return;

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = chip.dataset.filter;
        chips.forEach((item) => {
          const active = item === chip;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        cards.forEach((card) => {
          const match = filter === "all" || card.dataset.division === filter;
          card.classList.toggle("is-filtered-out", !match);
        });
      });
    });
  }

  function extractImage(item) {
    if (item.thumbnail) {
      const thumb = safeUrl(item.thumbnail);
      if (thumb) return thumb;
    }
    if (item.enclosure && item.enclosure.link) {
      const enclosure = safeUrl(item.enclosure.link);
      if (enclosure) return enclosure;
    }

    const rawContent = `${item.content || ""} ${item.description || ""}`;
    const match = rawContent.match(/<img[^>]+src=["']([^"'>]+)["']/i);
    if (match && match[1]) {
      const fromHtml = safeUrl(match[1]);
      if (fromHtml) return fromHtml;
    }

    return FALLBACK_IMG;
  }

  function tokenizeTitle(title) {
    return String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  }

  function articleFingerprint(item) {
    const link = safeUrl(item.link);
    if (link) return `url:${link}`;
    return `title:${tokenizeTitle(item.title).slice(0, 6).sort().join(" ")}`;
  }

  function titlesTooSimilar(a, b) {
    const setA = new Set(tokenizeTitle(a));
    const setB = new Set(tokenizeTitle(b));
    if (!setA.size || !setB.size) return false;

    let overlap = 0;
    setA.forEach((token) => {
      if (setB.has(token)) overlap += 1;
    });

    const union = new Set([...setA, ...setB]).size;
    return overlap >= 4 || overlap / union >= 0.45;
  }

  function articleText(item) {
    return `${item.title || ""} ${item.content || ""} ${item.description || ""}`.toLowerCase();
  }

  function matchTrends(item) {
    const haystack = articleText(item);
    return TREND_TAXONOMY.filter((trend) =>
      trend.keywords.some((keyword) => {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
      })
    ).map((trend) => trend.id);
  }

  function normalizeItem(item, source) {
    return {
      title: item.title || "Articolo aerospaziale",
      link: item.link || "",
      pubDate: item.pubDate || "",
      thumbnail: item.thumbnail,
      enclosure: item.enclosure,
      content: item.content || "",
      description: item.description || "",
      source: source.id,
      sourceName: source.name,
      trends: matchTrends(item)
    };
  }

  async function fetchSourceFeed(source) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${RSS2JSON}${encodeURIComponent(source.rss)}`, {
        signal: controller.signal
      });
      if (!res.ok) throw new Error("unreachable");
      const data = await res.json();
      if (data.status !== "ok" || !Array.isArray(data.items) || !data.items.length) {
        throw new Error("empty");
      }
      return data.items.map((item) => normalizeItem(item, source));
    } catch (_err) {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  function dedupeAndInterleave(buckets, limit) {
    const queues = buckets.map((items) => [...items]);
    const selected = [];
    const used = new Set();

    const isDuplicate = (item) => {
      const fingerprint = articleFingerprint(item);
      if (used.has(fingerprint)) return true;
      return selected.some((existing) => titlesTooSimilar(existing.title, item.title));
    };

    let addedInRound = true;
    while (selected.length < limit && addedInRound) {
      addedInRound = false;
      queues.forEach((queue) => {
        if (selected.length >= limit) return;
        while (queue.length) {
          const candidate = queue.shift();
          if (isDuplicate(candidate)) continue;
          used.add(articleFingerprint(candidate));
          selected.push(candidate);
          addedInRound = true;
          break;
        }
      });
    }

    return selected;
  }

  function topTrends(articles, count) {
    const scores = new Map(TREND_TAXONOMY.map((trend) => [trend.id, 0]));

    articles.forEach((article) => {
      article.trends.forEach((trendId) => {
        scores.set(trendId, (scores.get(trendId) || 0) + 1);
      });
    });

    return TREND_TAXONOMY
      .filter((trend) => (scores.get(trend.id) || 0) > 0)
      .sort((a, b) => {
        const scoreDiff = (scores.get(b.id) || 0) - (scores.get(a.id) || 0);
        return scoreDiff !== 0 ? scoreDiff : TREND_TAXONOMY.indexOf(a) - TREND_TAXONOMY.indexOf(b);
      })
      .slice(0, count);
  }

  function initNewsFeed() {
    const tickerTrack = $("#ticker-track");
    const newsGrid = $("#news-grid");
    const toggleBtn = $("#toggle-news-btn");
    const searchInput = $("#news-search");
    const filtersEl = $("#news-filters");

    if (!tickerTrack || !newsGrid || !filtersEl) return;

    let articles = [];
    let expanded = false;
    let activeTag = "all";
    let query = "";

    const applyFilters = () => {
      const cards = $$(".news-card", newsGrid);
      let matchingCount = 0;
      let shownCount = 0;
      const collapseExtra = activeTag === "all" && !query && !expanded;

      cards.forEach((card) => {
        const title = card.dataset.title || "";
        const tags = (card.dataset.tags || "").split(" ").filter(Boolean);
        const matchesTag = activeTag === "all" || tags.includes(activeTag);
        const matchesQuery = !query || title.includes(query);
        const matches = matchesTag && matchesQuery;
        card.classList.toggle("is-filtered-out", !matches);

        if (!matches) return;
        matchingCount += 1;

        const hideForCollapse = collapseExtra && shownCount >= NEWS_PREVIEW;
        card.classList.toggle("hidden-row", hideForCollapse);
        if (!hideForCollapse) shownCount += 1;
      });

      if (toggleBtn) {
        const canExpand = activeTag === "all" && !query && matchingCount > NEWS_PREVIEW;
        toggleBtn.hidden = !canExpand;
        toggleBtn.setAttribute("aria-expanded", String(expanded && canExpand));
        toggleBtn.innerHTML = expanded ? "Contrai &uarr;" : "Espandi &darr;";
      }
    };

    const renderDynamicFilters = () => {
      $$("[data-news-filter]:not([data-news-filter='all'])", filtersEl).forEach((chip) => chip.remove());

      topTrends(articles, 4).forEach((trend) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "filter-chip";
        chip.dataset.newsFilter = trend.id;
        chip.setAttribute("aria-pressed", "false");
        chip.textContent = trend.label;
        filtersEl.appendChild(chip);
      });
    };

    const render = () => {
      const tickerParts = [];
      const cards = articles.map((item, index) => {
        const title = item.title;
        const imgUrl = extractImage(item);
        const link = safeUrl(item.link) || "#";
        const pubDate = item.pubDate
          ? new Date(item.pubDate).toLocaleDateString("it-IT")
          : "";

        tickerParts.push(`<span class="ticker-item">${escapeHtml(title)}</span>`);

        return `
          <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="news-card" data-title="${escapeHtml(title.toLowerCase())}" data-tags="${escapeHtml(item.trends.join(" "))}" data-source="${escapeHtml(item.source)}" style="--reveal-delay: ${Math.min(index * 40, 200)}ms">
            <img src="${escapeHtml(imgUrl)}" alt="" class="news-img" loading="lazy" decoding="async">
            <div class="news-text">
              <div class="news-title">${escapeHtml(title)}</div>
              <div class="news-date">${escapeHtml(pubDate)}</div>
            </div>
          </a>
        `;
      });

      tickerTrack.innerHTML = tickerParts.join("") + tickerParts.join("");
      tickerTrack.classList.toggle("ticker-active", !prefersReducedMotion() && tickerParts.length > 0);
      newsGrid.innerHTML = cards.join("");
      renderDynamicFilters();
      applyFilters();
    };

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        expanded = !expanded;
        toggleBtn.classList.toggle("is-expanded", expanded);
        applyFilters();
      });
    }

    filtersEl.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-news-filter]");
      if (!chip || !filtersEl.contains(chip)) return;

      activeTag = chip.dataset.newsFilter || "all";
      $$("[data-news-filter]", filtersEl).forEach((item) => {
        const active = item === chip;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      if (activeTag !== "all") expanded = true;
      applyFilters();
    });

    if (searchInput) {
      let debounceId;
      searchInput.addEventListener("input", () => {
        clearTimeout(debounceId);
        debounceId = setTimeout(() => {
          query = searchInput.value.trim().toLowerCase();
          expanded = Boolean(query);
          applyFilters();
        }, 160);
      });
    }

    (async () => {
      try {
        const buckets = await Promise.all(
          NEWS_SOURCES.map(async (source) => {
            const live = await fetchSourceFeed(source);
            if (live.length >= 8) return live;
            const simulated = (SIMULATED_FEEDS[source.id] || []).map((item) =>
              normalizeItem(item, source)
            );
            return [...live, ...simulated];
          })
        );

        articles = dedupeAndInterleave(buckets, NEWS_LIMIT);
        if (!articles.length) throw new Error("empty aggregation");
        render();
      } catch (err) {
        console.error("Errore caricamento feed aerospaziale:", err);
        tickerTrack.innerHTML =
          '<span class="ticker-item">Sistemi di telemetria in attesa di connessione...</span>';
      }
    })();
  }

  function initNewsletter() {
    const dialog = $("#newsletter-dialog");
    const form = $("#newsletter-form");
    const emailInput = $("#newsletter-email");
    const errorEl = $("#newsletter-error");
    const openers = ["#open-newsletter", "#open-newsletter-footer"]
      .map((sel) => $(sel))
      .filter(Boolean);
    const closer = $("#close-newsletter");

    if (!dialog || !form || !emailInput) return;

    const open = () => {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      emailInput.focus();
    };

    const close = () => {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    };

    openers.forEach((btn) => btn.addEventListener("click", open));
    if (closer) closer.addEventListener("click", close);

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = emailInput.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!valid) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = "Inserisci un indirizzo email valido.";
        }
        emailInput.focus();
        return;
      }

      try {
        localStorage.setItem(NEWSLETTER_KEY, email);
      } catch (_err) {
        /* storage might be blocked */
      }

      if (errorEl) errorEl.hidden = true;
      form.classList.add("is-success");
      const copy = $(".newsletter-copy", form);
      if (copy) {
        copy.textContent =
          "Iscrizione registrata su questo dispositivo. Ti terremo nel loop del briefing AERIS.";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHeroTitle();
    initScrollReveal();
    initDivisionFilters();
    initNewsFeed();
    initNewsletter();
  });
})();
