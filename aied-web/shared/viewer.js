(function () {
  const data = window.REPORT_DATA;
  const mount = document.getElementById('app');

  if (!data || !mount) {
    return;
  }

  const esc = (value = '') =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const normalizeSearch = (value = '') =>
    String(value)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const matchesAll = (haystack = '', terms = []) => {
    const normalized = normalizeSearch(haystack);
    return terms.every((term) => normalized.includes(term));
  };

  const renderThumbs = (pages = []) =>
    pages
      .map(
        (page) => `
          <button class="thumb-button page-trigger" type="button" data-src="${esc(page.src)}" data-title="${esc(page.title || page.label)}">
            <img src="${esc(page.src)}" alt="${esc(page.title || page.label)}" loading="lazy" />
            <span>${esc(page.label)}</span>
          </button>
        `
      )
      .join('');

  const renderTagButtons = (tags = []) =>
    tags
      .map(
        (tag) => `
          <button class="card-tag keyword-trigger search-text" type="button" data-key="${esc(tag.id)}">#${esc(tag.label)}</button>
        `
      )
      .join('');

  const renderSwitchItems = (items = []) =>
    items
      .map((item) => {
        const className = ['switch-chip', item.active ? 'active' : '', item.disabled ? 'disabled' : '']
          .filter(Boolean)
          .join(' ');
        if (item.disabled) {
          return `<span class="${className}" aria-disabled="true">${esc(item.label)}</span>`;
        }
        return `<a href="${esc(item.href)}" class="${className}">${esc(item.label)}</a>`;
      })
      .join('');

  const renderGraph = (graph = {}, ui) => {
    if (!graph.center) {
      return '';
    }
    const rawNodes = (graph.nodes || []).slice(0, 5);
    if (!rawNodes.length) {
      return '';
    }
    const radiusX = rawNodes.length > 4 ? 38 : 34;
    const radiusY = rawNodes.length > 4 ? 32 : 28;
    const nodes = rawNodes.map((node, index) => {
      const angle = ((Math.PI * 2) / rawNodes.length) * index - Math.PI / 2;
      return {
        ...node,
        x: 50 + Math.cos(angle) * radiusX,
        y: 50 + Math.sin(angle) * radiusY,
      };
    });
    return `
      <div class="mini-graph" aria-label="${esc(ui.graphLabel)}">
        <div class="graph-frame">
          <svg class="graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${nodes
              .map(
                (node) => `
                  <line x1="50" y1="50" x2="${node.x.toFixed(1)}" y2="${node.y.toFixed(1)}"></line>
                `
              )
              .join('')}
            ${nodes.length > 2
              ? nodes
                  .map((node, index) => {
                    const next = nodes[(index + 1) % nodes.length];
                    return `
                      <line class="graph-loop" x1="${node.x.toFixed(1)}" y1="${node.y.toFixed(1)}" x2="${next.x.toFixed(1)}" y2="${next.y.toFixed(1)}"></line>
                    `;
                  })
                  .join('')
              : ''}
          </svg>
          <div class="graph-core">
            <span class="graph-core-label">${esc(ui.graphLabel)}</span>
            <strong class="search-text">${esc(graph.center)}</strong>
          </div>
          <div class="graph-nodes">
            ${nodes
              .map((node) => {
                const style = `--x:${node.x.toFixed(1)}%; --y:${node.y.toFixed(1)}%;`;
                if (node.id) {
                  return `
                    <button class="graph-node keyword-trigger search-text" type="button" data-key="${esc(node.id)}" style="${style}">
                      ${esc(node.label)}
                    </button>
                  `;
                }
                return `
                  <span class="graph-node search-text" style="${style}">
                    ${esc(node.label)}
                  </span>
                `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  };

  const itemSearchBlob = (item) =>
    [
      item.title,
      ...(item.lead || []),
      ...(item.tags || []).map((tag) => tag.label),
      item.graph?.center || '',
      ...((item.graph?.nodes || []).map((node) => node.label || '')),
    ].join(' ');

  const sectionSearchBlob = (section) =>
    [
      section.navLabel,
      section.title,
      section.description || '',
      ...(section.meta || []),
      ...((section.items || []).map((item) => itemSearchBlob(item))),
    ].join(' ');

  const renderItem = (item, ui, rgb) => `
    <article class="content-card search-card" style="--rgb:${rgb}" data-search="${esc(itemSearchBlob(item))}">
      <div class="card-head">
        <div>
          <h3 class="search-text">${esc(item.title)}</h3>
        </div>
        <div class="range-pill">${esc(item.range)}</div>
      </div>
      <div class="card-body">
        <div class="lead-panel">
          <h4>${esc(ui.previewLabel)}</h4>
          <ul class="summary-list">
            ${(item.lead || []).map((para) => `<li class="search-text">${esc(para)}</li>`).join('')}
          </ul>
          ${renderGraph(item.graph || {}, ui)}
          ${(item.tags || []).length ? `<div class="card-tags">${renderTagButtons(item.tags)}</div>` : ''}
        </div>
        <div class="fact-panel">
          ${(item.facts || []).map((fact) => `<article><span>${esc(fact.label)}</span><strong>${esc(fact.value)}</strong></article>`).join('')}
        </div>
      </div>
      <details class="page-details" style="--rgb:${rgb}"${item.openPages ? ' open' : ''}>
        <summary>${esc(ui.pagesLabel)}</summary>
        <div class="thumb-grid">
          ${renderThumbs(item.pages)}
        </div>
      </details>
    </article>
  `;

  const renderContentSection = (section, ui) => `
    <section class="section-block section search-section" id="${esc(section.id)}" style="--rgb:${section.rgb || data.themeRgb}" data-search="${esc(sectionSearchBlob(section))}">
      <div class="section-intro">
        <p class="kicker search-text">${esc(section.navLabel || section.title)}</p>
        <h2 class="search-text">${esc(section.title)}</h2>
        ${section.description ? `<p class="section-desc search-text">${esc(section.description)}</p>` : ''}
        <div class="section-meta">
          ${(section.meta || []).map((item) => `<span class="search-text">${esc(item)}</span>`).join('')}
        </div>
      </div>
      <div class="card-grid">
        ${(section.items || []).map((item) => renderItem(item, ui, section.rgb || data.themeRgb)).join('')}
      </div>
    </section>
  `;

  const renderCreditSection = (section) => `
    <section class="section-block section search-section" id="${esc(section.id)}" style="--rgb:${section.rgb || data.themeRgb}" data-search="${esc([section.navLabel || section.title, ...(section.people || []).map((person) => person.name)].join(' '))}">
      <div class="section-intro">
        <p class="kicker search-text">${esc(section.navLabel || section.title)}</p>
        <h2 class="search-text">${esc(section.title)}</h2>
        ${section.description ? `<p class="section-desc search-text">${esc(section.description)}</p>` : ''}
      </div>
      <div class="credit-grid">
        ${(section.people || [])
          .map(
            (person) => `
              <article class="credit-card search-card" data-search="${esc([person.name, person.role || ''].join(' '))}">
                <strong class="search-text">${esc(person.name)}</strong>
                ${person.role ? `<span class="search-text">${esc(person.role)}</span>` : ''}
              </article>
            `
          )
          .join('')}
      </div>
    </section>
  `;

  const renderSection = (section, ui) => {
    if (section.kind === 'credits') {
      return renderCreditSection(section);
    }
    return renderContentSection(section, ui);
  };

  const keywordButtons = (data.keywords || [])
    .map(
      (keyword) => `
        <button class="keyword-trigger search-text" type="button" data-key="${esc(keyword.id)}">#${esc(keyword.term)}</button>
      `
    )
    .join('');

  mount.innerHTML = `
    <div class="page-shell">
      <header class="site-header">
        <div class="header-top">
          <a class="brand" href="#top">
            <div class="brand-mark">${esc(data.brand.mark || 'AI')}</div>
            <div class="brand-copy">
              <strong>${esc(data.brand.title)}</strong>
              <span>${esc(data.brand.subtitle)}</span>
            </div>
          </a>
          <button class="menu-button" type="button">${esc(data.ui.menuLabel)}</button>
          <div class="header-tools">
            <div class="switch-row report-switch-row" id="report-switch">
              ${renderSwitchItems(data.reportSwitches || [])}
            </div>
            ${(data.languageSwitches || []).length ? `<div class="switch-row lang-switch-row">${renderSwitchItems(data.languageSwitches || [])}</div>` : ''}
            ${data.infoLink ? `<a class="info-button" href="${esc(data.infoLink.href)}">${esc(data.infoLink.label)}</a>` : ''}
            <a class="pdf-button" href="${esc(data.sourcePdf.href)}" target="_blank" rel="noreferrer">${esc(data.sourcePdf.label)}</a>
          </div>
        </div>
        <div class="search-row">
          <label class="search-shell">
            <input class="search-input" type="search" placeholder="${esc(data.ui.searchPlaceholder)}" aria-label="${esc(data.ui.searchPlaceholder)}" />
          </label>
          <button class="search-clear" type="button" hidden>${esc(data.ui.searchClearLabel)}</button>
          <p class="search-status" aria-live="polite">${esc(data.ui.searchDefaultLabel)}</p>
        </div>
        <nav class="section-nav">
          ${(data.nav || []).map((item) => `<a href="#${esc(item.target)}">${esc(item.label)}</a>`).join('')}
        </nav>
      </header>

      <main>
        <section class="hero-grid" id="top">
          <div class="hero-panel">
            <div class="eyebrow">${esc(data.hero.eyebrow)}</div>
            <h1 class="hero-title">${esc(data.hero.title)}<span>${esc(data.hero.subtitle)}</span></h1>
            <p class="hero-subtitle">${esc(data.hero.strapline)}</p>
            <p class="hero-description">${esc(data.hero.description)}</p>
            ${(data.hero.stats || []).length ? `<div class="hero-stats">${(data.hero.stats || []).map((stat) => `<article><span>${esc(stat.label)}</span><strong>${esc(stat.value)}</strong></article>`).join('')}</div>` : ''}
            ${keywordButtons ? `<div class="keyword-bar">${keywordButtons}</div>` : ''}
            <div class="hero-actions">
              ${(data.hero.actions || [])
                .map((action, idx) => `<a href="${esc(action.href)}" class="${idx === 0 ? 'primary' : ''}">${esc(action.label)}</a>`)
                .join('')}
            </div>
          </div>
          <aside class="cover-panel">
            <div class="cover-top"><span>${esc(data.hero.coverLabel)}</span><span>${esc(data.hero.coverPageLabel)}</span></div>
            <button class="cover-button page-trigger" type="button" data-src="${esc(data.hero.cover.src)}" data-title="${esc(data.hero.cover.title)}">
              <img src="${esc(data.hero.cover.src)}" alt="${esc(data.hero.cover.title)}" />
            </button>
          </aside>
        </section>

        ${(data.sections || []).map((section) => renderSection(section, data.ui)).join('')}

        ${data.footer ? `<section class="footer-note">${esc(data.footer)}</section>` : ''}
      </main>
    </div>

    <div class="modal page-modal" aria-hidden="true">
      <div class="modal-panel">
        <div class="modal-top">
          <strong class="modal-title">${esc(data.ui.pageModalTitle)}</strong>
          <button class="modal-close" type="button" aria-label="${esc(data.ui.closeLabel)}">X</button>
        </div>
        <div class="modal-body"><img src="" alt="" /></div>
      </div>
    </div>

    <div class="modal keyword-modal" aria-hidden="true">
      <div class="modal-panel">
        <div class="modal-top">
          <strong class="modal-title">${esc(data.ui.keywordModalTitle)}</strong>
          <button class="modal-close" type="button" aria-label="${esc(data.ui.closeLabel)}">X</button>
        </div>
        <div class="modal-body"></div>
      </div>
    </div>
  `;

  const pageModal = document.querySelector('.page-modal');
  const pageModalImg = pageModal.querySelector('img');
  const keywordModal = document.querySelector('.keyword-modal');
  const keywordBody = keywordModal.querySelector('.modal-body');
  const keywordMap = Object.fromEntries(((data.keywordIndex || data.keywords || [])).map((item) => [item.id, item]));

  const syncModalState = () => {
    document.body.classList.toggle('modal-open', !!document.querySelector('.modal.open'));
  };

  const closeModal = (modal) => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (modal === pageModal) {
      pageModalImg.removeAttribute('src');
    }
    syncModalState();
  };

  document.querySelectorAll('.modal-close').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.closest('.modal')));
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal(pageModal);
      closeModal(keywordModal);
    }
  });

  document.querySelectorAll('.page-trigger').forEach((button) => {
    button.addEventListener('click', () => {
      pageModalImg.src = button.dataset.src;
      pageModalImg.alt = button.dataset.title || data.ui.pageModalTitle;
      pageModal.querySelector('.modal-title').textContent = button.dataset.title || data.ui.pageModalTitle;
      pageModal.classList.add('open');
      pageModal.setAttribute('aria-hidden', 'false');
      syncModalState();
    });
  });

  document.querySelectorAll('.keyword-trigger').forEach((button) => {
    button.addEventListener('click', () => {
      const keyword = keywordMap[button.dataset.key];
      if (!keyword) return;
      keywordBody.innerHTML = `
        <div class="keyword-copy">
          <div class="term">${esc(keyword.term)}</div>
          ${keyword.description ? `<p>${esc(keyword.description)}</p>` : ''}
        </div>
        <div class="keyword-quote">
          <h4>${esc(data.ui.keywordExcerptLabel)}</h4>
          <p>${esc(keyword.excerpt)}</p>
        </div>
        ${(keyword.occurrences || []).length ? `<div class="keyword-occurrences"><h4>${esc(data.ui.keywordUsedLabel)}</h4>${(keyword.occurrences || []).map((occurrence) => `<article><span>${esc(occurrence.page)}</span><p>${esc(occurrence.text)}</p></article>`).join('')}</div>` : ''}
        <div class="keyword-pages">
          ${(keyword.pages || []).map((page) => `<button class="page-trigger keyword-page" type="button" data-src="${esc(page.src)}" data-title="${esc(page.title || page.label)}">${esc(page.label)}</button>`).join('')}
        </div>
      `;
      keywordModal.querySelector('.modal-title').textContent = keyword.term;
      keywordModal.classList.add('open');
      keywordModal.setAttribute('aria-hidden', 'false');
      syncModalState();

      keywordBody.querySelectorAll('.page-trigger').forEach((pageButton) => {
        pageButton.addEventListener('click', () => {
          pageModalImg.src = pageButton.dataset.src;
          pageModalImg.alt = pageButton.dataset.title || data.ui.pageModalTitle;
          pageModal.querySelector('.modal-title').textContent = pageButton.dataset.title || data.ui.pageModalTitle;
          pageModal.classList.add('open');
          pageModal.setAttribute('aria-hidden', 'false');
          syncModalState();
        });
      });
    });
  });

  const menuButton = document.querySelector('.menu-button');
  const sectionNav = document.querySelector('.section-nav');

  if (menuButton && sectionNav) {
    menuButton.addEventListener('click', () => {
      document.body.classList.toggle('menu-open');
    });
  }

  document.querySelectorAll('.section-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
    });
  });

  const navLinks = [...document.querySelectorAll('.section-nav a')];
  const sections = [...document.querySelectorAll('.section')];

  if (sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        });
      },
      { threshold: 0.42, rootMargin: '-20% 0px -45% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
  }

  const searchInput = document.querySelector('.search-input');
  const searchClear = document.querySelector('.search-clear');
  const searchStatus = document.querySelector('.search-status');
  const searchTexts = [...document.querySelectorAll('.search-text')];
  const searchCards = [...document.querySelectorAll('.search-card')];
  const searchSections = [...document.querySelectorAll('.search-section')];

  searchTexts.forEach((element) => {
    element.dataset.raw = element.innerHTML;
  });

  const highlightTerms = (terms) => {
    searchTexts.forEach((element) => {
      let html = element.dataset.raw || element.innerHTML;
      if (terms.length) {
        terms.forEach((term) => {
          const regex = new RegExp(`(${escapeRegExp(term)})`, 'ig');
          html = html.replace(regex, '<mark class="search-hit">$1</mark>');
        });
      }
      element.innerHTML = html;
    });
  };

  const setSearchStatus = (count, active) => {
    if (!active) {
      searchStatus.textContent = data.ui.searchDefaultLabel;
      return;
    }
    if (!count) {
      searchStatus.textContent = data.ui.searchEmptyLabel;
      return;
    }
    searchStatus.textContent = data.ui.searchResultsPattern.replace('{count}', count);
  };

  const runSearch = (query = '') => {
    const terms = normalizeSearch(query).split(' ').filter(Boolean);
    const active = terms.length > 0;
    highlightTerms(terms);

    let count = 0;

    searchSections.forEach((section) => {
      const sectionCards = [...section.querySelectorAll('.search-card')];
      const sectionMatch = active && matchesAll(section.dataset.search || '', terms);
      let visibleCards = 0;

      sectionCards.forEach((card) => {
        const cardMatch = !active || sectionMatch || matchesAll(card.dataset.search || '', terms);
        card.classList.toggle('search-hidden', !cardMatch);
        if (cardMatch) {
          visibleCards += 1;
        }
      });

      const showSection = !active || sectionMatch || visibleCards > 0;
      section.classList.toggle('search-hidden', !showSection);

      if (active && showSection) {
        count += visibleCards || 1;
      }
    });

    searchClear.hidden = !active;
    setSearchStatus(count, active);
  };

  if (searchInput && searchClear) {
    searchInput.addEventListener('input', () => runSearch(searchInput.value));
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      runSearch('');
      searchInput.focus();
    });
  }
})();
