(function () {
  const data = window.REPORT_DATA;
  const mount = document.getElementById('app');

  if (!data || !mount) {
    return;
  }

  const pageLang = String(document.documentElement.lang || '').toLowerCase();
  const lang = pageLang.startsWith('ko') ? 'ko' : 'en';
  const isWorkbookReport = /workbook/i.test(String(data.sourcePdf?.href || ''));

  const UI_DEFAULTS = {
    ko: {
      menuLabel: '메뉴',
      previewLabel: '핵심 요약',
      pagesLabel: '페이지 원본 보기',
      pageModalTitle: '페이지 원본',
      keywordModalTitle: '키워드',
      closeLabel: '닫기',
      keywordExcerptLabel: '원문 근거',
      keywordUsedLabel: '원문 사용 위치',
      pagesFactLabel: '원본 범위',
      coverageFactLabel: '분량',
      browseLabel: '목차부터 보기',
      jumpLabel: '본문 바로 보기',
      infoLabel: '정보',
      searchPlaceholder: '검색어로 장, 카드, 해시태그 찾기',
      searchClearLabel: '초기화',
      searchDefaultLabel: '전체 내용을 보고 있습니다.',
      searchEmptyLabel: '일치하는 결과가 없습니다.',
      searchResultsPattern: '{count}개 결과',
      fallback: '이 구간은 원문 페이지에서 바로 확인할 수 있습니다.',
      worksheetLabel: '학생 입력 워크북',
      worksheetOpenLabel: '직접 입력써보기',
      worksheetSharedLabel: '공통 정보',
      worksheetPagesLabel: '페이지별 직접 입력',
      worksheetTeacherLabel: '선생님 메일',
      worksheetTeacherPlaceholder: 'teacher@example.com',
      worksheetMailButtonLabel: '메일 보내기',
      worksheetDownloadLabel: '입력한 내용으로 PDF 내려받기',
      worksheetResetLabel: '입력 지우기',
      worksheetEmptyLabel: '이 페이지는 입력칸이 없습니다.',
      worksheetFieldsPattern: '입력칸 {count}개',
      worksheetNotice: '워크북은 페이지별로 따로 열어 입력하고, 입력 내용은 브라우저 안에서만 처리됩니다.',
      worksheetMailHint: '메일 보내기는 지원 브라우저에서는 PDF 첨부 공유를 시도하고, 그렇지 않으면 PDF를 내려받은 뒤 메일 초안을 엽니다.',
      worksheetDownloadBusyLabel: 'PDF 만드는 중...',
      worksheetMailBusyLabel: '메일 준비 중...',
      worksheetMailFallbackLabel: '이 브라우저에서는 메일 첨부 공유를 바로 지원하지 않아 PDF를 먼저 내려받고 메일 초안을 엽니다.',
      worksheetAddTextLabel: '한 줄 칸 추가',
      worksheetAddNoteLabel: '메모 칸 추가',
      worksheetDrawHint: '빈칸이 안 잡히면 버튼을 누른 뒤 페이지 위를 드래그해서 직접 입력칸을 만드세요.',
      worksheetRemoveFieldLabel: '직접 만든 입력칸 삭제',
      worksheetActivityFactLabel: '활동',
      worksheetInputFactLabel: '입력 상태',
      worksheetPageTitlePattern: '{page} 입력',
    },
    en: {
      menuLabel: 'Menu',
      previewLabel: 'Core Summary',
      pagesLabel: 'Source Pages',
      pageModalTitle: 'Source Page',
      keywordModalTitle: 'Keyword',
      closeLabel: 'Close',
      keywordExcerptLabel: 'Source Evidence',
      keywordUsedLabel: 'Used in source',
      pagesFactLabel: 'Source pages',
      coverageFactLabel: 'Coverage',
      browseLabel: 'Browse sections',
      jumpLabel: 'Jump to content',
      infoLabel: 'Info',
      searchPlaceholder: 'Search sections, cards, and hashtags',
      searchClearLabel: 'Clear',
      searchDefaultLabel: 'Showing the full report.',
      searchEmptyLabel: 'No matching results.',
      searchResultsPattern: '{count} results',
      fallback: 'Open the source pages for the original wording and layout.',
      worksheetLabel: 'Student workbook',
      worksheetOpenLabel: 'Try typing directly',
      worksheetSharedLabel: 'Shared info',
      worksheetPagesLabel: 'Page-by-page input',
      worksheetTeacherLabel: 'Teacher email',
      worksheetTeacherPlaceholder: 'teacher@example.com',
      worksheetMailButtonLabel: 'Send by email',
      worksheetDownloadLabel: 'Download filled PDF',
      worksheetResetLabel: 'Clear inputs',
      worksheetEmptyLabel: 'This page has no editable area.',
      worksheetFieldsPattern: '{count} fields',
      worksheetNotice: 'Open each workbook page separately and keep input work inside the browser until export.',
      worksheetMailHint: 'When supported, email sharing will try to attach the PDF directly. Otherwise it downloads the PDF first and opens a mail draft.',
      worksheetDownloadBusyLabel: 'Building PDF...',
      worksheetMailBusyLabel: 'Preparing email...',
      worksheetMailFallbackLabel: 'Direct mail sharing is not available in this browser, so the PDF will download first and a mail draft will open.',
      worksheetAddTextLabel: 'Add text box',
      worksheetAddNoteLabel: 'Add note box',
      worksheetDrawHint: 'If a blank area was missed, choose a button and drag on the page to place your own input box.',
      worksheetRemoveFieldLabel: 'Remove custom input box',
      worksheetActivityFactLabel: 'Activity',
      worksheetInputFactLabel: 'Input status',
      worksheetPageTitlePattern: '{page} input',
    },
  };

  const normalizeUi = (ui = {}) => {
    const defaults = UI_DEFAULTS[lang];
    const merged = { ...defaults, ...(ui || {}) };
    const legacyOpenLabels = new Set(['학생 입력 열기', 'Open workbook input']);
    if (!merged.worksheetOpenLabel || legacyOpenLabels.has(merged.worksheetOpenLabel)) {
      merged.worksheetOpenLabel = defaults.worksheetOpenLabel;
    }
    return merged;
  };

  data.ui = normalizeUi(data.ui);

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
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

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
        (tag) =>
          tag.id
            ? `
              <button class="card-tag keyword-trigger search-text" type="button" data-key="${esc(tag.id)}">#${esc(tag.label)}</button>
            `
            : `
              <span class="card-tag is-static search-text">#${esc(tag.label)}</span>
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

  const slugify = (value = '') =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const dedupeTags = (tags = []) => {
    const seen = new Set();
    return tags.filter((tag) => {
      const label = String(tag?.label || '').trim();
      if (!label) {
        return false;
      }
      const key = normalizeSearch(label);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const enrichTags = (item, section) => {
    const tags = dedupeTags(item.tags || []);
    const candidates = [item.pageLabel, item.title, item.activityTitle, section.navLabel || section.title];
    candidates.forEach((label) => {
      if (!label || tags.length >= 8) {
        return;
      }
      tags.push({ label: String(label).trim() });
    });
    return dedupeTags(tags).slice(0, 8);
  };

  const pageRef = (page = {}, title = '') => ({
    label: page.label || `PDF ${page.pageNumber || ''}`.trim(),
    src: page.src,
    title: page.title || `${title} - ${page.label || `PDF ${page.pageNumber || ''}`.trim()}`,
  });

  const worksheetStore = new Map();
  let worksheetSeed = 0;

  const registerWorksheet = (worksheet = {}) => {
    if (!worksheet.pages || !worksheet.pages.length) {
      return '';
    }
    const key = `worksheet-${worksheetSeed++}`;
    worksheetStore.set(key, worksheet);
    return key;
  };

  const workbookInputSummary = (page = {}) =>
    (page.fields || []).length
      ? data.ui.worksheetFieldsPattern.replace('{count}', String(page.fields.length))
      : data.ui.worksheetEmptyLabel;

  const normalizeSections = (sections = []) =>
    sections
      .map((section) => {
        if (!isWorkbookReport) {
          return {
            ...section,
            items: (section.items || []).map((item) => ({
              ...item,
              tags: enrichTags(item, section),
            })),
          };
        }

      const items = (section.items || []).flatMap((item) => {
        const worksheetPages = (item.worksheet?.pages || []).filter((page) => (page.fields || []).length);
        if (!worksheetPages.length) {
          return [];
        }

        return worksheetPages.map((page) => ({
          ...item,
          title: item.title,
          pageLabel: page.label || `PDF ${page.pageNumber}`,
          range: page.label || `PDF ${page.pageNumber}`,
          isWorkbookItem: true,
          tags: enrichTags({ ...item, pageLabel: page.label || `PDF ${page.pageNumber}` }, section),
          facts: [
            { label: data.ui.worksheetActivityFactLabel, value: item.title },
            { label: data.ui.pagesFactLabel, value: page.label || `PDF ${page.pageNumber}` },
            { label: data.ui.worksheetInputFactLabel, value: workbookInputSummary(page) },
          ],
          pages: [pageRef(page, item.title)],
          worksheetKey: registerWorksheet({
            title: `${item.title} - ${page.label || `PDF ${page.pageNumber}`}`,
            sharedFields: item.worksheet?.sharedFields || [],
            pages: [page],
          }),
        }));
      });

      return {
        ...section,
        isWorkbookSection: true,
        meta: [
          lang === 'ko' ? `${items.length}개 페이지` : `${items.length} pages`,
          ...(section.meta || []).slice(1, 2),
        ].filter(Boolean),
        items,
      };
    })
      .filter((section) => {
        if (!section) {
          return false;
        }
        if (!section.isWorkbookSection) {
          return true;
        }
        return (section.items || []).length > 0;
      });

  data.sections = normalizeSections(data.sections || []);
  const sectionIds = new Set((data.sections || []).map((section) => section.id));
  data.nav = (data.nav || []).filter((entry) => sectionIds.has(entry.target));

  const itemSearchBlob = (item) =>
    [
      item.title,
      item.pageLabel || '',
      item.activityTitle || '',
      ...(item.lead || []),
      ...(item.tags || []).map((tag) => tag.label),
      ...((item.worksheet?.sharedFields || []).map((field) => field.label || '')),
    ].join(' ');

  const sectionSearchBlob = (section) =>
    [
      section.navLabel,
      section.title,
      section.description || '',
      ...(section.meta || []),
      ...((section.items || []).map((item) => itemSearchBlob(item))),
    ].join(' ');

  const renderWorksheetField = (field = {}, page = {}, pageIndex = 0, fieldIndex = 0) => {
    const style = `--x:${(field.x || 0) * 100}%; --y:${(field.y || 0) * 100}%; --w:${(field.w || 0) * 100}%; --h:${(field.h || 0) * 100}%;`;
    const attrs = [
      `class="worksheet-input ${field.kind === 'textarea' ? 'is-textarea' : 'is-text'}"`,
      `style="${style}"`,
      `data-field-id="${esc(field.id || `p${pageIndex}-f${fieldIndex}`)}"`,
      `data-field-label="${esc(field.label || '')}"`,
      `data-field-key="${esc(field.key || '')}"`,
      `data-field-kind="${esc(field.kind || 'text')}"`,
      `data-x="${esc(field.x || 0)}"`,
      `data-y="${esc(field.y || 0)}"`,
      `data-w="${esc(field.w || 0)}"`,
      `data-h="${esc(field.h || 0)}"`,
      `data-page-number="${esc(page.pageNumber || '')}"`,
      `placeholder="${esc(field.label || '')}"`,
      `aria-label="${esc(field.label || `${page.label || 'Page'} input ${fieldIndex + 1}`)}"`,
    ].join(' ');
    if (field.kind === 'textarea') {
      return `<textarea ${attrs}></textarea>`;
    }
    return `<input ${attrs} type="text" />`;
  };

  const renderWorksheetEditor = (worksheet = {}, ui) => {
    if (!worksheet || !worksheet.pages || !worksheet.pages.length) {
      return '';
    }
    const openIndex = Math.max(0, worksheet.pages.findIndex((page) => (page.fields || []).length));
    return `
      <div class="worksheet-editor" data-worksheet-title="${esc(worksheet.title || ui.worksheetLabel)}">
        <div class="worksheet-toolbar">
          <div class="worksheet-copy">
            <strong>${esc(ui.worksheetLabel)}</strong>
            <p>${esc(ui.worksheetNotice)}</p>
            <p class="worksheet-hint">${esc(ui.worksheetMailHint)}</p>
          </div>
          <div class="worksheet-toolbar-actions">
            <button class="worksheet-reset" type="button">${esc(ui.worksheetResetLabel)}</button>
            <button class="worksheet-mail" type="button">${esc(ui.worksheetMailButtonLabel)}</button>
            <button class="worksheet-download" type="button">${esc(ui.worksheetDownloadLabel)}</button>
          </div>
        </div>
        <section class="worksheet-shared-panel">
          <div class="worksheet-panel-title">${esc(ui.worksheetSharedLabel)}</div>
          <div class="worksheet-shared-grid">
            ${(worksheet.sharedFields || [])
              .map(
                (field) => `
                  <label class="worksheet-shared-field">
                    <span>${esc(field.label)}</span>
                    <input type="text" data-shared-key="${esc(field.key)}" data-shared-label="${esc(field.label)}" />
                  </label>
                `
              )
              .join('')}
            <label class="worksheet-shared-field is-email">
              <span>${esc(ui.worksheetTeacherLabel)}</span>
              <input type="email" data-teacher-email placeholder="${esc(ui.worksheetTeacherPlaceholder || '')}" />
            </label>
          </div>
        </section>
        <section class="worksheet-pages-panel">
          <div class="worksheet-panel-head">
            <div class="worksheet-panel-title">${esc(ui.worksheetPagesLabel)}</div>
            <div class="worksheet-page-nav">
              ${(worksheet.pages || [])
                .map(
                  (page) => `
                    <button class="worksheet-page-jump" type="button" data-page-jump="${esc(page.pageNumber)}">${esc(page.label || `PDF ${page.pageNumber}`)}</button>
                  `
                )
                .join('')}
            </div>
          </div>
          <div class="worksheet-page-grid">
            ${(worksheet.pages || [])
              .map(
                (page, pageIndex) => `
                  <details class="worksheet-page-sheet" data-page-number="${esc(page.pageNumber)}"${pageIndex === openIndex ? ' open' : ''}>
                    <summary class="worksheet-page-summary">
                      <strong>${esc(page.label || `PDF ${page.pageNumber}`)}</strong>
                      <span>${page.fields?.length ? esc(ui.worksheetFieldsPattern.replace('{count}', page.fields.length)) : esc(ui.worksheetEmptyLabel)}</span>
                    </summary>
                    <article class="worksheet-page" data-page-number="${esc(page.pageNumber)}" data-page-width="${esc(page.width)}" data-page-height="${esc(page.height)}" data-page-src="${esc(page.src)}" data-page-label="${esc(page.label || `PDF ${page.pageNumber}`)}">
                      <div class="worksheet-page-tools">
                        <div class="worksheet-page-actions">
                          <button class="worksheet-field-add" type="button" data-field-kind="text">${esc(ui.worksheetAddTextLabel)}</button>
                          <button class="worksheet-field-add" type="button" data-field-kind="textarea">${esc(ui.worksheetAddNoteLabel)}</button>
                        </div>
                        <p class="worksheet-page-hint">${esc(ui.worksheetDrawHint)}</p>
                      </div>
                      <div class="worksheet-canvas" style="--page-ratio:${esc(page.width)} / ${esc(page.height)};">
                        <img src="${esc(page.src)}" alt="${esc(page.label || `PDF ${page.pageNumber}`)}" loading="lazy" />
                        ${(page.fields || []).map((field, fieldIndex) => renderWorksheetField(field, page, pageIndex, fieldIndex)).join('')}
                      </div>
                    </article>
                  </details>
                `
              )
              .join('')}
          </div>
        </section>
      </div>
    `;
  };

  const renderWorksheetShell = (worksheetKey = '', ui) => {
    if (!worksheetKey) {
      return '';
    }
    return `
      <details class="worksheet-details">
        <summary>${esc(ui.worksheetOpenLabel)}</summary>
        <div class="worksheet-editor-shell" data-worksheet-key="${esc(worksheetKey)}"></div>
      </details>
    `;
  };

  const renderItem = (item, ui, rgb) => `
    <article class="content-card search-card${item.isWorkbookItem ? ' is-workbook-card' : ''}" style="--rgb:${rgb}" data-search="${esc(itemSearchBlob(item))}">
      <div class="card-head">
        <div>
          ${item.pageLabel ? `<p class="card-eyebrow search-text">${esc(item.pageLabel)}</p>` : ''}
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
          ${(item.tags || []).length ? `<div class="card-tags">${renderTagButtons(item.tags)}</div>` : ''}
        </div>
        <div class="fact-panel">
          ${(item.facts || []).map((fact) => `<article><span>${esc(fact.label)}</span><strong>${esc(fact.value)}</strong></article>`).join('')}
        </div>
      </div>
      ${renderWorksheetShell(item.worksheetKey || '', ui)}
      <details class="page-details" style="--rgb:${rgb}"${item.openPages ? ' open' : ''}>
        <summary>${esc(ui.pagesLabel)}</summary>
        <div class="thumb-grid">
          ${renderThumbs(item.pages)}
        </div>
      </details>
    </article>
  `;

  const renderContentSection = (section, ui) => `
    <section class="section-block section search-section${section.isWorkbookSection ? ' is-workbook-section' : ''}" id="${esc(section.id)}" style="--rgb:${section.rgb || data.themeRgb}" data-search="${esc(sectionSearchBlob(section))}">
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
    <div class="page-shell${isWorkbookReport ? ' is-workbook-report' : ''}">
      <header class="site-header">
        <div class="header-top">
          <a class="brand" href="#top">
            <div class="brand-mark">${esc(data.brand.mark || 'AI')}</div>
            <div class="brand-copy">
              <strong>${esc(data.brand.title)}</strong>
              <span>${esc(data.brand.subtitle)}</span>
            </div>
          </a>
          <button class="menu-button" type="button" aria-controls="section-nav" aria-expanded="false">${esc(data.ui.menuLabel)}</button>
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
        <nav class="section-nav" id="section-nav">
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

    <div class="modal page-modal" role="dialog" aria-modal="true" aria-labelledby="page-modal-title" aria-hidden="true">
      <div class="modal-panel">
        <div class="modal-top">
          <strong class="modal-title" id="page-modal-title">${esc(data.ui.pageModalTitle)}</strong>
          <button class="modal-close" type="button" aria-label="${esc(data.ui.closeLabel)}">X</button>
        </div>
        <div class="modal-body"><img src="" alt="" /></div>
      </div>
    </div>

    <div class="modal keyword-modal" role="dialog" aria-modal="true" aria-labelledby="keyword-modal-title" aria-hidden="true">
      <div class="modal-panel">
        <div class="modal-top">
          <strong class="modal-title" id="keyword-modal-title">${esc(data.ui.keywordModalTitle)}</strong>
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

  const modalFocusReturn = new WeakMap();

  const openModal = (modal, trigger) => {
    if (trigger && typeof trigger.focus === 'function') {
      modalFocusReturn.set(modal, trigger);
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    syncModalState();
    requestAnimationFrame(() => {
      modal.querySelector('.modal-close')?.focus();
    });
  };

  const closeModal = (modal) => {
    const wasOpen = modal.classList.contains('open');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (modal === pageModal) {
      pageModalImg.removeAttribute('src');
    }
    syncModalState();
    if (!wasOpen) {
      return;
    }
    const nextModal = document.querySelector('.modal.open');
    if (nextModal && typeof nextModal.querySelector === 'function') {
      nextModal.querySelector('.modal-close')?.focus();
      return;
    }
    modalFocusReturn.get(modal)?.focus?.();
    modalFocusReturn.delete(modal);
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
      closeMenu();
    }
  });

  document.querySelectorAll('.page-trigger').forEach((button) => {
    button.addEventListener('click', () => {
      pageModalImg.src = button.dataset.src;
      pageModalImg.alt = button.dataset.title || data.ui.pageModalTitle;
      pageModal.querySelector('.modal-title').textContent = button.dataset.title || data.ui.pageModalTitle;
      openModal(pageModal, button);
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
      openModal(keywordModal, button);

      keywordBody.querySelectorAll('.page-trigger').forEach((pageButton) => {
        pageButton.addEventListener('click', () => {
          pageModalImg.src = pageButton.dataset.src;
          pageModalImg.alt = pageButton.dataset.title || data.ui.pageModalTitle;
          pageModal.querySelector('.modal-title').textContent = pageButton.dataset.title || data.ui.pageModalTitle;
          openModal(pageModal, pageButton);
        });
      });
    });
  });

  const menuButton = document.querySelector('.menu-button');
  const sectionNav = document.querySelector('.section-nav');
  const compactMenuQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 900px)') : null;

  const syncMenuState = () => {
    if (!menuButton) {
      return;
    }
    menuButton.setAttribute('aria-expanded', String(document.body.classList.contains('menu-open')));
  };

  const closeMenu = () => {
    document.body.classList.remove('menu-open');
    syncMenuState();
  };

  const syncMenuLayout = () => {
    if (compactMenuQuery && !compactMenuQuery.matches) {
      closeMenu();
      return;
    }
    syncMenuState();
  };

  if (menuButton && sectionNav) {
    menuButton.addEventListener('click', () => {
      document.body.classList.toggle('menu-open');
      syncMenuState();
    });
  }

  document.querySelectorAll('.section-nav a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  if (compactMenuQuery) {
    if (typeof compactMenuQuery.addEventListener === 'function') {
      compactMenuQuery.addEventListener('change', syncMenuLayout);
    } else if (typeof compactMenuQuery.addListener === 'function') {
      compactMenuQuery.addListener(syncMenuLayout);
    }
  }

  syncMenuLayout();
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

  const worksheetImageCache = new Map();

  const loadWorksheetImage = (src) => {
    if (worksheetImageCache.has(src)) {
      return worksheetImageCache.get(src);
    }
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
    worksheetImageCache.set(src, promise);
    return promise;
  };

  const canvasToBytes = (canvas) =>
    new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Canvas export failed'));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      }, 'image/png');
    });

  const textMeasureCanvas = document.createElement('canvas');
  const textMeasureCtx = textMeasureCanvas.getContext('2d');
  const worksheetFontFamily = "'Noto Sans KR', sans-serif";

  const wrapCanvasText = (ctx, text, maxWidth) => {
    const paragraphs = String(text || '').split(/\r?\n/);
    const lines = [];
    paragraphs.forEach((paragraph) => {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push('');
        return;
      }
      let current = words[0];
      for (let index = 1; index < words.length; index += 1) {
        const attempt = `${current} ${words[index]}`;
        if (ctx.measureText(attempt).width <= maxWidth) {
          current = attempt;
        } else {
          lines.push(current);
          current = words[index];
        }
      }
      lines.push(current);
    });
    return lines;
  };

  const getBaseFontSize = (width, height, multiline) => {
    const byHeight = multiline ? height * 0.16 : height * 0.52;
    const byWidth = multiline ? width * 0.09 : width * 0.11;
    return Math.max(10, Math.min(multiline ? 22 : 20, Math.min(byHeight, byWidth)));
  };

  const fitCanvasText = (ctx, value, width, height, multiline, baseSize = getBaseFontSize(width, height, multiline)) => {
    const family = worksheetFontFamily;
    let size = Math.max(10, Math.round(baseSize));
    const minSize = Math.max(10, Math.floor(baseSize * 0.74));
    let lines = [];
    while (size >= minSize) {
      ctx.font = `${multiline ? 500 : 600} ${size}px ${family}`;
      lines = multiline ? wrapCanvasText(ctx, value, width) : [String(value || '')];
      const tooWide = lines.some((line) => ctx.measureText(line).width > width);
      const totalHeight = lines.length * size * (multiline ? 1.35 : 1.1);
      if (!tooWide && totalHeight <= height) {
        return { size, lines, family };
      }
      size -= 1;
    }
    ctx.font = `${multiline ? 500 : 600} ${minSize}px ${family}`;
    return { size: minSize, lines: multiline ? wrapCanvasText(ctx, value, width) : [String(value || '')], family };
  };

  const applyWorksheetTypography = (fieldEl) => {
    const multiline = fieldEl.dataset.fieldKind === 'textarea';
    const width = Math.max(24, fieldEl.clientWidth - 16);
    const height = Math.max(16, fieldEl.clientHeight - 12);
    const size = getBaseFontSize(width, height, multiline);
    fieldEl.dataset.fontScale = String(size / Math.max(height, 1));
    fieldEl.style.fontSize = `${size}px`;
    fieldEl.style.lineHeight = multiline ? '1.35' : '1.2';
  };

  const refreshWorksheetTypography = (scope = document) => {
    scope.querySelectorAll('.worksheet-input').forEach((fieldEl) => {
      if (fieldEl.clientWidth && fieldEl.clientHeight) {
        applyWorksheetTypography(fieldEl);
      }
    });
  };

  const drawFieldToCanvas = (ctx, value, fieldEl, canvasWidth, canvasHeight) => {
    if (!String(value || '').trim()) {
      return;
    }
    const x = Number(fieldEl.dataset.x || 0) * canvasWidth;
    const y = Number(fieldEl.dataset.y || 0) * canvasHeight;
    const width = Number(fieldEl.dataset.w || 0) * canvasWidth;
    const height = Number(fieldEl.dataset.h || 0) * canvasHeight;
    if (!width || !height) {
      return;
    }
    const multiline = fieldEl.dataset.fieldKind === 'textarea';
    const inset = multiline ? 8 : 6;
    const boxWidth = Math.max(24, width - inset * 2);
    const boxHeight = Math.max(16, height - inset * 2);
    const fontScale = Number(fieldEl.dataset.fontScale || 0);
    const baseSize = fontScale ? boxHeight * fontScale : getBaseFontSize(boxWidth, boxHeight, multiline);
    const { size, lines, family } = fitCanvasText(ctx, value, boxWidth, boxHeight, multiline, baseSize);
    ctx.save();
    ctx.font = `${multiline ? 500 : 600} ${size}px ${family}`;
    ctx.fillStyle = '#1f1b17';
    ctx.textBaseline = 'top';
    const lineHeight = size * (multiline ? 1.35 : 1.1);
    const startY = y + inset + (multiline ? 0 : Math.max(0, (boxHeight - lineHeight) / 2));
    lines.forEach((line, index) => {
      if (startY + index * lineHeight > y + height - inset) {
        return;
      }
      ctx.fillText(line, x + inset, startY + index * lineHeight, boxWidth);
    });
    ctx.restore();
  };

  const renderWorksheetPageCanvas = async (pageEl) => {
    const image = await loadWorksheetImage(pageEl.dataset.pageSrc);
    await document.fonts?.ready;
    const pdfWidth = Number(pageEl.dataset.pageWidth || 623.622);
    const pdfHeight = Number(pageEl.dataset.pageHeight || 870.236);
    const scale = image.naturalWidth ? image.naturalWidth / pdfWidth : 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(pdfWidth * scale));
    canvas.height = Math.max(1, Math.round(pdfHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    pageEl.querySelectorAll('.worksheet-input').forEach((fieldEl) => {
      drawFieldToCanvas(ctx, fieldEl.value, fieldEl, canvas.width, canvas.height);
    });
    return { canvas, pdfWidth, pdfHeight };
  };

  const syncWorksheetValue = (editor, key, value, source) => {
    if (!key) {
      return;
    }
    editor.querySelectorAll(`[data-field-key="${key}"], [data-shared-key="${key}"]`).forEach((input) => {
      if (input === source) {
        return;
      }
      input.value = value;
    });
  };

  const collectWorksheetPayload = (editor) => ({
    title: editor.dataset.worksheetTitle || data.ui.worksheetLabel,
    shared: Object.fromEntries(
      [...editor.querySelectorAll('[data-shared-key]')].map((input) => [input.dataset.sharedKey, input.value || ''])
    ),
    teacherEmail: editor.querySelector('[data-teacher-email]')?.value.trim() || '',
    pages: [...editor.querySelectorAll('.worksheet-page')].map((pageEl) => ({
      pageNumber: Number(pageEl.dataset.pageNumber || 0),
      fields: [...pageEl.querySelectorAll('.worksheet-input')]
        .map((input) => ({
          id: input.dataset.fieldId,
          key: input.dataset.fieldKey || '',
          label: input.dataset.fieldLabel || '',
          value: input.value || '',
        }))
        .filter((field) => field.value.trim()),
    })),
  });

  const buildWorksheetFilename = (payload) => {
    const studentBits = [payload.shared.student_class, payload.shared.student_number, payload.shared.student_name]
      .map((value) => slugify(value || ''))
      .filter(Boolean)
      .join('-');
    return `${slugify(payload.title || 'worksheet')}${studentBits ? `-${studentBits}` : ''}.pdf`;
  };

  const downloadBlobFile = (blob, fileName) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const buildWorksheetMailBody = (payload, fileName) => {
    const studentInfo = [payload.shared.student_class, payload.shared.student_number, payload.shared.student_name]
      .filter(Boolean)
      .join(' / ');
    const filledPages = payload.pages.filter((page) => page.fields.length).length;
    return [
      payload.title || data.ui.worksheetLabel,
      studentInfo ? `학생 정보: ${studentInfo}` : '',
      `입력한 페이지 수: ${filledPages}`,
      '',
      `${fileName} 파일을 첨부해서 확인해 주세요.`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const buildWorksheetMailto = (payload, fileName) => {
    const subject = [payload.title || data.ui.worksheetLabel, payload.shared.student_name || '']
      .filter(Boolean)
      .join(' - ');
    const query = new URLSearchParams({
      subject,
      body: buildWorksheetMailBody(payload, fileName),
    });
    return `mailto:${encodeURIComponent(payload.teacherEmail || '')}?${query.toString()}`;
  };

  const buildWorksheetPdf = async (editor, button, busyLabel) => {
    if (!window.PDFLib) {
      throw new Error('PDF library is unavailable.');
    }
    button.disabled = true;
    const originalLabel = button.textContent;
    button.textContent = busyLabel;
    try {
      const pdfDoc = await window.PDFLib.PDFDocument.create();
      const pageElements = [...editor.querySelectorAll('.worksheet-page')];
      for (const pageEl of pageElements) {
        const { canvas, pdfWidth, pdfHeight } = await renderWorksheetPageCanvas(pageEl);
        const pngBytes = await canvasToBytes(canvas);
        const image = await pdfDoc.embedPng(pngBytes);
        const pdfPage = pdfDoc.addPage([pdfWidth, pdfHeight]);
        pdfPage.drawImage(image, { x: 0, y: 0, width: pdfWidth, height: pdfHeight });
      }
      const payload = collectWorksheetPayload(editor);
      const bytes = await pdfDoc.save();
      return {
        blob: new Blob([bytes], { type: 'application/pdf' }),
        payload,
        fileName: buildWorksheetFilename(payload),
      };
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  };

  const downloadWorksheetPdf = async (editor, button) => {
    const { blob, fileName } = await buildWorksheetPdf(editor, button, data.ui.worksheetDownloadBusyLabel);
    downloadBlobFile(blob, fileName);
  };

  const shareWorksheetByEmail = async (editor, button) => {
    const { blob, payload, fileName } = await buildWorksheetPdf(editor, button, data.ui.worksheetMailBusyLabel);
    const mailBody = buildWorksheetMailBody(payload, fileName);
    try {
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: payload.title || data.ui.worksheetLabel,
          text: mailBody,
        });
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error(error);
    }
    window.alert(data.ui.worksheetMailFallbackLabel);
    downloadBlobFile(blob, fileName);
    window.location.href = buildWorksheetMailto(payload, fileName);
  };

  const openWorksheetPage = (editor, pageNumber) => {
    const target = String(pageNumber || '');
    if (!target) {
      return;
    }
    editor.querySelectorAll('.worksheet-page-sheet').forEach((sheet) => {
      sheet.open = sheet.dataset.pageNumber === target;
    });
    const active = editor.querySelector(`.worksheet-page-sheet[data-page-number="${target}"]`);
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    requestAnimationFrame(() => refreshWorksheetTypography(active || editor));
  };

  let customFieldCounter = 0;

  const createWorksheetInput = (field = {}, pageNumber = 0, fieldIndex = 0) => {
    const input = document.createElement(field.kind === 'textarea' ? 'textarea' : 'input');
    if (field.kind !== 'textarea') {
      input.type = 'text';
    }
    input.className = `worksheet-input ${field.kind === 'textarea' ? 'is-textarea' : 'is-text'}`;
    input.style.setProperty('--x', `${(field.x || 0) * 100}%`);
    input.style.setProperty('--y', `${(field.y || 0) * 100}%`);
    input.style.setProperty('--w', `${(field.w || 0) * 100}%`);
    input.style.setProperty('--h', `${(field.h || 0) * 100}%`);
    input.dataset.fieldId = field.id || `custom-p${pageNumber}-${fieldIndex}`;
    input.dataset.fieldLabel = field.label || '';
    input.dataset.fieldKey = field.key || '';
    input.dataset.fieldKind = field.kind || 'text';
    input.dataset.x = String(field.x || 0);
    input.dataset.y = String(field.y || 0);
    input.dataset.w = String(field.w || 0);
    input.dataset.h = String(field.h || 0);
    input.dataset.pageNumber = String(pageNumber || '');
    input.placeholder = field.label || '';
    input.setAttribute('aria-label', field.label || `${lang === 'ko' ? '직접 만든 입력칸' : 'Custom input'} ${fieldIndex + 1}`);
    return input;
  };

  const setDrawMode = (pageEl, kind = '') => {
    pageEl.dataset.drawKind = kind;
    const canvas = pageEl.querySelector('.worksheet-canvas');
    canvas?.classList.toggle('is-drawing', Boolean(kind));
    pageEl.querySelectorAll('.worksheet-field-add').forEach((button) => {
      const active = button.dataset.fieldKind === kind;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  const appendCustomField = (pageEl, field) => {
    const canvas = pageEl.querySelector('.worksheet-canvas');
    if (!canvas) {
      return;
    }
    const pageNumber = Number(pageEl.dataset.pageNumber || 0);
    const input = createWorksheetInput(
      {
        ...field,
        id: field.id || `custom-p${pageNumber}-${customFieldCounter}`,
      },
      pageNumber,
      customFieldCounter
    );
    customFieldCounter += 1;
    const shell = document.createElement('div');
    shell.className = 'worksheet-custom-field';
    shell.style.setProperty('--x', `${(field.x || 0) * 100}%`);
    shell.style.setProperty('--y', `${(field.y || 0) * 100}%`);
    shell.style.setProperty('--w', `${(field.w || 0) * 100}%`);
    shell.style.setProperty('--h', `${(field.h || 0) * 100}%`);
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'worksheet-custom-remove';
    removeButton.setAttribute('aria-label', data.ui.worksheetRemoveFieldLabel);
    removeButton.textContent = '×';
    shell.append(removeButton, input);
    canvas.append(shell);
    requestAnimationFrame(() => {
      applyWorksheetTypography(input);
      input.focus();
    });
  };

  const canvasPoint = (canvas, event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / Math.max(rect.width, 1)),
      y: clamp((event.clientY - rect.top) / Math.max(rect.height, 1)),
    };
  };

  const updateDraftRect = (draft, rect) => {
    draft.style.setProperty('--x', `${rect.x * 100}%`);
    draft.style.setProperty('--y', `${rect.y * 100}%`);
    draft.style.setProperty('--w', `${rect.w * 100}%`);
    draft.style.setProperty('--h', `${rect.h * 100}%`);
  };

  const normalizedRect = (start, end, kind) => {
    const minWidth = kind === 'textarea' ? 0.18 : 0.12;
    const minHeight = kind === 'textarea' ? 0.06 : 0.028;
    const rawX = Math.min(start.x, end.x);
    const rawY = Math.min(start.y, end.y);
    const rawW = Math.max(Math.abs(end.x - start.x), minWidth);
    const rawH = Math.max(Math.abs(end.y - start.y), minHeight);
    const x = clamp(rawX, 0, 1 - minWidth);
    const y = clamp(rawY, 0, 1 - minHeight);
    return {
      x,
      y,
      w: clamp(rawW, minWidth, 1 - x),
      h: clamp(rawH, minHeight, 1 - y),
    };
  };

  const initializeWorksheetEditor = (editor) => {
    refreshWorksheetTypography(editor);

    editor.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        return;
      }
      const sharedKey = target.dataset.sharedKey || target.dataset.fieldKey || '';
      if (sharedKey) {
        syncWorksheetValue(editor, sharedKey, target.value, target);
      }
    });

    editor.addEventListener('click', (event) => {
      const addButton = event.target.closest('.worksheet-field-add');
      if (addButton) {
        const pageEl = addButton.closest('.worksheet-page');
        if (!pageEl) {
          return;
        }
        const nextKind = pageEl.dataset.drawKind === addButton.dataset.fieldKind ? '' : addButton.dataset.fieldKind || '';
        setDrawMode(pageEl, nextKind);
        return;
      }

      const removeButton = event.target.closest('.worksheet-custom-remove');
      if (removeButton) {
        removeButton.closest('.worksheet-custom-field')?.remove();
      }
    });

    const resetButton = editor.querySelector('.worksheet-reset');
    const mailButton = editor.querySelector('.worksheet-mail');
    const downloadButton = editor.querySelector('.worksheet-download');

    resetButton?.addEventListener('click', () => {
      editor.querySelectorAll('input, textarea').forEach((input) => {
        input.value = '';
      });
      refreshWorksheetTypography(editor);
    });

    mailButton?.addEventListener('click', async () => {
      try {
        await shareWorksheetByEmail(editor, mailButton);
      } catch (error) {
        console.error(error);
        window.alert(error?.message || 'Mail sharing failed.');
      }
    });

    downloadButton?.addEventListener('click', async () => {
      try {
        await downloadWorksheetPdf(editor, downloadButton);
      } catch (error) {
        console.error(error);
        window.alert(error?.message || 'PDF export failed.');
      }
    });

    editor.querySelectorAll('.worksheet-page-jump').forEach((jumpButton) => {
      jumpButton.addEventListener('click', () => openWorksheetPage(editor, jumpButton.dataset.pageJump));
    });

    editor.querySelectorAll('.worksheet-page-sheet').forEach((sheet) => {
      sheet.addEventListener('toggle', () => {
        if (!sheet.open) {
          return;
        }
        editor.querySelectorAll('.worksheet-page-sheet').forEach((other) => {
          if (other !== sheet) {
            other.open = false;
          }
        });
        requestAnimationFrame(() => refreshWorksheetTypography(sheet));
      });
    });

    editor.querySelectorAll('.worksheet-page').forEach((pageEl) => {
      const canvas = pageEl.querySelector('.worksheet-canvas');
      if (!canvas) {
        return;
      }

      canvas.addEventListener('pointerdown', (event) => {
        const kind = pageEl.dataset.drawKind;
        if (!kind || event.button !== 0) {
          return;
        }
        if (event.target.closest('.worksheet-input, .worksheet-custom-remove')) {
          return;
        }

        event.preventDefault();
        const start = canvasPoint(canvas, event);
        const draft = document.createElement('div');
        draft.className = 'worksheet-draw-preview';
        canvas.append(draft);
        updateDraftRect(draft, { x: start.x, y: start.y, w: 0, h: 0 });

        const handleMove = (moveEvent) => {
          updateDraftRect(draft, normalizedRect(start, canvasPoint(canvas, moveEvent), kind));
        };

        const handleUp = (upEvent) => {
          window.removeEventListener('pointermove', handleMove);
          draft.remove();
          appendCustomField(pageEl, {
            ...normalizedRect(start, canvasPoint(canvas, upEvent), kind),
            kind,
          });
          setDrawMode(pageEl, '');
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp, { once: true });
      });
    });
  };

  document.querySelectorAll('.worksheet-details').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) {
        return;
      }
      const shell = details.querySelector('.worksheet-editor-shell');
      const worksheetKey = shell?.dataset.worksheetKey || '';
      if (!shell || !worksheetKey) {
        return;
      }
      if (!shell.dataset.rendered) {
        const worksheet = worksheetStore.get(worksheetKey);
        if (!worksheet) {
          return;
        }
        shell.innerHTML = renderWorksheetEditor(worksheet, data.ui);
        shell.dataset.rendered = 'true';
        const editor = shell.querySelector('.worksheet-editor');
        if (editor) {
          initializeWorksheetEditor(editor);
        }
      }
      requestAnimationFrame(() => refreshWorksheetTypography(details));
    });
  });

  window.addEventListener('resize', () => refreshWorksheetTypography());

  if (searchInput && searchClear) {
    searchInput.addEventListener('input', () => runSearch(searchInput.value));
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      runSearch('');
      searchInput.focus();
    });
  }
})();










