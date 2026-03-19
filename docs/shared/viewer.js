(function () {
  const data = window.REPORT_DATA;
  const mount = document.getElementById('app');

  if (!data || !mount) {
    return;
  }

  const pageLang = String(document.documentElement.lang || '').toLowerCase();
  const lang = pageLang.startsWith('ko') ? 'ko' : 'en';
  const isWorkbookReport = /workbook/i.test(String(data.sourcePdf?.href || ''));
  const onNextFrame = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame.bind(window) : (callback) => window.setTimeout(callback, 16);
  const workbookNavLabels = {
    prev: lang === 'ko' ? '이전 페이지' : 'Previous page',
    next: lang === 'ko' ? '다음 페이지' : 'Next page',
  };
  const workbookReportKeyMatch = String(data.sourcePdf?.href || '').match(/\/([^/]+)\/source\.pdf$/i);
  const workbookReportKey = workbookReportKeyMatch ? workbookReportKeyMatch[1] : '';
  const UI_DEFAULTS = {
    ko: {
      menuLabel: '메뉴',
      previewLabel: '핵심 요약',
      pagesLabel: '페이지 보기',
      pageModalTitle: '페이지',
      pagePrevLabel: '이전 쪽',
      pageNextLabel: '다음 쪽',
      pagePositionPattern: '{current} / {total}',
      keywordModalTitle: '키워드',
      closeLabel: '닫기',
      keywordExcerptLabel: '원문 근거',
      keywordUsedLabel: '원문 사용 위치',
      pagesFactLabel: '페이지',
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
      worksheetOpenLabel: '직접 입력하기',
      worksheetSharedLabel: '공통 정보',
      worksheetPagesLabel: '페이지별 직접 입력',
      worksheetTeacherLabel: '',
      worksheetTeacherPlaceholder: '',
      worksheetMailButtonLabel: '',
      worksheetDownloadLabel: '입력한 내용으로 PDF 내려받기',
      worksheetResetLabel: '입력 지우기',
      worksheetEmptyLabel: '이 페이지는 입력칸이 없습니다.',
      worksheetFieldsPattern: '',
      worksheetNotice: '워크북은 페이지별로 따로 열어 입력하고, 입력 내용은 브라우저 안에서만 처리됩니다.',
      worksheetMailHint: '',
      worksheetDownloadBusyLabel: 'PDF 만드는 중...',
      worksheetMailBusyLabel: '',
      worksheetMailFallbackLabel: '',
      worksheetAddTextLabel: '',
      worksheetAddNoteLabel: '메모 칸 추가',
      worksheetArrangeLabel: '메모칸 조정',
      worksheetDrawHint: '메모 칸은 드래그해서 만들고, 그리기·체크는 페이지 위에 바로 표시할 수 있습니다.',
      worksheetRemoveFieldLabel: '직접 만든 입력칸 삭제',
      worksheetActivityFactLabel: '활동',
      worksheetInputFactLabel: '',
      worksheetPageTitlePattern: '{page} 입력',
      worksheetDrawLabel: '그리기',
      worksheetCheckLabel: '체크 표시',
      worksheetClearInkLabel: '표시 지우기',
    },
    en: {
      menuLabel: 'Menu',
      previewLabel: 'Core Summary',
      pagesLabel: 'Pages',
      pageModalTitle: 'Page',
      pagePrevLabel: 'Previous page',
      pageNextLabel: 'Next page',
      pagePositionPattern: '{current} / {total}',
      keywordModalTitle: 'Keyword',
      closeLabel: 'Close',
      keywordExcerptLabel: 'Source Evidence',
      keywordUsedLabel: 'Used in source',
      pagesFactLabel: 'Pages',
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
      worksheetOpenLabel: 'Direct input',
      worksheetSharedLabel: 'Shared info',
      worksheetPagesLabel: 'Page-by-page input',
      worksheetTeacherLabel: '',
      worksheetTeacherPlaceholder: '',
      worksheetMailButtonLabel: '',
      worksheetDownloadLabel: 'Download filled PDF',
      worksheetResetLabel: 'Clear inputs',
      worksheetEmptyLabel: 'This page has no editable area.',
      worksheetFieldsPattern: '',
      worksheetNotice: 'Open each workbook page separately and keep input work inside the browser until export.',
      worksheetMailHint: '',
      worksheetDownloadBusyLabel: 'Building PDF...',
      worksheetMailBusyLabel: '',
      worksheetMailFallbackLabel: '',
      worksheetAddTextLabel: '',
      worksheetAddNoteLabel: 'Add note box',
      worksheetArrangeLabel: 'Arrange note boxes',
      worksheetDrawHint: 'Drag to place note boxes, or draw and drop check marks directly on the page.',
      worksheetRemoveFieldLabel: 'Remove custom input box',
      worksheetActivityFactLabel: 'Activity',
      worksheetInputFactLabel: '',
      worksheetPageTitlePattern: '{page} input',
      worksheetDrawLabel: 'Draw',
      worksheetCheckLabel: 'Check mark',
      worksheetClearInkLabel: 'Clear marks',
    },
  };

  const normalizeUi = (ui = {}) => {
    const defaults = UI_DEFAULTS[lang];
    const merged = { ...defaults, ...(ui || {}) };
    const legacyOpenLabels = new Set(['학생 입력 열기', '직접 입력써보기', 'Open workbook input', 'Try typing directly']);
    if (!merged.worksheetOpenLabel || legacyOpenLabels.has(merged.worksheetOpenLabel)) {
      merged.worksheetOpenLabel = defaults.worksheetOpenLabel;
    }
    if (['페이지 원본 보기', 'Source Pages'].includes(merged.pagesLabel)) {
      merged.pagesLabel = defaults.pagesLabel;
    }
    if (['페이지 원본', 'Source Page'].includes(merged.pageModalTitle)) {
      merged.pageModalTitle = defaults.pageModalTitle;
    }
    if (['원본 범위', 'Source pages'].includes(merged.pagesFactLabel)) {
      merged.pagesFactLabel = defaults.pagesFactLabel;
    }
    if (['입력칸 {count}개', '{count} fields'].includes(merged.worksheetFieldsPattern)) {
      merged.worksheetFieldsPattern = defaults.worksheetFieldsPattern;
    }
    if (merged.worksheetMailHint) {
      merged.worksheetMailHint = '';
    }
    return merged;
  };

  data.ui = normalizeUi(data.ui);

  const reportGroup = /elementary/i.test(workbookReportKey) ? 'elementary' : /secondary/i.test(workbookReportKey) ? 'secondary' : '';
  const isGuideReport = /-main$/i.test(workbookReportKey);
  const reportKind = workbookReportKey || 'root';
  const reportLabels = {
    elementary: lang === 'ko' ? '초등' : 'Elementary',
    secondary: lang === 'ko' ? '중등' : 'Secondary',
  };
  const TITLE_PRESETS = {
    root: {
      ko: {
        eyebrow: 'AI교육 2.0',
        brandTitle: 'AI교육 2.0',
        brandSubtitle: '미래 교육의 새로운 패러다임',
        heroTitle: '미래 교육의 새로운 패러다임',
        heroSubtitle: 'AI교육 2.0',
        heroDescription: '',
      },
      en: {
        eyebrow: 'AI Education 2.0',
        brandTitle: 'AI Education 2.0',
        brandSubtitle: 'A New Paradigm for Future Education',
        heroTitle: 'A New Paradigm for Future Education',
        heroSubtitle: 'AI Education 2.0',
        heroDescription: '',
      },
    },
    'elementary-main': {
      ko: {
        eyebrow: '협력 가이드(초등)',
        brandTitle: '생성형 AI, 교실 속 협력 파트너(초등)',
        brandSubtitle: '미래 교육의 새로운 패러다임',
        heroTitle: '미래 교육의 새로운 패러다임',
        heroSubtitle: '생성형 AI, 교실 속 협력 파트너(초등)',
        heroDescription: '초등 수업에서 생성형 AI를 협력 파트너로 활용하는 흐름을 이론, 활동, 사례 중심으로 살펴볼 수 있습니다.',
      },
      en: {
        eyebrow: 'Guide (Elementary)',
        brandTitle: 'Generative AI, a Collaborative Partner in the Classroom (Elementary)',
        brandSubtitle: 'A New Paradigm for Future Education',
        heroTitle: 'A New Paradigm for Future Education',
        heroSubtitle: 'Generative AI, a Collaborative Partner in the Classroom (Elementary)',
        heroDescription: 'Explore how generative AI can work as a classroom partner in elementary teaching through theory, activities, and lesson examples.',
      },
    },
    'elementary-workbook': {
      ko: {
        eyebrow: '협력 워크북(초등)',
        brandTitle: '생성형 AI, 교실 속 협력 파트너(초등 워크북)',
        brandSubtitle: '미래 교육의 새로운 패러다임',
        heroTitle: '미래 교육의 새로운 패러다임',
        heroSubtitle: '생성형 AI, 교실 속 협력 파트너(초등 워크북)',
        heroDescription: '초등 활동지를 한 페이지씩 넘기며 바로 입력하고, 메모와 그리기, 체크 표시까지 함께 정리할 수 있습니다.',
      },
      en: {
        eyebrow: 'Workbook (Elementary)',
        brandTitle: 'Generative AI, a Collaborative Partner in the Classroom (Elementary Workbook)',
        brandSubtitle: 'A New Paradigm for Future Education',
        heroTitle: 'A New Paradigm for Future Education',
        heroSubtitle: 'Generative AI, a Collaborative Partner in the Classroom (Elementary Workbook)',
        heroDescription: 'Move through the elementary workbook one page at a time and complete notes, drawing, and check marks directly in place.',
      },
    },
    'secondary-main': {
      ko: {
        eyebrow: '협력 가이드(중등)',
        brandTitle: '생성형 AI, 교실 속 협력 파트너(중등)',
        brandSubtitle: '미래 교육의 새로운 패러다임',
        heroTitle: '미래 교육의 새로운 패러다임',
        heroSubtitle: '생성형 AI, 교실 속 협력 파트너(중등)',
        heroDescription: '중등 수업에서 생성형 AI를 협력 파트너로 활용하는 흐름을 이론, 활동, 사례 중심으로 살펴볼 수 있습니다.',
      },
      en: {
        eyebrow: 'Guide (Secondary)',
        brandTitle: 'Generative AI, a Collaborative Partner in the Classroom (Secondary)',
        brandSubtitle: 'A New Paradigm for Future Education',
        heroTitle: 'A New Paradigm for Future Education',
        heroSubtitle: 'Generative AI, a Collaborative Partner in the Classroom (Secondary)',
        heroDescription: 'Explore how generative AI can work as a classroom partner in secondary teaching through theory, activities, and lesson examples.',
      },
    },
    'secondary-workbook': {
      ko: {
        eyebrow: '협력 워크북(중등)',
        brandTitle: '생성형 AI, 교실 속 협력 파트너(중등 워크북)',
        brandSubtitle: '미래 교육의 새로운 패러다임',
        heroTitle: '미래 교육의 새로운 패러다임',
        heroSubtitle: '생성형 AI, 교실 속 협력 파트너(중등 워크북)',
        heroDescription: '중등 활동지를 한 페이지씩 넘기며 바로 입력하고, 메모와 그리기, 체크 표시까지 함께 정리할 수 있습니다.',
      },
      en: {
        eyebrow: 'Workbook (Secondary)',
        brandTitle: 'Generative AI, a Collaborative Partner in the Classroom (Secondary Workbook)',
        brandSubtitle: 'A New Paradigm for Future Education',
        heroTitle: 'A New Paradigm for Future Education',
        heroSubtitle: 'Generative AI, a Collaborative Partner in the Classroom (Secondary Workbook)',
        heroDescription: 'Move through the secondary workbook one page at a time and complete notes, drawing, and check marks directly in place.',
      },
    },
  };
  const sanitizeLead = (value = '') => {
    const text = String(value || '').trim();
    if (!text) {
      return '';
    }
    const generatedPatterns = [
      /압축해 설명합니다/,
      /^focuses on\b/i,
      /to explain the main claim/i,
      /섹션별로 다시 잘라/,
      /다시 묶었/,
      /reconstructs the translated report/i,
      /원문 페이지를 그대로 붙여/i,
      /whole report can be reviewed/i,
      /개발자/i,
      /프롬프트 흔적/i,
    ];
    if (generatedPatterns.some((pattern) => pattern.test(text))) {
      return '';
    }
    return text;
  };
  const cleanLeadList = (list = []) => list.map((entry) => sanitizeLead(entry)).filter(Boolean);
  const serializePageSet = (pages = []) =>
    encodeURIComponent(
      JSON.stringify(
        (pages || []).map((page) => ({
          src: page.src || '',
          title: page.title || page.label || '',
          label: page.label || '',
        }))
      )
    );
  const findReportSwitch = (patterns = []) =>
    (data.reportSwitches || []).find((item) => patterns.some((pattern) => pattern.test(String(item?.label || ''))));
  const aiArchiveSwitch = findReportSwitch([/AI교육\s*2\.0/i, /AI Ed/i, /AI Education/i]);
  const elementaryGuideSwitch = findReportSwitch([/초등편 본문/i, /Elem Guide/i, /협력 가이드\(초등\)/i]);
  const secondaryGuideSwitch = findReportSwitch([/중등편 본문/i, /Sec Guide/i, /협력 가이드\(중등\)/i]);
  const archiveHref = aiArchiveSwitch?.href || 'index.html';
  const globalInfoHref = /index\.html$/i.test(archiveHref) ? archiveHref.replace(/index\.html$/i, 'info/index.html') : data.infoLink?.href || 'info/index.html';
  const reportSwitchItems = [
    {
      label: lang === 'ko' ? 'AI교육 2.0' : 'AI Education 2.0',
      href: aiArchiveSwitch?.href || (lang === 'ko' ? 'index.html' : '../index.html'),
      active: !reportGroup,
    },
    {
      label: lang === 'ko' ? '협력 가이드(초등)' : 'Guide (Elementary)',
      href: elementaryGuideSwitch?.href || '../elementary-main/index.html',
      active: reportGroup === 'elementary',
    },
    {
      label: lang === 'ko' ? '협력 가이드(중등)' : 'Guide (Secondary)',
      href: secondaryGuideSwitch?.href || '../secondary-main/index.html',
      active: reportGroup === 'secondary',
    },
  ];
  const workbookShortcutHref = reportGroup ? `../${reportGroup}-workbook/index.html` : '';
  const guideShortcutHref = reportGroup ? `../${reportGroup}-main/index.html` : '';
  const reportTitlePreset = TITLE_PRESETS[reportKind]?.[lang] || TITLE_PRESETS.root[lang];
  data.brand = {
    ...(data.brand || {}),
    title: reportTitlePreset.brandTitle,
    subtitle: reportTitlePreset.brandSubtitle,
  };
  data.hero = {
    ...(data.hero || {}),
    eyebrow: reportTitlePreset.eyebrow,
    title: reportTitlePreset.heroTitle,
    subtitle: reportTitlePreset.heroSubtitle,
    strapline: '',
    description: reportTitlePreset.heroDescription || '',
  };
  data.infoLink = {
    href: globalInfoHref,
    label: data.ui.infoLabel,
  };
  data.footer = '';
  const heroActions = (() => {
    const firstTarget = (data.nav || [])[0]?.target;
    const items = firstTarget ? [{ href: `#${firstTarget}`, label: data.ui.browseLabel }] : [];
    if (isGuideReport && workbookShortcutHref) {
      items.push({
        href: workbookShortcutHref,
        label: lang === 'ko' ? `협력 워크북(${reportLabels[reportGroup]})` : `Workbook (${reportLabels[reportGroup]})`,
      });
    } else if (reportGroup && guideShortcutHref) {
      items.push({
        href: guideShortcutHref,
        label: lang === 'ko' ? `협력 가이드(${reportLabels[reportGroup]})` : `Guide (${reportLabels[reportGroup]})`,
      });
    } else if (globalInfoHref) {
      items.push({ href: globalInfoHref, label: data.ui.infoLabel });
    }
    return items.slice(0, 2);
  })();

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
        (page, index, list) => `
          <button class="thumb-button page-trigger" type="button" data-src="${esc(page.src)}" data-title="${esc(page.title || page.label)}" data-page-set="${esc(serializePageSet(list))}" data-page-index="${index}">
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
  const pagePreviewStore = new Map();
  let pagePreviewSeed = 0;
  const WORKSHEET_REMOVED_KEYS = new Set(['student_class', 'student_name']);
  const worksheetRowFields = (rows = [], x = 0, w = 0.6, h = 0.04, kind = 'textarea') =>
    rows.map((y) => ({ kind, x, y, w, h }));
  const worksheetPairFields = (rows = [], left = {}, right = {}) =>
    rows.flatMap((row) => [
      { kind: left.kind || 'text', x: left.x, y: row.y, w: left.w, h: row.h || left.h },
      { kind: right.kind || 'textarea', x: right.x, y: row.y, w: right.w, h: row.h || right.h },
    ]);
  const WORKSHEET_PAGE_OVERRIDES = {
    'secondary-workbook': {
      7: {
        append: [
          { kind: 'textarea', x: 0.2915, y: 0.235, w: 0.555, h: 0.045 },
          { kind: 'textarea', x: 0.2915, y: 0.283, w: 0.555, h: 0.045 },
          { kind: 'textarea', x: 0.2915, y: 0.331, w: 0.555, h: 0.045 },
          { kind: 'textarea', x: 0.2915, y: 0.379, w: 0.555, h: 0.045 },
          { kind: 'textarea', x: 0.152, y: 0.791, w: 0.694, h: 0.061 },
          { kind: 'textarea', x: 0.152, y: 0.888, w: 0.694, h: 0.061 },
        ],
      },
      8: {
        replace: [0.249, 0.291, 0.333, 0.375, 0.417].map((y) => ({ kind: 'choice', x: 0.565, y, w: 0.26, h: 0.028, options: ['1', '2', '3'] })),
      },
      10: {
        replace: [
          { kind: 'text', x: 0.162, y: 0.205, w: 0.69, h: 0.042 },
          { kind: 'textarea', x: 0.162, y: 0.319, w: 0.69, h: 0.055 },
          { kind: 'textarea', x: 0.163, y: 0.486, w: 0.28, h: 0.165 },
          { kind: 'textarea', x: 0.162, y: 0.848, w: 0.69, h: 0.052 },
        ],
      },
      17: {
        replace: [0.241, 0.281, 0.321, 0.361, 0.401, 0.61, 0.65, 0.69, 0.73, 0.77].map((y) => ({ kind: 'choice', x: 0.457, y, w: 0.38, h: 0.027, options: ['1', '2', '3', '4', '5'] })),
      },
      22: {
        replace: [
          { kind: 'text', x: 0.309, y: 0.246, w: 0.23, h: 0.022 },
          { kind: 'text', x: 0.309, y: 0.283, w: 0.23, h: 0.022 },
          { kind: 'text', x: 0.309, y: 0.32, w: 0.23, h: 0.022 },
          { kind: 'textarea', x: 0.152, y: 0.419, w: 0.695, h: 0.145 },
        ],
      },
      24: {
        replace: worksheetRowFields([0.274, 0.319, 0.364, 0.409, 0.454, 0.499, 0.544, 0.589], 0.328, 0.515, 0.03, 'text').concat([
          { kind: 'textarea', x: 0.266, y: 0.71, w: 0.58, h: 0.066 },
          { kind: 'textarea', x: 0.266, y: 0.841, w: 0.58, h: 0.066 },
        ]),
      },
      35: {
        replace: [
          { kind: 'textarea', x: 0.252, y: 0.161, w: 0.595, h: 0.12 },
          { kind: 'textarea', x: 0.286, y: 0.472, w: 0.56, h: 0.09 },
          { kind: 'textarea', x: 0.286, y: 0.583, w: 0.56, h: 0.09 },
          { kind: 'textarea', x: 0.286, y: 0.694, w: 0.56, h: 0.09 },
        ],
      },
      42: {
        replace: [
          { kind: 'text', x: 0.267, y: 0.198, w: 0.58, h: 0.033 },
          { kind: 'text', x: 0.267, y: 0.253, w: 0.58, h: 0.033 },
          { kind: 'text', x: 0.267, y: 0.356, w: 0.58, h: 0.027 },
          { kind: 'text', x: 0.267, y: 0.408, w: 0.58, h: 0.027 },
          { kind: 'text', x: 0.267, y: 0.459, w: 0.58, h: 0.027 },
          { kind: 'textarea', x: 0.267, y: 0.577, w: 0.58, h: 0.094 },
          { kind: 'choice', x: 0.271, y: 0.763, w: 0.024, h: 0.024, options: ['O'] },
          { kind: 'choice', x: 0.271, y: 0.802, w: 0.024, h: 0.024, options: ['O'] },
          { kind: 'textarea', x: 0.267, y: 0.827, w: 0.58, h: 0.05 },
          { kind: 'textarea', x: 0.267, y: 0.902, w: 0.58, h: 0.05 },
        ],
      },
      44: {
        replace: [
          { kind: 'text', x: 0.15, y: 0.316, w: 0.695, h: 0.034 },
          { kind: 'text', x: 0.152, y: 0.475, w: 0.695, h: 0.042 },
          { kind: 'textarea', x: 0.152, y: 0.564, w: 0.695, h: 0.151 },
          { kind: 'textarea', x: 0.152, y: 0.831, w: 0.695, h: 0.067 },
        ],
      },
      45: {
        replace: [
          { kind: 'text', x: 0.266, y: 0.191, w: 0.58, h: 0.033 },
          { kind: 'text', x: 0.266, y: 0.295, w: 0.58, h: 0.033 },
          { kind: 'text', x: 0.266, y: 0.399, w: 0.58, h: 0.033 },
          { kind: 'text', x: 0.266, y: 0.504, w: 0.58, h: 0.033 },
          { kind: 'textarea', x: 0.152, y: 0.648, w: 0.695, h: 0.276 },
        ],
      },
      77: {
        replace: [
          { kind: 'text', x: 0.595, y: 0.171, w: 0.25, h: 0.033 },
          ...worksheetPairFields(
            [
              { y: 0.315, h: 0.053 },
              { y: 0.379, h: 0.053 },
              { y: 0.443, h: 0.053 },
            ],
            { x: 0.167, w: 0.147, kind: 'text' },
            { x: 0.324, w: 0.522, kind: 'textarea' }
          ),
          ...worksheetPairFields(
            [
              { y: 0.575, h: 0.053 },
              { y: 0.639, h: 0.053 },
              { y: 0.703, h: 0.053 },
              { y: 0.767, h: 0.053 },
            ],
            { x: 0.167, w: 0.147, kind: 'text' },
            { x: 0.324, w: 0.522, kind: 'textarea' }
          ),
          { kind: 'text', x: 0.321, y: 0.854, w: 0.524, h: 0.041 },
        ],
      },
      82: {
        replace: worksheetPairFields(
          [
            { y: 0.247, h: 0.123 },
            { y: 0.383, h: 0.123 },
            { y: 0.565, h: 0.123 },
            { y: 0.746, h: 0.123 },
          ],
          { x: 0.152, w: 0.102, kind: 'text' },
          { x: 0.271, w: 0.575, kind: 'textarea' }
        ),
      },
      108: {
        replace: [
          { kind: 'text', x: 0.267, y: 0.265, w: 0.577, h: 0.03 },
          { kind: 'text', x: 0.267, y: 0.306, w: 0.577, h: 0.03 },
          { kind: 'textarea', x: 0.271, y: 0.401, w: 0.574, h: 0.048 },
          { kind: 'text', x: 0.152, y: 0.532, w: 0.313, h: 0.037 },
          { kind: 'text', x: 0.466, y: 0.532, w: 0.379, h: 0.037 },
          { kind: 'textarea', x: 0.152, y: 0.693, w: 0.313, h: 0.139 },
          { kind: 'textarea', x: 0.466, y: 0.693, w: 0.379, h: 0.139 },
        ],
      },
    },
    'elementary-workbook': {
      17: {
        replace: [
          { kind: 'choice', x: 0.214, y: 0.304, w: 0.42, h: 0.034, options: ['1', '2', '3', '4', '5'] },
          ...worksheetRowFields([0.445, 0.499, 0.552, 0.606, 0.659, 0.712, 0.765, 0.818], 0.375, 0.468, 0.028, 'text'),
        ],
      },
      19: {
        replace: [
          { kind: 'textarea', x: 0.152, y: 0.214, w: 0.695, h: 0.505 },
          { kind: 'choice', x: 0.214, y: 0.852, w: 0.42, h: 0.038, options: ['1', '2', '3', '4', '5'] },
        ],
      },
      20: {
        replace: worksheetRowFields([0.168, 0.25, 0.332, 0.414, 0.496, 0.578, 0.66, 0.742, 0.824], 0.268, 0.578, 0.032, 'text'),
      },
      21: {
        replace: [
          { kind: 'choice', x: 0.214, y: 0.849, w: 0.42, h: 0.038, options: ['1', '2', '3', '4', '5'] },
        ],
      },
      24: {
        replace: worksheetRowFields([0.164, 0.248, 0.332, 0.416], 0.267, 0.578, 0.034, 'text'),
      },
      43: {
        replace: [
          { kind: 'text', x: 0.323, y: 0.315, w: 0.522, h: 0.028 },
          { kind: 'text', x: 0.323, y: 0.358, w: 0.522, h: 0.028 },
          ...worksheetRowFields([0.41, 0.455, 0.5], 0.548, 0.298, 0.026, 'text'),
          { kind: 'textarea', x: 0.151, y: 0.634, w: 0.438, h: 0.077 },
          { kind: 'choice', x: 0.591, y: 0.634, w: 0.115, h: 0.03, options: ['타당하다', '믿을 수 있다'] },
          { kind: 'textarea', x: 0.151, y: 0.71, w: 0.438, h: 0.077 },
          { kind: 'choice', x: 0.591, y: 0.71, w: 0.115, h: 0.03, options: ['타당하다', '믿을 수 있다'] },
          { kind: 'textarea', x: 0.151, y: 0.842, w: 0.347, h: 0.088 },
          { kind: 'textarea', x: 0.5, y: 0.842, w: 0.347, h: 0.088 },
        ],
      },
      44: {
        replace: [
          ...[0.304, 0.333, 0.362].map((y) => ({ kind: 'choice', x: 0.291, y, w: 0.03, h: 0.022, options: ['O'] })),
          { kind: 'textarea', x: 0.293, y: 0.44, w: 0.553, h: 0.11 },
          { kind: 'textarea', x: 0.293, y: 0.584, w: 0.553, h: 0.11 },
          ...[0.634, 0.687, 0.74].flatMap((y) =>
            [0.555, 0.617, 0.679, 0.741, 0.803].map((x) => ({ kind: 'choice', x, y, w: 0.03, h: 0.028, options: ['O'] }))
          ),
          { kind: 'textarea', x: 0.383, y: 0.824, w: 0.463, h: 0.135 },
        ],
      },
      48: {
        replace: [
          { kind: 'textarea', x: 0.152, y: 0.315, w: 0.695, h: 0.116 },
          { kind: 'textarea', x: 0.152, y: 0.514, w: 0.695, h: 0.11 },
          ...[0.739, 0.774, 0.808, 0.842, 0.876].map((y) => ({ kind: 'choice', x: 0.782, y, w: 0.04, h: 0.022, options: ['O'] })),
        ],
      },
      55: {
        replace: [
          ...[0.419, 0.454, 0.49, 0.603, 0.638, 0.674].map((y) => ({ kind: 'choice', x: 0.214, y, w: 0.03, h: 0.024, options: ['O'] })),
          { kind: 'textarea', x: 0.151, y: 0.75, w: 0.347, h: 0.11 },
          { kind: 'textarea', x: 0.5, y: 0.75, w: 0.347, h: 0.11 },
          { kind: 'textarea', x: 0.151, y: 0.901, w: 0.228, h: 0.078 },
          { kind: 'textarea', x: 0.381, y: 0.901, w: 0.227, h: 0.078 },
          { kind: 'textarea', x: 0.61, y: 0.901, w: 0.236, h: 0.078 },
        ],
      },
      62: {
        replace: worksheetPairFields(
          [
            { y: 0.236, h: 0.118 },
            { y: 0.38, h: 0.118 },
            { y: 0.523, h: 0.118 },
            { y: 0.667, h: 0.118 },
            { y: 0.811, h: 0.118 },
          ],
          { x: 0.152, w: 0.314, kind: 'textarea' },
          { x: 0.467, w: 0.379, kind: 'textarea' }
        ),
      },
    },
  };

  const registerWorksheet = (worksheet = {}) => {
    if (!worksheet.pages || !worksheet.pages.length) {
      return '';
    }
    const key = `worksheet-${worksheetSeed++}`;
    worksheetStore.set(key, worksheet);
    return key;
  };

  const registerPagePreview = (pages = []) => {
    if (!pages.length) {
      return '';
    }
    const key = `page-preview-${pagePreviewSeed++}`;
    pagePreviewStore.set(key, pages);
    return key;
  };

  const keepWorksheetField = (field = {}) => !WORKSHEET_REMOVED_KEYS.has(String(field.key || '').trim());

  const normalizeWorksheetSharedFields = (fields = []) =>
    fields
      .filter(keepWorksheetField)
      .map((field, fieldIndex) => ({
        ...field,
        key: field.key || `shared-${fieldIndex}`,
        kind: field.kind || 'text',
      }));

  const normalizeWorksheetPage = (page = {}) => {
    const filteredFields = (page.fields || []).filter(keepWorksheetField);
    const pageOverride = ((WORKSHEET_PAGE_OVERRIDES[workbookReportKey] || {})[page.pageNumber]) || {};
    const replaceFields = (pageOverride.replace || []).map((field, fieldIndex) => ({
      ...field,
      id: field.id || `p${page.pageNumber}-replace-${fieldIndex}`,
      kind: field.kind || 'textarea',
    }));
    const overrideFields = (pageOverride.append || []).map((field, fieldIndex) => ({
      ...field,
      id: field.id || `p${page.pageNumber}-extra-${fieldIndex}`,
      kind: field.kind || 'textarea',
    }));
    const baseFields = (pageOverride.replace ? replaceFields : filteredFields).map((field, fieldIndex) => ({
      ...field,
      id: field.id || `p${page.pageNumber}-f${fieldIndex}`,
      kind: field.kind || 'textarea',
    }));
    return {
      ...page,
      sharedFields: normalizeWorksheetSharedFields(page.sharedFields || []),
      fields: baseFields.concat(pageOverride.replace ? [] : overrideFields),
    };
  };

  const normalizeSections = (sections = []) =>
    sections
      .map((section) => {
        if (!isWorkbookReport) {
          return {
            ...section,
            description: '',
            items: (section.items || []).map((item) => ({
              ...item,
              lead: cleanLeadList(item.lead || []),
              tags: enrichTags(item, section),
            })),
          };
        }

      const items = (section.items || []).flatMap((item) => {
        const worksheetSharedFields = normalizeWorksheetSharedFields(item.worksheet?.sharedFields || []);
        const worksheetPages = (item.worksheet?.pages || []).map((page) => normalizeWorksheetPage(page)).filter((page) => (page.fields || []).length);
        if (!worksheetPages.length) {
          return [];
        }

        return worksheetPages.map((page) => ({
          ...item,
          title: item.title,
          lead: cleanLeadList(item.lead || []),
          pageLabel: page.label || `PDF ${page.pageNumber}`,
          range: page.label || `PDF ${page.pageNumber}`,
          isWorkbookItem: true,
          tags: enrichTags({ ...item, pageLabel: page.label || `PDF ${page.pageNumber}` }, section),
          facts: [
            { label: data.ui.worksheetActivityFactLabel, value: item.title },
          ],
          pages: [pageRef(page, item.title)],
          worksheetKey: registerWorksheet({
            title: `${item.title} - ${page.label || `PDF ${page.pageNumber}`}`,
            sharedFields: page.sharedFields?.length ? page.sharedFields : worksheetSharedFields,
            pages: [page],
          }),
        }));
      });
      return {
        ...section,
        description: '',
        isWorkbookSection: true,
        meta: [
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
    const fieldKind = field.kind || 'text';
    const fieldLabel = field.label || `${page.label || 'Page'} input ${fieldIndex + 1}`;
    const baseAttrs = [
      `data-field-id="${esc(field.id || `p${pageIndex}-f${fieldIndex}`)}"`,
      `data-field-label="${esc(field.label || '')}"`,
      `data-field-key="${esc(field.key || '')}"`,
      `data-field-kind="${esc(fieldKind)}"`,
      `data-x="${esc(field.x || 0)}"`,
      `data-y="${esc(field.y || 0)}"`,
      `data-w="${esc(field.w || 0)}"`,
      `data-h="${esc(field.h || 0)}"`,
      `data-page-number="${esc(page.pageNumber || '')}"`,
      `aria-label="${esc(fieldLabel)}"`,
    ];
    if (fieldKind === 'choice') {
      const options = (field.options || []).map((option) => String(option));
      return `
        <div class="worksheet-choice-shell" data-choice-count="${options.length}" style="${style}">
          <input class="worksheet-input is-choice-value" style="--x:0%; --y:0%; --w:100%; --h:100%;" ${baseAttrs.join(' ')} type="text" readonly />
          <div class="worksheet-choice${options.length === 1 ? ' is-single' : ''}" role="group" aria-label="${esc(fieldLabel)}">
            ${options
              .map(
                (option) =>
                  `<button class="worksheet-choice-option${options.length === 1 ? ' is-single' : ''}" type="button" data-choice-value="${esc(option)}" aria-pressed="false">${esc(option)}</button>`
              )
              .join('')}
          </div>
        </div>
      `;
    }
    const attrs = [
      `class="worksheet-input ${fieldKind === 'textarea' ? 'is-textarea' : 'is-text'}"`,
      `style="${style}"`,
      ...baseAttrs,
      `placeholder="${esc(field.label || '')}"`,
    ].join(' ');
    if (fieldKind === 'textarea') {
      return `<textarea ${attrs}></textarea>`;
    }
    return `<input ${attrs} type="text" />`;
  };

  const renderWorksheetEditor = (worksheet = {}, ui) => {
    if (!worksheet || !worksheet.pages || !worksheet.pages.length) {
      return '';
    }
    const openIndex = Math.max(0, worksheet.pages.findIndex((page) => (page.fields || []).length));
    const sharedFields = worksheet.sharedFields || [];
    return `
      <div class="worksheet-editor" data-worksheet-title="${esc(worksheet.title || ui.worksheetLabel)}">
        <div class="worksheet-toolbar">
          <div class="worksheet-copy">
            <strong>${esc(ui.worksheetLabel)}</strong>
            <p>${esc(ui.worksheetNotice)}</p>
          </div>
          <div class="worksheet-toolbar-actions">
            <button class="worksheet-reset" type="button">${esc(ui.worksheetResetLabel)}</button>
            <button class="worksheet-download" type="button">${esc(ui.worksheetDownloadLabel)}</button>
          </div>
        </div>
        ${
          sharedFields.length
            ? `
              <section class="worksheet-shared-panel">
                <div class="worksheet-panel-title">${esc(ui.worksheetSharedLabel)}</div>
                <div class="worksheet-shared-grid">
                  ${sharedFields
                    .map(
                      (field) => `
                        <label class="worksheet-shared-field">
                          <span>${esc(field.label)}</span>
                          <input type="text" data-shared-key="${esc(field.key)}" data-shared-label="${esc(field.label)}" />
                        </label>
                      `
                    )
                    .join('')}
                </div>
              </section>
            `
            : ''
        }
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
                    </summary>
                    <article class="worksheet-page" data-page-number="${esc(page.pageNumber)}" data-page-width="${esc(page.width)}" data-page-height="${esc(page.height)}" data-page-src="${esc(page.src)}" data-page-label="${esc(page.label || `PDF ${page.pageNumber}`)}">
                      <div class="worksheet-page-tools">
                        <div class="worksheet-page-actions">
                          <button class="worksheet-field-add" type="button" data-field-kind="textarea" aria-pressed="false">${esc(ui.worksheetAddNoteLabel)}</button>
                          <button class="worksheet-layout-toggle" type="button" aria-pressed="false">${esc(ui.worksheetArrangeLabel)}</button>
                          <button class="worksheet-tool-toggle" type="button" data-tool-kind="draw" aria-pressed="false">${esc(ui.worksheetDrawLabel)}</button>
                          <button class="worksheet-tool-toggle" type="button" data-tool-kind="check" aria-pressed="false">${esc(ui.worksheetCheckLabel)}</button>
                          <button class="worksheet-tool-clear" type="button">${esc(ui.worksheetClearInkLabel)}</button>
                        </div>
                        <p class="worksheet-page-hint">${esc(ui.worksheetDrawHint)}</p>
                      </div>
                      <div class="worksheet-canvas" style="--page-ratio:${esc(page.width)} / ${esc(page.height)};">
                        <img src="${esc(page.src)}" alt="${esc(page.label || `PDF ${page.pageNumber}`)}" loading="lazy" />
                        <canvas class="worksheet-ink-layer" aria-hidden="true"></canvas>
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

  const renderPageDetails = (pages = [], ui, rgb, open = false) => {
    if (!pages.length) {
      return '';
    }
    const previewKey = registerPagePreview(pages);
    if (!previewKey) {
      return '';
    }
    return `
      <details class="page-details" style="--rgb:${rgb}" data-preview-key="${esc(previewKey)}"${open ? ' open' : ''}>
        <summary>${esc(ui.pagesLabel)}</summary>
        <div class="thumb-grid" data-page-preview-shell></div>
      </details>
    `;
  };

  const renderItem = (item, ui, rgb, options = {}) => {
    const visibleFacts = (item.facts || []).filter((fact) => fact.label !== data.ui.pagesFactLabel && fact.label !== data.ui.worksheetInputFactLabel);
    const leadItems = (item.lead || []).filter(Boolean);
    const tagItems = item.tags || [];
    return `
    <article class="content-card search-card${item.isWorkbookItem ? ' is-workbook-card' : ''}" style="--rgb:${rgb}" data-search="${esc(itemSearchBlob(item))}">
      <div class="card-head">
        <div>
          ${item.pageLabel ? `<p class="card-eyebrow search-text">${esc(item.pageLabel)}</p>` : ''}
          <h3 class="search-text">${esc(item.title)}</h3>
        </div>
        <div class="range-pill">${esc(item.range)}</div>
      </div>
      <div class="card-body">
        ${
          leadItems.length || tagItems.length
            ? `<div class="lead-panel">
                ${leadItems.length ? `<h4>${esc(ui.previewLabel)}</h4>` : ''}
                ${leadItems.length ? `<ul class="summary-list">${leadItems.map((para) => `<li class="search-text">${esc(para)}</li>`).join('')}</ul>` : ''}
                ${tagItems.length ? `<div class="card-tags">${renderTagButtons(tagItems)}</div>` : ''}
              </div>`
            : ''
        }
        <div class="fact-panel">
          ${visibleFacts.map((fact) => `<article><span>${esc(fact.label)}</span><strong>${esc(fact.value)}</strong></article>`).join('')}
        </div>
      </div>
      ${renderWorksheetShell(item.worksheetKey || '', ui)}
      ${options.hidePages ? '' : renderPageDetails(item.pages || [], ui, rgb, item.openPages)}
    </article>
  `;
  };

  const renderWorkbookSection = (section, ui) => {
    const items = section.items || [];
    const activeItem = items[0] || {};
    const rgb = section.rgb || data.themeRgb;
    const sectionMeta = (section.meta || []).filter(Boolean);
    return `
      <section class="section-block section search-section is-workbook-section" id="${esc(section.id)}" style="--rgb:${rgb}" data-search="${esc(sectionSearchBlob(section))}">
        <div class="section-intro">
          <p class="kicker search-text">${esc(section.navLabel || section.title)}</p>
          <h2 class="search-text">${esc(section.title)}</h2>
          ${section.description ? `<p class="section-desc search-text">${esc(section.description)}</p>` : ''}
          ${sectionMeta.length ? `<div class="section-meta">${sectionMeta.map((item) => `<span class="search-text">${esc(item)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="workbook-reader" data-workbook-reader>
          <div class="workbook-reader-bar">
            <button class="workbook-reader-button" type="button" data-workbook-direction="-1" aria-label="${esc(workbookNavLabels.prev)}">&larr;</button>
            <div class="workbook-reader-status" aria-live="polite">
              <strong data-workbook-page-label>${esc(activeItem.pageLabel || activeItem.range || section.title)}</strong>
              <span data-workbook-page-count>${items.length ? `1 / ${items.length}` : '0 / 0'}</span>
            </div>
            <button class="workbook-reader-button" type="button" data-workbook-direction="1" aria-label="${esc(workbookNavLabels.next)}">&rarr;</button>
          </div>
          <div class="workbook-reader-jumps">
            ${items
              .map(
                (item, itemIndex) => `
                  <button class="workbook-page-jump-chip${itemIndex === 0 ? ' active' : ''}" type="button" data-workbook-jump="${itemIndex}">${esc(item.pageLabel || item.range || String(itemIndex + 1))}</button>
                `
              )
              .join('')}
          </div>
          <div class="card-grid workbook-card-grid">
            ${items
              .map(
                (item, itemIndex) => `
                  <div class="workbook-page-panel${itemIndex === 0 ? ' is-active' : ''}" data-workbook-page="${itemIndex}" data-workbook-label="${esc(item.pageLabel || item.range || item.title)}">
                    ${renderItem(item, ui, rgb, { hidePages: true })}
                  </div>
                `
              )
              .join('')}
          </div>
        </div>
      </section>
    `;
  };

  const renderContentSection = (section, ui) => `
    <section class="section-block section search-section${section.isWorkbookSection ? ' is-workbook-section' : ''}" id="${esc(section.id)}" style="--rgb:${section.rgb || data.themeRgb}" data-search="${esc(sectionSearchBlob(section))}">
      <div class="section-intro">
        <p class="kicker search-text">${esc(section.navLabel || section.title)}</p>
        <h2 class="search-text">${esc(section.title)}</h2>
        ${section.description ? `<p class="section-desc search-text">${esc(section.description)}</p>` : ''}
        ${(section.meta || []).filter(Boolean).length ? `<div class="section-meta">${(section.meta || []).filter(Boolean).map((item) => `<span class="search-text">${esc(item)}</span>`).join('')}</div>` : ''}
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
    if (section.isWorkbookSection) {
      return renderWorkbookSection(section, ui);
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
    <div class="page-shell${isWorkbookReport ? ' is-workbook-report' : ''}${reportKind !== 'root' ? ' is-detail-report' : ''}${isGuideReport ? ' is-guide-report' : ''}">
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
              ${renderSwitchItems(reportSwitchItems)}
            </div>
            ${(data.languageSwitches || []).length ? `<div class="switch-row lang-switch-row">${renderSwitchItems(data.languageSwitches || [])}</div>` : ''}
            ${data.infoLink ? `<a class="info-button" href="${esc(data.infoLink.href)}">${esc(data.infoLink.label)}</a>` : ''}
            ${!isWorkbookReport && data.sourcePdf ? `<a class="pdf-button" href="${esc(data.sourcePdf.href)}" target="_blank" rel="noreferrer">${esc(data.sourcePdf.label)}</a>` : ''}
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
            ${data.hero.strapline ? `<p class="hero-subtitle">${esc(data.hero.strapline)}</p>` : ''}
            ${data.hero.description ? `<p class="hero-description">${esc(data.hero.description)}</p>` : ''}
            ${(data.hero.stats || []).length ? `<div class="hero-stats">${(data.hero.stats || []).map((stat) => `<article><span>${esc(stat.label)}</span><strong>${esc(stat.value)}</strong></article>`).join('')}</div>` : ''}
            ${keywordButtons ? `<div class="keyword-bar">${keywordButtons}</div>` : ''}
            <div class="hero-actions">
              ${heroActions
                .map((action, idx) => `<a href="${esc(action.href)}" class="${idx === 0 ? 'primary' : ''}">${esc(action.label)}</a>`)
                .join('')}
            </div>
          </div>
          <aside class="cover-panel">
            <div class="cover-top"><span>${esc(data.hero.coverLabel)}</span><span>${esc(data.hero.coverPageLabel)}</span></div>
            ${isWorkbookReport
              ? `<div class="cover-button cover-static"><img src="${esc(data.hero.cover.src)}" alt="${esc(data.hero.cover.title)}" /></div>`
              : `<button class="cover-button page-trigger" type="button" data-src="${esc(data.hero.cover.src)}" data-title="${esc(data.hero.cover.title)}" data-page-set="${esc(serializePageSet([data.hero.cover]))}" data-page-index="0"><img src="${esc(data.hero.cover.src)}" alt="${esc(data.hero.cover.title)}" /></button>`}
          </aside>
        </section>

        ${(data.sections || []).map((section) => renderSection(section, data.ui)).join('')}

        ${data.footer ? `<section class="footer-note">${esc(data.footer)}</section>` : ''}
      </main>
    </div>

    <div class="modal page-modal" role="dialog" aria-modal="true" aria-labelledby="page-modal-title" aria-hidden="true">
      <div class="modal-panel">
        <div class="modal-top">
          <div class="page-modal-heading">
            <strong class="modal-title" id="page-modal-title">${esc(data.ui.pageModalTitle)}</strong>
            <span class="page-modal-status" hidden></span>
          </div>
          <div class="page-modal-nav" hidden>
            <button class="page-modal-step" type="button" data-page-step="-1" aria-label="${esc(data.ui.pagePrevLabel)}">&larr;</button>
            <button class="page-modal-step" type="button" data-page-step="1" aria-label="${esc(data.ui.pageNextLabel)}">&rarr;</button>
          </div>
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
  const pageModalTitle = pageModal.querySelector('.modal-title');
  const pageModalStatus = pageModal.querySelector('.page-modal-status');
  const pageModalNav = pageModal.querySelector('.page-modal-nav');
  const pageModalSteps = Array.from(pageModal.querySelectorAll('.page-modal-step'));
  const keywordModal = document.querySelector('.keyword-modal');
  const keywordBody = keywordModal.querySelector('.modal-body');
  let pageModalPages = [];
  let pageModalIndex = 0;
  const keywordMap = (data.keywordIndex || data.keywords || []).reduce((map, item) => {
    if (item && item.id) {
      map[item.id] = item;
    }
    return map;
  }, {});

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
    onNextFrame(() => {
      const closeButton = modal.querySelector('.modal-close');
      if (closeButton) {
        closeButton.focus();
      }
    });
  };

  const closeModal = (modal) => {
    const wasOpen = modal.classList.contains('open');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (modal === pageModal) {
      pageModalImg.removeAttribute('src');
      pageModalImg.removeAttribute('alt');
      pageModalPages = [];
      pageModalIndex = 0;
      pageModalNav.hidden = true;
      pageModalStatus.hidden = true;
      pageModalStatus.textContent = '';
    }
    syncModalState();
    if (!wasOpen) {
      return;
    }
    const nextModal = document.querySelector('.modal.open');
    if (nextModal && typeof nextModal.querySelector === 'function') {
      const nextCloseButton = nextModal.querySelector('.modal-close');
      if (nextCloseButton) {
        nextCloseButton.focus();
      }
      modalFocusReturn.delete(modal);
      return;
    }
    const restoreTarget = modalFocusReturn.get(modal);
    if (restoreTarget && typeof restoreTarget.focus === 'function') {
      restoreTarget.focus();
    }
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
    if (pageModal.classList.contains('open') && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      const delta = event.key === 'ArrowLeft' ? -1 : 1;
      const nextIndex = pageModalIndex + delta;
      if (nextIndex >= 0 && nextIndex < pageModalPages.length) {
        pageModalIndex = nextIndex;
        const activePage = pageModalPages[pageModalIndex];
        pageModalImg.src = activePage.src;
        pageModalImg.alt = activePage.title || data.ui.pageModalTitle;
        pageModalTitle.textContent = activePage.title || data.ui.pageModalTitle;
        pageModalStatus.textContent = data.ui.pagePositionPattern.replace('{current}', String(pageModalIndex + 1)).replace('{total}', String(pageModalPages.length));
        pageModalStatus.hidden = pageModalPages.length <= 1;
        pageModalNav.hidden = pageModalPages.length <= 1;
        pageModalSteps.forEach((button) => {
          const step = Number(button.dataset.pageStep || 0);
          const targetIndex = pageModalIndex + step;
          button.disabled = targetIndex < 0 || targetIndex >= pageModalPages.length;
        });
      }
      return;
    }
    if (event.key !== 'Escape') {
      return;
    }
    if (pageModal.classList.contains('open')) {
      closeModal(pageModal);
      return;
    }
    if (keywordModal.classList.contains('open')) {
      closeModal(keywordModal);
      return;
    }
    closeMenu();
  });

  const syncPageModal = () => {
    const activePage = pageModalPages[pageModalIndex] || {};
    pageModalImg.src = activePage.src || '';
    pageModalImg.alt = activePage.title || data.ui.pageModalTitle;
    pageModalTitle.textContent = activePage.title || data.ui.pageModalTitle;
    pageModalStatus.textContent = data.ui.pagePositionPattern.replace('{current}', String(pageModalIndex + 1)).replace('{total}', String(pageModalPages.length || 1));
    pageModalStatus.hidden = pageModalPages.length <= 1;
    pageModalNav.hidden = pageModalPages.length <= 1;
    pageModalSteps.forEach((button) => {
      const step = Number(button.dataset.pageStep || 0);
      const targetIndex = pageModalIndex + step;
      button.disabled = targetIndex < 0 || targetIndex >= pageModalPages.length;
    });
  };

  pageModalSteps.forEach((button) => {
    button.addEventListener('click', () => {
      const step = Number(button.dataset.pageStep || 0);
      const nextIndex = pageModalIndex + step;
      if (nextIndex < 0 || nextIndex >= pageModalPages.length) {
        return;
      }
      pageModalIndex = nextIndex;
      syncPageModal();
    });
  });

  const openPageModal = (button) => {
    try {
      pageModalPages = JSON.parse(decodeURIComponent(button.dataset.pageSet || '')) || [];
    } catch (error) {
      pageModalPages = [];
    }
    if (!pageModalPages.length) {
      pageModalPages = [
        {
          src: button.dataset.src || '',
          title: button.dataset.title || data.ui.pageModalTitle,
          label: '',
        },
      ];
    }
    pageModalIndex = clamp(Number(button.dataset.pageIndex || 0), 0, Math.max(pageModalPages.length - 1, 0));
    syncPageModal();
    openModal(pageModal, button);
  };

  const bindPageTriggers = (scope = document) => {
    scope.querySelectorAll('.page-trigger').forEach((button) => {
      if (button.dataset.pageTriggerBound) {
        return;
      }
      button.dataset.pageTriggerBound = 'true';
      button.addEventListener('click', () => openPageModal(button));
    });
  };

  bindPageTriggers();
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
          ${(keyword.pages || [])
            .map(
              (page, index, list) =>
                `<button class="page-trigger keyword-page" type="button" data-src="${esc(page.src)}" data-title="${esc(page.title || page.label)}" data-page-set="${esc(serializePageSet(list))}" data-page-index="${index}">${esc(page.label)}</button>`
            )
            .join('')}
        </div>
      `;
      keywordModal.querySelector('.modal-title').textContent = keyword.term;
      openModal(keywordModal, button);

      bindPageTriggers(keywordBody);
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
    if (typeof IntersectionObserver !== 'function') {
      if (navLinks[0]) {
        navLinks[0].classList.add('active');
      }
    } else {
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

    document.querySelectorAll('[data-workbook-reader]').forEach((reader) => syncWorkbookReader(reader));
    searchClear.hidden = !active;
    setSearchStatus(count, active);
  };

  const syncWorkbookReader = (reader, requestedPage = null) => {
    if (!reader) {
      return;
    }
    const panels = [...reader.querySelectorAll('.workbook-page-panel')];
    panels.forEach((panel) => {
      const card = panel.querySelector('.search-card');
      panel.classList.toggle('search-hidden', !!card && card.classList.contains('search-hidden'));
    });
    const visiblePanels = panels.filter((panel) => !panel.classList.contains('search-hidden'));
    const label = reader.querySelector('[data-workbook-page-label]');
    const count = reader.querySelector('[data-workbook-page-count]');
    const prevButton = reader.querySelector('[data-workbook-direction="-1"]');
    const nextButton = reader.querySelector('[data-workbook-direction="1"]');

    if (!visiblePanels.length) {
      panels.forEach((panel) => panel.classList.remove('is-active'));
      if (label) {
        label.textContent = '';
      }
      if (count) {
        count.textContent = '0 / 0';
      }
      if (prevButton) {
        prevButton.disabled = true;
      }
      if (nextButton) {
        nextButton.disabled = true;
      }
      reader.querySelectorAll('[data-workbook-jump]').forEach((button) => {
        button.hidden = true;
        button.classList.remove('active');
      });
      return;
    }

    let activePanel = requestedPage !== null ? visiblePanels.find((panel) => Number(panel.dataset.workbookPage || -1) === requestedPage) : null;
    if (!activePanel) {
      activePanel = visiblePanels.find((panel) => panel.classList.contains('is-active'));
    }
    if (!activePanel) {
      activePanel = visiblePanels[0];
    }

    panels.forEach((panel) => panel.classList.toggle('is-active', panel === activePanel));
    const activeIndex = visiblePanels.indexOf(activePanel);
    if (label) {
      label.textContent = activePanel.dataset.workbookLabel || '';
    }
    if (count) {
      count.textContent = `${activeIndex + 1} / ${visiblePanels.length}`;
    }
    if (prevButton) {
      prevButton.disabled = activeIndex <= 0;
    }
    if (nextButton) {
      nextButton.disabled = activeIndex >= visiblePanels.length - 1;
    }

    reader.querySelectorAll('[data-workbook-jump]').forEach((button) => {
      const panel = panels.find((item) => item.dataset.workbookPage === button.dataset.workbookJump);
      const visible = !!panel && !panel.classList.contains('search-hidden');
      button.hidden = !visible;
      button.classList.toggle('active', visible && panel === activePanel);
    });
  };

  document.querySelectorAll('[data-workbook-reader]').forEach((reader) => {
    syncWorkbookReader(reader);
    reader.addEventListener('click', (event) => {
      const jumpButton = event.target.closest('[data-workbook-jump]');
      if (jumpButton) {
        syncWorkbookReader(reader, Number(jumpButton.dataset.workbookJump || 0));
        return;
      }

      const navButton = event.target.closest('[data-workbook-direction]');
      if (!navButton) {
        return;
      }
      const visiblePanels = [...reader.querySelectorAll('.workbook-page-panel')].filter((panel) => !panel.classList.contains('search-hidden'));
      if (!visiblePanels.length) {
        return;
      }
      const activePanel = visiblePanels.find((panel) => panel.classList.contains('is-active')) || visiblePanels[0];
      const activeIndex = visiblePanels.indexOf(activePanel);
      const nextIndex = activeIndex + Number(navButton.dataset.workbookDirection || 0);
      const targetPanel = visiblePanels[Math.min(visiblePanels.length - 1, Math.max(0, nextIndex))];
      if (targetPanel) {
        syncWorkbookReader(reader, Number(targetPanel.dataset.workbookPage || 0));
      }
    });
  });

  document.querySelectorAll('.page-details').forEach((details) => {
    const renderPreview = () => {
      if (!details.open) {
        return;
      }
      const shell = details.querySelector('[data-page-preview-shell]');
      const previewKey = details.dataset.previewKey || '';
      if (!shell || !previewKey || shell.dataset.rendered) {
        return;
      }
      const pages = pagePreviewStore.get(previewKey);
      if (!pages || !pages.length) {
        return;
      }
      shell.innerHTML = renderThumbs(pages);
      shell.dataset.rendered = 'true';
      bindPageTriggers(shell);
    };
    details.addEventListener('toggle', renderPreview);
    renderPreview();
  });

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

  const syncChoiceFieldUi = (fieldEl) => {
    const shell = fieldEl.closest('.worksheet-choice-shell');
    if (!shell) {
      return;
    }
    const value = String(fieldEl.value || '');
    shell.querySelectorAll('.worksheet-choice-option').forEach((button) => {
      const active = button.dataset.choiceValue === value;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  const getWorksheetFieldValue = (fieldEl) => String(fieldEl?.value || '');

  const setWorksheetFieldValue = (fieldEl, value = '') => {
    if (!fieldEl) {
      return;
    }
    fieldEl.value = value;
    if (fieldEl.dataset.fieldKind === 'choice') {
      syncChoiceFieldUi(fieldEl);
    }
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

  const refreshWorksheetInk = (scope = document) => {
    scope.querySelectorAll('.worksheet-page').forEach((pageEl) => redrawInkLayer(pageEl));
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
      drawFieldToCanvas(ctx, getWorksheetFieldValue(fieldEl), fieldEl, canvas.width, canvas.height);
    });
    getInkOperations(pageEl).forEach((operation) => paintInkOperation(ctx, operation, canvas.width, canvas.height));
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
      setWorksheetFieldValue(input, value);
    });
  };

  const collectWorksheetPayload = (editor) => ({
    title: editor.dataset.worksheetTitle || data.ui.worksheetLabel,
    shared: [...editor.querySelectorAll('[data-shared-key]')].reduce((fields, input) => {
      if (input.dataset.sharedKey) {
        fields[input.dataset.sharedKey] = input.value || '';
      }
      return fields;
    }, {}),
    pages: [...editor.querySelectorAll('.worksheet-page')].map((pageEl) => ({
      pageNumber: Number(pageEl.dataset.pageNumber || 0),
      fields: [...pageEl.querySelectorAll('.worksheet-input')]
        .map((input) => ({
          id: input.dataset.fieldId,
          key: input.dataset.fieldKey || '',
          label: input.dataset.fieldLabel || '',
          value: getWorksheetFieldValue(input),
        }))
        .filter((field) => field.value.trim()),
    })),
  });

  const buildWorksheetFilename = (payload) => {
    const studentBits = Object.entries(payload.shared || {})
      .filter(([key, value]) => !['student_class', 'student_name'].includes(key) && String(value || '').trim())
      .map(([, value]) => slugify(value || ''))
      .filter(Boolean)
      .slice(0, 3)
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
    onNextFrame(() => {
      refreshWorksheetTypography(active || editor);
      refreshWorksheetInk(active || editor);
    });
  };

  const getInkLayer = (pageEl) => pageEl?.querySelector('.worksheet-ink-layer');
  const getInkOperations = (pageEl) => {
    if (!pageEl._inkOperations) {
      pageEl._inkOperations = [];
    }
    return pageEl._inkOperations;
  };
  const drawInkCheck = (ctx, x, y, size = 16) => {
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y);
    ctx.lineTo(x - size * 0.12, y + size * 0.32);
    ctx.lineTo(x + size * 0.44, y - size * 0.4);
    ctx.stroke();
  };
  const paintInkOperation = (ctx, op, width, height) => {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(41, 78, 111, 0.92)';
    ctx.lineWidth = Math.max(2, Math.min(width, height) * 0.0045);
    if (op.type === 'path' && op.points?.length) {
      ctx.beginPath();
      op.points.forEach((point, index) => {
        const x = point.x * width;
        const y = point.y * height;
        if (!index) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
    if (op.type === 'check') {
      drawInkCheck(ctx, op.x * width, op.y * height, Math.max(14, Math.min(width, height) * 0.03));
    }
    ctx.restore();
  };
  const redrawInkLayer = (pageEl, draftOperation = null) => {
    const inkLayer = getInkLayer(pageEl);
    if (!inkLayer) {
      return;
    }
    const bounds = inkLayer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const nextWidth = Math.max(1, Math.round(bounds.width * dpr));
    const nextHeight = Math.max(1, Math.round(bounds.height * dpr));
    if (inkLayer.width !== nextWidth || inkLayer.height !== nextHeight) {
      inkLayer.width = nextWidth;
      inkLayer.height = nextHeight;
    }
    const ctx = inkLayer.getContext('2d');
    ctx.clearRect(0, 0, inkLayer.width, inkLayer.height);
    getInkOperations(pageEl).forEach((operation) => paintInkOperation(ctx, operation, inkLayer.width, inkLayer.height));
    if (draftOperation) {
      paintInkOperation(ctx, draftOperation, inkLayer.width, inkLayer.height);
    }
  };
  const clearInkLayer = (pageEl) => {
    pageEl._inkOperations = [];
    redrawInkLayer(pageEl);
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
    canvas?.classList.toggle('is-drawing', kind === 'textarea');
    canvas?.classList.toggle('is-inking', kind === 'draw');
    canvas?.classList.toggle('is-checking', kind === 'check');
    pageEl.querySelectorAll('.worksheet-field-add').forEach((button) => {
      const active = button.dataset.fieldKind === kind;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    pageEl.querySelectorAll('.worksheet-tool-toggle').forEach((button) => {
      const active = button.dataset.toolKind === kind;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };
  const setLayoutEditMode = (pageEl, active = false) => {
    pageEl.classList.toggle('is-layout-edit', active);
    pageEl.querySelectorAll('.worksheet-layout-toggle').forEach((button) => {
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (active) {
      setDrawMode(pageEl, '');
    }
  };
  const updateCustomFieldRect = (shell, rect) => {
    shell.style.setProperty('--x', `${rect.x * 100}%`);
    shell.style.setProperty('--y', `${rect.y * 100}%`);
    shell.style.setProperty('--w', `${rect.w * 100}%`);
    shell.style.setProperty('--h', `${rect.h * 100}%`);
    const input = shell.querySelector('.worksheet-input');
    if (input) {
      input.dataset.x = String(rect.x);
      input.dataset.y = String(rect.y);
      input.dataset.w = String(rect.w);
      input.dataset.h = String(rect.h);
    }
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
    shell.dataset.customField = 'true';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'worksheet-custom-remove';
    removeButton.setAttribute('aria-label', data.ui.worksheetRemoveFieldLabel);
    removeButton.textContent = '×';
    const moveHandle = document.createElement('button');
    moveHandle.type = 'button';
    moveHandle.className = 'worksheet-custom-move';
    moveHandle.textContent = lang === 'ko' ? '이동' : 'Move';
    shell.append(moveHandle, removeButton, input);
    canvas.append(shell);
    onNextFrame(() => {
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
    refreshWorksheetInk(editor);
    editor.querySelectorAll('.worksheet-input[data-field-kind="choice"]').forEach((input) => syncChoiceFieldUi(input));

    editor.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        return;
      }
      const sharedKey = target.dataset.sharedKey || target.dataset.fieldKey || '';
      if (sharedKey) {
        syncWorksheetValue(editor, sharedKey, getWorksheetFieldValue(target), target);
      }
    });

    editor.addEventListener('click', (event) => {
      const choiceButton = event.target.closest('.worksheet-choice-option');
      if (choiceButton) {
        const shell = choiceButton.closest('.worksheet-choice-shell');
        const input = shell?.querySelector('.worksheet-input[data-field-kind="choice"]');
        if (input) {
          const nextValue = getWorksheetFieldValue(input) === choiceButton.dataset.choiceValue ? '' : choiceButton.dataset.choiceValue || '';
          setWorksheetFieldValue(input, nextValue);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }

      const addButton = event.target.closest('.worksheet-field-add');
      if (addButton) {
        const pageEl = addButton.closest('.worksheet-page');
        if (!pageEl) {
          return;
        }
        setLayoutEditMode(pageEl, false);
        const nextKind = pageEl.dataset.drawKind === addButton.dataset.fieldKind ? '' : addButton.dataset.fieldKind || '';
        setDrawMode(pageEl, nextKind);
        return;
      }

      const layoutButton = event.target.closest('.worksheet-layout-toggle');
      if (layoutButton) {
        const pageEl = layoutButton.closest('.worksheet-page');
        if (!pageEl) {
          return;
        }
        setLayoutEditMode(pageEl, !pageEl.classList.contains('is-layout-edit'));
        return;
      }

      const toolButton = event.target.closest('.worksheet-tool-toggle');
      if (toolButton) {
        const pageEl = toolButton.closest('.worksheet-page');
        if (!pageEl) {
          return;
        }
        setLayoutEditMode(pageEl, false);
        const nextKind = pageEl.dataset.drawKind === toolButton.dataset.toolKind ? '' : toolButton.dataset.toolKind || '';
        setDrawMode(pageEl, nextKind);
        return;
      }

      const clearButton = event.target.closest('.worksheet-tool-clear');
      if (clearButton) {
        const pageEl = clearButton.closest('.worksheet-page');
        if (!pageEl) {
          return;
        }
        clearInkLayer(pageEl);
        setDrawMode(pageEl, '');
        return;
      }

      const removeButton = event.target.closest('.worksheet-custom-remove');
      if (removeButton) {
        const shell = removeButton.closest('.worksheet-custom-field');
        if (!shell) {
          return;
        }
        const confirmed = window.confirm(lang === 'ko' ? '이 메모칸을 삭제할까요?' : 'Delete this note box?');
        if (confirmed) {
          shell.remove();
        }
      }
    });

    editor.addEventListener('pointerdown', (event) => {
      const moveHandle = event.target.closest('.worksheet-custom-move');
      if (!moveHandle) {
        return;
      }
      const shell = moveHandle.closest('.worksheet-custom-field');
      const pageEl = moveHandle.closest('.worksheet-page');
      const canvas = pageEl?.querySelector('.worksheet-canvas');
      if (!shell || !pageEl || !canvas || !pageEl.classList.contains('is-layout-edit')) {
        return;
      }

      event.preventDefault();
      const start = canvasPoint(canvas, event);
      const startRect = {
        x: Number(shell.querySelector('.worksheet-input')?.dataset.x || 0),
        y: Number(shell.querySelector('.worksheet-input')?.dataset.y || 0),
        w: Number(shell.querySelector('.worksheet-input')?.dataset.w || 0),
        h: Number(shell.querySelector('.worksheet-input')?.dataset.h || 0),
      };

      const handleMove = (moveEvent) => {
        const point = canvasPoint(canvas, moveEvent);
        updateCustomFieldRect(shell, {
          x: clamp(startRect.x + (point.x - start.x), 0, 1 - startRect.w),
          y: clamp(startRect.y + (point.y - start.y), 0, 1 - startRect.h),
          w: startRect.w,
          h: startRect.h,
        });
      };

      const stopMove = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', stopMove);
        window.removeEventListener('pointercancel', stopMove);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', stopMove, { once: true });
      window.addEventListener('pointercancel', stopMove, { once: true });
    });

    const resetButton = editor.querySelector('.worksheet-reset');
    const downloadButton = editor.querySelector('.worksheet-download');

    resetButton?.addEventListener('click', () => {
      editor.querySelectorAll('input, textarea').forEach((input) => {
        setWorksheetFieldValue(input, '');
      });
      editor.querySelectorAll('.worksheet-custom-field').forEach((field) => field.remove());
      editor.querySelectorAll('.worksheet-page').forEach((pageEl) => {
        clearInkLayer(pageEl);
        setDrawMode(pageEl, '');
        setLayoutEditMode(pageEl, false);
      });
      refreshWorksheetTypography(editor);
      refreshWorksheetInk(editor);
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
        onNextFrame(() => {
          refreshWorksheetTypography(sheet);
          refreshWorksheetInk(sheet);
        });
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
        if (event.target.closest('.worksheet-input, .worksheet-custom-remove, .worksheet-choice-option')) {
          return;
        }

        event.preventDefault();
        const start = canvasPoint(canvas, event);

        if (kind === 'check') {
          getInkOperations(pageEl).push({ type: 'check', x: start.x, y: start.y });
          redrawInkLayer(pageEl);
          setDrawMode(pageEl, '');
          return;
        }

        if (kind === 'draw') {
          const draft = { type: 'path', points: [start] };
          redrawInkLayer(pageEl, draft);
          let finished = false;

          const handleMove = (moveEvent) => {
            draft.points.push(canvasPoint(canvas, moveEvent));
            redrawInkLayer(pageEl, draft);
          };

          const finishDraw = () => {
            if (finished) {
              return;
            }
            finished = true;
            window.removeEventListener('pointermove', handleMove);
            if (draft.points.length > 1) {
              getInkOperations(pageEl).push({
                type: 'path',
                points: draft.points.map((point) => ({ x: clamp(point.x), y: clamp(point.y) })),
              });
            }
            redrawInkLayer(pageEl);
          };

          window.addEventListener('pointermove', handleMove);
          window.addEventListener(
            'pointerup',
            () => {
              finishDraw();
            },
            { once: true }
          );
          window.addEventListener(
            'pointercancel',
            () => {
              finishDraw();
            },
            { once: true }
          );
          return;
        }

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
      onNextFrame(() => refreshWorksheetTypography(details));
    });
  });

  window.addEventListener('resize', () => {
    refreshWorksheetTypography();
    refreshWorksheetInk();
  });

  if (searchInput && searchClear) {
    searchInput.addEventListener('input', () => runSearch(searchInput.value));
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      runSearch('');
      searchInput.focus();
    });
  }
})();





