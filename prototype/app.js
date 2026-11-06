/* 追番助手 · 静态可点击原型（纯前端假数据，无接口） */
(function () {
  'use strict';

  var viewport = document.getElementById('viewport');
  var device = document.getElementById('device');
  var state = {
    view: 'timeline',
    day: window.TODAY_INDEX || 0,
    filter: 'all',
    q: '',
    detailId: 'tenchi',
    returnTo: 'timeline',
    tagsOpen: false,
    history: (window.SEARCH_HISTORY || []).slice()
  };

  var FILTERS = [
    { key: 'all', label: '全部', icon: 'layers' },
    { key: 'anime', label: '番剧', icon: 'broadcast' },
    { key: 'guochuang', label: '国漫', icon: 'globe' }
  ];

  // 搜索浮层：从底部弹起，背景页同步缩小、变圆角并压暗
  var sheet = {
    open: false,
    closing: false,
    pendingOpen: false,
    returnTo: 'timeline',
    domView: '',
    bgScroll: 0,
    suppressClickUntil: 0
  };
  var sheetDrag = null;
  var sheetPointer = null;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var ICONS = {
    timeline: '<circle cx="4.5" cy="6.5" r="1.4"/><circle cx="4.5" cy="12" r="1.4"/><circle cx="4.5" cy="17.5" r="1.4"/><path d="M9 6.5h11M9 12h11M9 17.5h11"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    calendar7: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 9.5h17"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.6 15.6L20 20"/>',
    back: '<path d="M14.5 5L7.5 12l7 7M7.8 12H20"/>',
    clock: '<circle cx="12" cy="12" r="8.3"/><path d="M12 7.7V12l2.9 1.8"/>',
    broadcast: '<circle cx="12" cy="12" r="1.7"/><path d="M8.4 8.6a5 5 0 0 0 0 6.8M15.6 8.6a5 5 0 0 1 0 6.8M5.7 5.9a8.5 8.5 0 0 0 0 12.2M18.3 5.9a8.5 8.5 0 0 1 0 12.2"/>',
    globe: '<circle cx="12" cy="12" r="8.3"/><path d="M3.7 12h16.6M12 3.7c2.5 2.6 3.7 5.4 3.7 8.3S14.5 17.7 12 20.3c-2.5-2.6-3.7-5.4-3.7-8.3S9.5 6.3 12 3.7z"/>',
    layers: '<path d="M12 3.5l8.4 4.6-8.4 4.6-8.4-4.6z"/><path d="M3.6 12.6l8.4 4.6 8.4-4.6"/><path d="M3.6 17l8.4 4.6 8.4-4.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrowUp: '<path d="M12 19V5M6.5 10.5L12 5l5.5 5.5"/>',
    arrowUpRight: '<path d="M7 17L17 7M9.5 7H17v7.5"/>',
    book: '<path d="M4.5 5.5c2.4-.8 4.6-.3 7.5 1.2v12c-2.9-1.5-5.1-2-7.5-1.2zM19.5 5.5c-2.4-.8-4.6-.3-7.5 1.2v12c2.9-1.5 5.1-2 7.5-1.2z"/>',
    calendarX: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 9.5h17M9.5 13.5l5 4M14.5 13.5l-5 4"/>',
    x: '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>'
  };

  var ICON_ALIASES = { 'calendar-x': 'calendarX', 'arrow-up': 'arrowUp', 'arrow-up-right': 'arrowUpRight' };

  function icon(name, cls) {
    var key = String(name || '').replace(/^i-/, '');
    key = ICON_ALIASES[key] || key;
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[key] || '') + '</svg>';
  }

  function byId(id) {
    return window.ANIME.filter(function (a) { return a.id === id; })[0];
  }

  function passes(a) {
    if (state.filter === 'anime') return a.category === 'anime';
    if (state.filter === 'guochuang') return a.category === 'guochuang';
    return true;
  }

  function showsForDay(day) {
    return window.ANIME.filter(function (a) { return a.day === day && passes(a); })
      .sort(function (a, b) { return a.time.localeCompare(b.time); });
  }

  function dayStatus(a) {
    return a.day <= window.TODAY_INDEX ? '已播' : '待播';
  }

  function header() {
    var modes = {
      timeline: { icon: 'i-timeline', label: '切换到列表视图', title: '番剧时间轴' },
      list: { icon: 'i-grid', label: '切换到网格视图', title: '番剧列表' },
      grid: { icon: 'i-calendar7', label: '切换到时间线视图', title: '番剧网格' }
    };
    var m = modes[state.view] || modes.timeline;
    return '' +
      '<header class="app-header">' +
        '<button class="icon-btn" data-action="switch" aria-label="' + m.label + '" title="' + m.label + '">' + icon(m.icon) + '</button>' +
        '<h1>' + m.title + '</h1>' +
        '<span class="header-spacer" aria-hidden="true"></span>' +
      '</header>';
  }

  function weekStrip() {
    return '<nav class="week-strip" aria-label="本周日期">' + window.WEEK.map(function (d, i) {
      return '<button class="week-cell' + (i === state.day ? ' active' : '') + '" data-action="day" data-day="' + i + '" aria-label="' + d.md + ' ' + d.label + '">' +
        '<span class="week-date">' + d.md + '</span>' +
        '<span class="week-day">' + d.label.slice(1) + '</span>' +
        (i === state.day ? '<i class="today-dot" title="已选中"></i>' : '') +
      '</button>';
    }).join('') + '</nav>';
  }

  function weekChips() {
    return '<nav class="week-chips" aria-label="本周日期">' + window.WEEK.map(function (d, i) {
      return '<button class="week-chip' + (i === state.day ? ' active' : '') + '" data-action="day" data-day="' + i + '">' + d.label + '</button>';
    }).join('') + '</nav>';
  }

  function filters() {
    return '<div class="dock-group" role="group" aria-label="筛选">' +
      '<i class="dock-thumb" aria-hidden="true"></i>' +
      FILTERS.map(function (f) {
        return '<button class="dock-tab' + (state.filter === f.key ? ' active' : '') + '" data-action="filter" data-filter="' + f.key + '">' +
          icon(f.icon, 'dock-ico') + '<span class="dock-label">' + f.label + '</span>' +
        '</button>';
      }).join('') + '</div>';
  }

  function dayBar() {
    return '<div class="day-bar">' +
      '<div class="day-label"><i class="day-dot"></i><span class="day-name">' + window.WEEK[state.day].label + '</span><span class="day-md">' + window.WEEK[state.day].md + '</span></div>' +
    '</div>';
  }

  function bottomDock() {
    return '<nav class="bottom-dock" aria-label="底部导航">' +
      filters() +
      '<button class="dock-search" data-action="open-search" aria-label="搜索番剧" title="搜索番剧">' + icon('i-search') + '</button>' +
    '</nav>';
  }

  function emptyState(kind) {
    var c = {
      day: { icon: 'i-calendar-x', title: '这一天没有番剧', sub: '试试切换其他日期看看' },
      filter: { icon: 'i-calendar-x', title: '没有符合条件的番剧', sub: '换一个筛选条件试试' },
      search: { icon: 'i-search', title: '没有找到相关番剧', sub: '换个关键词再试试' }
    }[kind] || {};
    var action = kind === 'filter'
      ? '<button class="empty-action" data-action="reset-filter">查看全部</button>'
      : '';
    return '<div class="empty-state">' +
      '<div class="empty-ico">' + icon(c.icon) + '</div>' +
      '<h3>' + c.title + '</h3><p>' + c.sub + '</p>' + action +
    '</div>';
  }

  function timelineItem(a) {
    return '<article class="tl-item" data-action="open" data-id="' + a.id + '" role="button" tabindex="0" aria-label="查看 ' + esc(a.title) + ' 详情">' +
      '<img class="tl-poster" src="' + esc(a.poster) + '" alt="' + esc(a.title) + '" loading="lazy">' +
      '<div class="tl-body">' +
        '<h3 class="tl-title">' + esc(a.title) + '</h3>' +
        '<p class="tl-ep">第' + a.ep + '话</p>' +
        '<div class="tl-tags">' + a.tags.slice(0, 2).map(function (t) { return '<span class="tag-outline">' + esc(t) + '</span>'; }).join('') + '</div>' +
      '</div>' +
    '</article>';
  }

  function timelineGroups(items) {
    var groups = [];
    items.forEach(function (a) {
      var g = groups.filter(function (x) { return x.time === a.time; })[0];
      if (!g) { g = { time: a.time, list: [] }; groups.push(g); }
      g.list.push(a);
    });
    return groups.map(function (g) {
      return '<section class="tl-group">' +
        '<div class="tl-rail"><span class="tl-dot"></span><span class="tl-time">' + g.time + '</span></div>' +
        '<div class="tl-items">' + g.list.map(timelineItem).join('') + '</div>' +
      '</section>';
    }).join('');
  }

  function renderTimeline() {
    var items = showsForDay(state.day);
    var body = items.length
      ? timelineGroups(items)
      : emptyState(state.filter === 'all' ? 'day' : 'filter');
    return '<div class="page page-timeline">' +
      '<div class="top-bar">' + header() + weekStrip() + dayBar() + '</div>' +
      '<div class="timeline-wrap' + (items.length ? '' : ' is-empty') + '">' + body + '</div>' +
      bottomDock() + '<div class="page-pad"></div></div>';
  }

  function listCard(a) {
    var status = dayStatus(a);
    return '<article class="list-card" data-action="open" data-id="' + a.id + '" role="button" tabindex="0" aria-label="查看 ' + esc(a.title) + ' 详情">' +
      '<img class="list-poster" src="' + esc(a.poster) + '" alt="' + esc(a.title) + '" loading="lazy">' +
      '<div class="list-body">' +
        '<h3 class="list-title">' + esc(a.title) + '</h3>' +
        (a.jp ? '<p class="list-jp">' + esc(a.jp) + '</p>' : '') +
        '<div class="list-meta">' +
          '<span class="meta-chip">' + icon('i-clock') + a.time + ' ' + status + '</span>' +
          '<span class="meta-chip"><span class="hash">#</span> 第' + a.ep + '集</span>' +
          (a.category === 'guochuang' ? '<span class="meta-chip">' + icon('i-globe') + '国漫</span>' : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderList() {
    var items = showsForDay(state.day);
    var body = items.length
      ? items.map(listCard).join('')
      : emptyState(state.filter === 'all' ? 'day' : 'filter');
    return '<div class="page page-list"><div class="top-bar">' + header() + weekChips() + '</div>' +
      '<div class="list-body-wrap">' + body + '</div>' + bottomDock() + '<div class="page-pad"></div></div>';
  }

  function gridCard(a) {
    return '<article class="grid-card" data-action="open" data-id="' + a.id + '" role="button" tabindex="0" aria-label="查看 ' + esc(a.title) + ' 详情">' +
      '<div class="grid-cover"><img src="' + esc(a.poster) + '" alt="' + esc(a.title) + '" loading="lazy">' +
        '<span class="grid-time">' + a.time + ' 播放</span></div>' +
      '<h3 class="grid-title">' + esc(a.title) + '</h3>' +
    '</article>';
  }

  function renderGrid() {
    var items = showsForDay(state.day);
    var body = items.length
      ? '<div class="grid-wrap">' + items.map(gridCard).join('') + '</div>'
      : emptyState(state.filter === 'all' ? 'day' : 'filter');
    return '<div class="page page-grid"><div class="top-bar">' + header() + weekChips() + '</div>' +
      '<div class="grid-body">' + body + '</div>' + bottomDock() + '<div class="page-pad"></div></div>';
  }

  function searchRow(a) {
    return '<article class="result-row" data-action="open" data-id="' + a.id + '" role="button" tabindex="0" aria-label="查看 ' + esc(a.title) + ' 详情">' +
      '<img class="result-poster" src="' + esc(a.poster) + '" alt="' + esc(a.title) + '" loading="lazy">' +
      '<div class="result-body">' +
        '<h3 class="result-title">' + esc(a.title) + '</h3>' +
        (a.jp ? '<p class="result-jp">' + esc(a.jp) + '</p>' : '') +
        '<div class="result-meta">' +
          '<span>' + window.WEEK[a.day].label + ' ' + a.time + '</span>' +
          '<span class="dot-sep"></span>' +
          '<span>' + (a.category === 'guochuang' ? '国漫' : '番剧') + '</span>' +
          '<span class="dot-sep"></span>' +
          '<span>第 ' + a.ep + ' 话</span>' +
        '</div>' +
      '</div>' +
      icon('i-arrow-up-right', 'result-go') +
    '</article>';
  }

  function historyRow(k) {
    return '<button class="history-row" data-action="keyword" data-q="' + esc(k) + '" aria-label="搜索 ' + esc(k) + '">' +
      '<span class="history-ico">' + icon('i-clock') + '</span>' +
      '<span class="history-text">' + esc(k) + '</span>' +
      icon('i-arrow-up-right', 'history-go') +
    '</button>';
  }

  // 「按标签探索」入口：从数据里统计出现最多的标签，跳过来源与分类标签
  var SKIP_TAGS = ['漫画改', '漫改', '国创', '国漫'];

  function suggestTags() {
    var counts = {};
    window.ANIME.forEach(function (a) {
      (a.tags || []).forEach(function (t) {
        if (SKIP_TAGS.indexOf(t) > -1) return;
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.keys(counts).map(function (name) {
      return { name: name, count: counts[name] };
    }).sort(function (a, b) { return b.count - a.count; }).slice(0, 8);
  }

  function tagsHTML() {
    var tags = suggestTags();
    return '<section class="search-section">' +
        '<div class="section-head">' +
          '<h2 class="section-title">按标签探索</h2>' +
          '<span class="section-rule"></span>' +
          '<span class="section-note">' + tags.length + ' 个标签</span>' +
        '</div>' +
        '<div class="suggest-cloud">' + tags.map(function (t) {
          return '<button class="tag-chip" data-action="keyword" data-q="' + esc(t.name) + '">' +
            '<span class="tag-chip-name">' + esc(t.name) + '</span>' +
            '<span class="tag-chip-count">' + t.count + '</span>' +
          '</button>';
        }).join('') + '</div>' +
      '</section>';
  }

  function historyHTML() {
    var items = state.history;
    return '<section class="search-section">' +
        '<div class="section-head">' +
          '<h2 class="section-title">最近搜索</h2>' +
          '<span class="section-rule"></span>' +
          (items.length ? '<button class="section-action" data-action="clear-history">清空</button>' : '') +
        '</div>' +
        (items.length
          ? '<div class="search-panel">' + items.map(historyRow).join('') + '</div>'
          : '<div class="history-blank">' + icon('i-clock') +
              '<span class="history-blank-text">还没有搜索记录，试试下面的标签</span></div>') +
      '</section>' +
      tagsHTML();
  }

  function rememberQuery(q) {
    q = String(q || '').trim();
    if (!q) return;
    state.history = [q].concat(state.history.filter(function (h) { return h !== q; })).slice(0, 8);
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function noResultsHTML() {
    return '<div class="result-blank">' +
      '<div class="result-orb">' + icon('i-search') + '</div>' +
      '<h3 class="result-blank-title">没有找到「' + esc(state.q.trim()) + '」</h3>' +
      '<p class="result-blank-desc">换个关键词，或从标签里挑一个</p>' +
    '</div>';
  }

  function searchResultsHTML() {
    var q = state.q.trim().toLowerCase();
    if (!q) return historyHTML();
    var results = window.ANIME.filter(function (a) {
      var pool = [a.title, a.jp, a.studio, a.season, a.category === 'guochuang' ? '国创 国漫' : '番剧'].concat(a.tags, a.extraTags || [], a.genres).join(' ').toLowerCase();
      return pool.indexOf(q) > -1;
    });
    if (!results.length) return noResultsHTML();
    return '<div class="result-head">' +
        '<div class="result-head-left">' +
          '<span class="result-label">搜索结果</span>' +
          '<span class="result-query">「' + esc(state.q.trim()) + '」</span>' +
        '</div>' +
        '<div class="result-count"><span class="result-num">' + pad2(results.length) + '</span><span class="result-unit">部</span></div>' +
      '</div>' +
      '<div class="search-panel result-panel">' + results.map(searchRow).join('') + '</div>';
  }

  /* ---------- 搜索浮层 ---------- */
  function searchSheetHTML() {
    return '<div class="sheet-dim" data-action="close-search"></div>' +
      '<section class="search-sheet" id="search-sheet" role="dialog" aria-modal="true" aria-label="搜索番剧">' +
        '<div class="sheet-grab-zone" aria-hidden="true"><span class="sheet-grab"></span></div>' +
        '<header class="search-top">' +
          '<div class="search-row">' +
            '<div class="search-field" id="search-field">' +
              '<span class="search-field-icon">' + icon('i-search') + '</span>' +
              '<input class="search-input" id="search-input" type="text" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="搜索番剧、制作、标签" value="' + esc(state.q) + '" aria-label="搜索番剧">' +
              '<button class="search-clear" id="search-clear" data-action="clear-search" aria-label="清空搜索"' + (state.q ? '' : ' hidden') + '>' + icon('i-x') + '</button>' +
            '</div>' +
            '<button class="sheet-cancel" data-action="close-search" aria-label="关闭搜索">取消</button>' +
          '</div>' +
        '</header>' +
        '<main class="search-body" id="search-results">' + searchResultsHTML() + '</main>' +
      '</section>';
  }

  function pageHTML(view) {
    if (view === 'list') return renderList();
    if (view === 'grid') return renderGrid();
    if (view === 'detail') return renderDetail();
    return renderTimeline();
  }

  function mountSheet(animate) {
    if (sheet.open || document.getElementById('sheet-layer')) return;
    var layer = document.createElement('div');
    layer.className = 'sheet-layer';
    layer.id = 'sheet-layer';
    layer.innerHTML = searchSheetHTML();
    device.appendChild(layer);
    viewport.classList.add('is-sheet-lock');
    sheet.open = true;
    sheet.closing = false;
    // overflow 切换可能重置滚动位置，这里恢复背景页原位置
    viewport.scrollTop = sheet.bgScroll;
    document.title = '追番助手 · 搜索';
    if (!animate || prefersReducedMotion()) {
      layer.classList.add('is-open');
    } else {
      // 先让初始态（收起）完成一帧，再加 is-open 触发弹簧过渡
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          layer.classList.add('is-open');
        });
      });
    }
  }

  function teardownSheet() {
    var layer = document.getElementById('sheet-layer');
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
    viewport.classList.remove('is-sheet-lock');
    viewport.style.transition = '';
    sheet.open = false;
    sheet.closing = false;
    sheet.bgScroll = 0;
    sheetDrag = null;
    sheetPointer = null;
    sheet.suppressClickUntil = 0;
  }

  function openSearchSheet() {
    if (sheet.open) return;
    var from = state.view === 'detail' ? state.returnTo : state.view;
    if (!DAY_VIEWS[from]) from = 'timeline';
    sheet.returnTo = from;
    state.returnTo = from;
    sheet.bgScroll = viewport.scrollTop;
    state.q = '';
    state.tagsOpen = false;
    if (location.hash === '#/search') {
      state.view = 'search';
      mountSheet(true);
      return;
    }
    sheet.pendingOpen = true;
    location.hash = '#/search';
  }

  function closeSearchSheet() {
    if (!sheet.open || sheet.closing) return;
    sheet.closing = true;
    var layer = document.getElementById('sheet-layer');
    var panel = document.getElementById('search-sheet');
    var dim = layer && layer.querySelector('.sheet-dim');
    // 清掉拖拽时的行内样式，让 CSS 弹簧过渡接管
    if (panel) {
      panel.style.transition = '';
      panel.style.transform = '';
    }
    if (dim) {
      dim.style.transition = '';
      dim.style.opacity = '';
    }
    if (layer) layer.classList.remove('is-open');
    sheetDrag = null;
    sheetPointer = null;
    window.setTimeout(commitSheetClose, prefersReducedMotion() ? 0 : 540);
  }

  function commitSheetClose() {
    var returnTo = sheet.returnTo || 'timeline';
    var top = sheet.bgScroll;
    teardownSheet();
    state.view = returnTo;
    sheet.domView = returnTo;
    var hash = '#/' + returnTo;
    if (location.hash !== hash) location.hash = hash;
    else sheet.domView = '';
    viewport.scrollTop = top;
  }

  function sheetDragStart(y) {
    var panel = document.getElementById('search-sheet');
    if (!panel) return;
    sheetDrag = {
      startY: y,
      lastY: y,
      lastT: performance.now(),
      offset: 0,
      velocity: 0,
      height: panel.offsetHeight
    };
    panel.style.transition = 'none';
    var layer = document.getElementById('sheet-layer');
    var dim = layer && layer.querySelector('.sheet-dim');
    if (dim) dim.style.transition = 'none';
    sheet.suppressClickUntil = 0;
  }

  function sheetDragMove(y) {
    var d = sheetDrag;
    if (!d) return;
    var dy = y - d.startY;
    // 往上拖给阻力，最多再抬 72px；往下拖完全跟手
    var offset = dy >= 0 ? dy : Math.max(-72, dy * 0.3);
    d.offset = offset;
    var now = performance.now();
    var dt = now - d.lastT;
    if (dt > 0) {
      d.velocity = d.velocity * 0.6 + ((y - d.lastY) / dt) * 0.4;
      d.lastY = y;
      d.lastT = now;
    }

    var panel = document.getElementById('search-sheet');
    if (panel) panel.style.transform = 'translateY(' + offset + 'px)';
    var layer = document.getElementById('sheet-layer');
    var dim = layer && layer.querySelector('.sheet-dim');
    // 背景页不缩放，只随下拖进度逐渐恢复亮度
    var progress = Math.max(0, Math.min(1, offset / d.height));
    if (dim) dim.style.opacity = String(1 - progress);
    sheet.suppressClickUntil = performance.now() + 300;
  }

  function sheetDragEnd() {
    var d = sheetDrag;
    sheetDrag = null;
    if (!d) return;
    if (Math.abs(d.offset) > 6) sheet.suppressClickUntil = performance.now() + 300;
    // 下拖超过面板高度 1/3 或快速下甩（> 0.8 px/ms）即关闭，否则弹回原位
    if (d.offset > d.height / 3 || d.velocity > 0.8) {
      closeSearchSheet();
      return;
    }

    var panel = document.getElementById('search-sheet');
    var layer = document.getElementById('sheet-layer');
    var dim = layer && layer.querySelector('.sheet-dim');
    var ms = prefersReducedMotion() ? 0 : 500;
    var spring = 'cubic-bezier(0.22, 1.12, 0.36, 1)';
    if (panel) {
      panel.style.transition = 'transform ' + ms + 'ms ' + spring;
      panel.style.transform = 'translateY(0px)';
    }
    if (dim) {
      dim.style.transition = 'opacity ' + ms + 'ms ' + spring;
      dim.style.opacity = '1';
    }
    window.setTimeout(function () {
      if (panel) {
        panel.style.transition = '';
        panel.style.transform = '';
      }
      if (dim) {
        dim.style.transition = '';
        dim.style.opacity = '';
      }
    }, ms + 20);
  }

  function render() {
    stopThumbAnim();
    if (state.view === 'search') {
      viewport.innerHTML = pageHTML(sheet.returnTo);
      mountSheet(false);
      syncDockThumb();
      return;
    }
    if (state.view === 'timeline') viewport.innerHTML = renderTimeline();
    else if (state.view === 'list') viewport.innerHTML = renderList();
    else if (state.view === 'grid') viewport.innerHTML = renderGrid();
    else viewport.innerHTML = renderDetail();

    var a = byId(state.detailId);
    document.title = state.view === 'detail' && a ? '追番助手 · ' + a.title
      : '追番助手 · ' + ({ timeline: '番剧时间轴', list: '番剧列表', grid: '番剧网格' })[state.view];
    syncDockThumb();
  }

  function originInfo(a) {
    if (a.tags.indexOf('漫画改') > -1 || a.tags.indexOf('漫改') > -1) return { label: '漫画改编', cls: 'origin-manga' };
    if (a.tags.indexOf('轻改') > -1) return { label: '轻小说改编', cls: 'origin-novel' };
    return { label: '原创动画', cls: 'origin-original' };
  }

  function renderDetail() {
    var a = byId(state.detailId) || byId('tenchi');
    var allTags = a.tags.concat(a.extraTags || []);
    var visibleTags = state.tagsOpen ? allTags : allTags.slice(0, 6);
    var next = a.next;
    var rows = [
      ['集数', a.totalEps],
      ['季度', a.season],
      ['放送状态', a.status],
      ['制作', a.studio],
      ['类型', a.genres.join(' / ')],
      ['放送时段', window.WEEK[a.day].label + ' ' + a.time]
    ];
    var origin = originInfo(a);
    return '<div class="page page-detail">' +
      '<div class="detail-hero">' +
        '<div class="hero-blur" style="background-image:url(\'' + esc(a.poster) + '\')"></div>' +
        '<div class="detail-topbar">' +
          '<button class="round-back" data-action="back" aria-label="返回">' + icon('i-back') + '</button>' +
        '</div>' +
        '<div class="hero-main">' +
          '<img class="detail-poster" src="' + esc(a.poster) + '" alt="' + esc(a.title) + ' 海报">' +
          '<div class="hero-info">' +
            '<h1>' + esc(a.title) + '</h1>' +
            '<div class="hero-meta"><span class="meta-line">' + icon('i-clock') + a.totalEps + '集</span><span class="meta-line">' + icon('i-broadcast') + a.status + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="next-card">' +
          '<div class="next-ico">' + icon('i-clock') + '</div>' +
          '<div class="next-main"><div class="next-title">下一集 <b>第' + next.ep + '集</b> / 共' + next.total + '集</div><div class="next-sub">' + esc(next.date) + ' 放送（北京时间）</div></div>' +
          '<div class="next-right"><span>距开播</span><b>' + esc(next.countdown) + '</b></div>' +
        '</div>' +
        '<p class="synopsis">' + esc(a.synopsis) + '</p>' +
      '</div>' +

      '<section class="detail-section">' +
        '<h2>信息</h2>' +
        '<div class="origin-badge ' + origin.cls + '">' + icon('i-book') + origin.label + '</div>' +
        '<dl class="info-table">' + rows.map(function (r) {
          return '<div class="info-row"><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>';
        }).join('') + '</dl>' +
      '</section>' +

      '<section class="detail-section">' +
        '<h2>工作室</h2>' +
        '<div class="pill-row"><span class="outline-pill">' + esc(a.studio) + '</span></div>' +
      '</section>' +

      '<section class="detail-section">' +
        '<h2>标签</h2>' +
        '<div class="tag-cloud">' + visibleTags.map(function (t) { return '<span class="tag-pill">' + esc(t) + '</span>'; }).join('') +
          (allTags.length > 6 ? '<button class="more-tags" data-action="expand-tags">' + icon('i-plus') + (state.tagsOpen ? '收起' : '更多') + '</button>' : '') +
        '</div>' +
      '</section>' +

      '<div class="page-pad"></div>' +
      '<button class="to-top" data-action="top" aria-label="回到顶部">' + icon('i-arrow-up') + '</button>' +
    '</div>';
  }

  function updateSearchResults() {
    var box = document.getElementById('search-results');
    if (box) box.innerHTML = searchResultsHTML();
    var clear = document.getElementById('search-clear');
    if (clear) clear.hidden = !state.q.length;
  }

  function applyKeyword(q) {
    state.q = q;
    var input = document.getElementById('search-input');
    if (input) input.value = q;
    updateSearchResults();
  }

  /* ---------- 底部胶囊液态动效 ---------- */
  var thumbGeo = null;
  var thumbRaf = 0;

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function paintThumb(thumb, geo) {
    thumb.style.left = geo.left + 'px';
    thumb.style.top = geo.top + 'px';
    thumb.style.width = geo.width + 'px';
    thumb.style.height = geo.height + 'px';
  }

  function stopThumbAnim() {
    if (thumbRaf) {
      cancelAnimationFrame(thumbRaf);
      thumbRaf = 0;
    }
  }

  function tabMetrics(group, index) {
    var tab = group && group.querySelectorAll('.dock-tab')[index];
    if (!tab) return null;
    return { left: tab.offsetLeft, top: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight };
  }

  // 每次整页重绘后把胶囊放到当前选中项（不做动画）
  function syncDockThumb() {
    var group = viewport.querySelector('.dock-group');
    var thumb = group && group.querySelector('.dock-thumb');
    var tab = group && group.querySelector('.dock-tab.active');
    if (!thumb || !tab) return;
    thumbGeo = { left: tab.offsetLeft, top: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight };
    paintThumb(thumb, thumbGeo);
  }

  function springStep(edge, target, stiffness, damping, dt) {
    var accel = (target - edge.v) * stiffness - edge.vel * damping;
    edge.vel += accel * dt;
    edge.v += edge.vel * dt;
  }

  // 前沿与后沿各自用弹簧追赶目标：前沿更快到位，后沿稍慢并轻微回弹，中途被拉长、压扁
  function animateThumb(thumb, start, target) {
    var rightward = target.left >= start.left;
    var leadFrom = rightward ? start.left + start.width : start.left;
    var leadTo = rightward ? target.left + target.width : target.left;
    var trailFrom = rightward ? start.left : start.left + start.width;
    var trailTo = rightward ? target.left : target.left + target.width;
    var lead = { v: leadFrom, vel: 0 };
    var trail = { v: trailFrom, vel: 0 };
    var baseHeight = target.height;
    var startedAt = performance.now();
    var prevAt = startedAt;

    function frame(now) {
      var dt = Math.min(34, now - prevAt) / 1000;
      prevAt = now;
      springStep(lead, leadTo, 420, 30, dt);
      springStep(trail, trailTo, 220, 20, dt);

      var settled = Math.abs(lead.v - leadTo) < 0.25 && Math.abs(lead.vel) < 0.35 &&
        Math.abs(trail.v - trailTo) < 0.25 && Math.abs(trail.vel) < 0.35;
      if (settled || now - startedAt > 420) {
        thumb.style.left = target.left + 'px';
        thumb.style.top = target.top + 'px';
        thumb.style.width = target.width + 'px';
        thumb.style.height = baseHeight + 'px';
        thumbGeo = { left: target.left, top: target.top, width: target.width, height: baseHeight };
        thumbRaf = 0;
        return;
      }

      var left = Math.min(lead.v, trail.v);
      var width = Math.max(24, Math.abs(lead.v - trail.v));
      var stretch = target.width ? Math.max(0, width - target.width) / target.width : 0;
      var height = baseHeight * (1 - Math.min(0.1, stretch * 0.5));
      var top = target.top + (baseHeight - height) / 2;

      paintThumb(thumb, { left: left, top: top, width: width, height: height });
      thumbGeo = { left: left, top: top, width: width, height: height };
      thumbRaf = requestAnimationFrame(frame);
    }

    thumbRaf = requestAnimationFrame(frame);
  }

  // 页面内容沿点击方向轻推淡入
  var pushToken = 0;

  function pushContent(dir) {
    if (prefersReducedMotion()) return;
    var el = viewport.querySelector('.timeline-wrap, .list-body-wrap, .grid-body');
    if (!el) return;
    var token = ++pushToken;
    el.style.transition = 'none';
    el.style.opacity = '0';
    el.style.transform = 'translateX(' + (dir * 14) + 'px)';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (token !== pushToken) return;
        el.style.transition = 'transform 0.34s cubic-bezier(0.22, 0.9, 0.24, 1), opacity 0.28s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateX(0)';
        window.setTimeout(function () {
          if (token !== pushToken) return;
          el.style.transition = '';
          el.style.opacity = '';
          el.style.transform = '';
        }, 380);
      });
    });
  }

  function dockTransition(fromKey, toKey, fromGeo) {
    var group = viewport.querySelector('.dock-group');
    var thumb = group && group.querySelector('.dock-thumb');
    if (!thumb) return;
    var fromIndex = -1;
    var toIndex = -1;
    FILTERS.forEach(function (f, i) {
      if (f.key === fromKey) fromIndex = i;
      if (f.key === toKey) toIndex = i;
    });
    var target = tabMetrics(group, toIndex);
    if (!target) return;

    var prevTab = group.querySelectorAll('.dock-tab')[fromIndex];
    var nextTab = group.querySelectorAll('.dock-tab')[toIndex];
    if (prevTab && prevTab !== nextTab) prevTab.classList.add('fade-out');
    nextTab.classList.add('fade-in');
    var nextIco = nextTab.querySelector('.ico');
    if (nextIco) nextIco.classList.add('is-pop');

    pushContent(toIndex > fromIndex ? 1 : -1);

    if (prefersReducedMotion()) {
      paintThumb(thumb, target);
      thumbGeo = target;
      return;
    }
    animateThumb(thumb, fromGeo || target, target);
  }

  function renderAndTop() {
    render();
    viewport.scrollTop = 0;
  }

  function renderKeepScroll() {
    var top = viewport.scrollTop;
    render();
    viewport.scrollTop = top;
  }

  var ROUTES = ['timeline', 'list', 'grid', 'search'];

  function applyRoute() {
    var raw = location.hash.replace(/^#\/?/, '');
    if (raw.indexOf('detail/') === 0) {
      var id = decodeURIComponent(raw.split('/')[1] || '');
      state.view = 'detail';
      state.detailId = byId(id) ? id : 'tenchi';
      state.tagsOpen = false;
    } else {
      state.view = ROUTES.indexOf(raw) > -1 ? raw : 'timeline';
    }
  }

  function navigate(view, opts) {
    if (view === 'search') {
      openSearchSheet();
      return;
    }
    opts = opts || {};
    // 从搜索浮层进入详情时先收起浮层，背景页保留到 hash 切换
    if (sheet.open) teardownSheet();
    var from = state.view;
    if (view === 'detail' && from !== 'detail' && from !== 'search') {
      state.returnTo = from;
    }
    var hash;
    if (view === 'detail') {
      state.detailId = opts.id || state.detailId;
      state.tagsOpen = false;
      hash = '#/detail/' + encodeURIComponent(state.detailId);
    } else {
      state.view = view;
      hash = '#/' + view;
    }
    if (location.hash === hash) {
      applyRoute();
      renderAndTop();
    } else {
      location.hash = hash;
    }
  }

  function goBack() {
    if (sheet.open) {
      closeSearchSheet();
      return;
    }
    if (state.view === 'detail') {
      navigate(state.returnTo || 'timeline', { keepQuery: true });
    } else {
      navigate('timeline');
    }
  }

  function switchView() {
    var next = { timeline: 'list', list: 'grid', grid: 'timeline' }[state.view];
    if (!next) return;
    navigate(next);
  }

  var DAY_VIEWS = { timeline: true, list: true, grid: true };

  function setDay(day) {
    var next = Math.max(0, Math.min(window.WEEK.length - 1, day));
    if (next === state.day) return;
    state.day = next;
    renderAndTop();
  }

  window.addEventListener('hashchange', function () {
    applyRoute();
    // 点击搜索按钮后的首次 hash 变化：直接在当前背景页上挂载浮层
    if (sheet.pendingOpen && state.view === 'search') {
      sheet.pendingOpen = false;
      mountSheet(true);
      return;
    }
    if (sheet.open) {
      if (state.view === 'search') return;
      teardownSheet();
      renderAndTop();
      return;
    }
    // 刚从浮层返回来源页：背景 DOM 已存在，无需重绘，保留滚动位置
    if (sheet.domView && state.view === sheet.domView) {
      sheet.domView = '';
      return;
    }
    renderAndTop();
  });

  window.addEventListener('resize', function () {
    if (!thumbRaf) syncDockThumb();
  });

  device.addEventListener('click', function (e) {
    var target = e.target.closest('[data-action]');
    if (!target || !device.contains(target)) return;
    // 拖拽结束后紧跟着的 click 不再触发卡片跳转
    if (performance.now() < sheet.suppressClickUntil) return;
    var action = target.getAttribute('data-action');
    var id = target.getAttribute('data-id');

    if (action === 'open') {
      if (state.view === 'search' && state.q.trim()) rememberQuery(state.q);
      navigate('detail', { id: id });
    } else if (action === 'switch') {
      switchView();
    } else if (action === 'open-search') {
      openSearchSheet();
    } else if (action === 'close-search') {
      closeSearchSheet();
    } else if (action === 'back') {
      goBack();
    } else if (action === 'day') {
      setDay(parseInt(target.getAttribute('data-day'), 10) || 0);
    } else if (action === 'filter') {
      var nextFilter = target.getAttribute('data-filter');
      if (nextFilter === state.filter) return;
      var fromFilter = state.filter;
      var fromGeo = thumbGeo ? { left: thumbGeo.left, top: thumbGeo.top, width: thumbGeo.width, height: thumbGeo.height } : null;
      state.filter = nextFilter;
      renderKeepScroll();
      dockTransition(fromFilter, nextFilter, fromGeo);
    } else if (action === 'reset-filter') {
      state.filter = 'all';
      renderKeepScroll();
    } else if (action === 'keyword') {
      var keyword = target.getAttribute('data-q') || '';
      applyKeyword(keyword);
      rememberQuery(keyword);
    } else if (action === 'clear-search') {
      applyKeyword('');
      var input = document.getElementById('search-input');
      if (input) input.focus();
    } else if (action === 'clear-history') {
      state.history = [];
      updateSearchResults();
    } else if (action === 'expand-tags') {
      state.tagsOpen = !state.tagsOpen;
      renderKeepScroll();
    } else if (action === 'top') {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  var swipeStart = null;

  viewport.addEventListener('touchstart', function (e) {
    if (!DAY_VIEWS[state.view] || e.touches.length !== 1) { swipeStart = null; return; }
    swipeStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  viewport.addEventListener('touchend', function (e) {
    var start = swipeStart;
    swipeStart = null;
    if (!start || !DAY_VIEWS[state.view] || !e.changedTouches.length) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - start.x;
    var dy = t.clientY - start.y;
    // 横向位移超过 56px 且明显大于纵向位移才切换日期，避免干扰纵向滚动与点击
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    setDay(state.day + (dx < 0 ? 1 : -1));
  }, { passive: true });

  viewport.addEventListener('touchcancel', function () {
    swipeStart = null;
  }, { passive: true });

  /* ---------- 搜索浮层拖拽 ---------- */
  device.addEventListener('pointerdown', function (e) {
    if (!sheet.open || sheet.closing) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var t = e.target;
    var zone = t.closest('.sheet-grab-zone, .search-top');
    if (!zone) return;
    // 输入框与按钮区域不接管拖拽，避免抢走聚焦和点击
    if (t.closest('input, button, .search-field')) return;
    sheetPointer = e.pointerId;
    sheetDragStart(e.clientY);
    if (e.cancelable) e.preventDefault();
  });

  window.addEventListener('pointermove', function (e) {
    if (sheetPointer === null || e.pointerId !== sheetPointer) return;
    sheetDragMove(e.clientY);
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  function endSheetPointer(e) {
    if (sheetPointer === null || (e && e.pointerId !== sheetPointer)) return;
    sheetPointer = null;
    sheetDragEnd();
  }

  window.addEventListener('pointerup', endSheetPointer);
  window.addEventListener('pointercancel', endSheetPointer);

  device.addEventListener('focusin', function (e) {
    if (e.target && e.target.id === 'search-input') {
      var field = document.getElementById('search-field');
      if (field) field.classList.add('is-focus');
    }
  });

  device.addEventListener('focusout', function (e) {
    if (e.target && e.target.id === 'search-input') {
      var field = document.getElementById('search-field');
      if (field) field.classList.remove('is-focus');
    }
  });

  device.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'search-input') {
      state.q = e.target.value;
      updateSearchResults();
    }
  });

  device.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheet.open) {
      e.preventDefault();
      closeSearchSheet();
      return;
    }
    if (e.target && e.target.id === 'search-input') {
      if (e.key === 'Enter') {
        e.preventDefault();
        rememberQuery(state.q);
        e.target.blur();
      }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      var target = e.target.closest('[role="button"][data-action="open"]');
      if (target && !e.target.closest('button')) {
        e.preventDefault();
        navigate('detail', { id: target.getAttribute('data-id') });
      }
    }
  });

  applyRoute();
  render();
})();
