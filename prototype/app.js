/* 追番助手 · 静态可点击原型（纯前端假数据，无接口） */
(function () {
  'use strict';

  var viewport = document.getElementById('viewport');
  var toastEl = document.getElementById('toast');
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
    { key: 'all', label: '全部' },
    { key: 'anime', label: '番剧' },
    { key: 'guochuang', label: '国创' }
  ];

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var ICONS = {
    timeline: '<circle cx="4.5" cy="6.5" r="1.4"/><circle cx="4.5" cy="12" r="1.4"/><circle cx="4.5" cy="17.5" r="1.4"/><path d="M9 6.5h11M9 12h11M9 17.5h11"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    calendar7: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 9.5h17M13.2 12.4l-2 5M11.2 14h3.6"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.6 15.6L20 20"/>',
    back: '<path d="M14.5 5L7.5 12l7 7M7.8 12H20"/>',
    clock: '<circle cx="12" cy="12" r="8.3"/><path d="M12 7.7V12l2.9 1.8"/>',
    broadcast: '<circle cx="12" cy="12" r="1.7"/><path d="M8.4 8.6a5 5 0 0 0 0 6.8M15.6 8.6a5 5 0 0 1 0 6.8M5.7 5.9a8.5 8.5 0 0 0 0 12.2M18.3 5.9a8.5 8.5 0 0 1 0 12.2"/>',
    globe: '<circle cx="12" cy="12" r="8.3"/><path d="M3.7 12h16.6M12 3.7c2.5 2.6 3.7 5.4 3.7 8.3S14.5 17.7 12 20.3c-2.5-2.6-3.7-5.4-3.7-8.3S9.5 6.3 12 3.7z"/>',
    users: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.5-3.2 2.6-5 5.5-5s5 1.8 5.5 5"/><path d="M15.2 5.9a3 3 0 0 1 0 5.4M16.8 14.2c2.1.4 3.4 2 3.7 4.3"/>',
    shuffle: '<path d="M4 7h3.2c1.5 0 2.4.7 3.2 1.9l3.2 6.2c.8 1.2 1.7 1.9 3.2 1.9H20"/><path d="M17.5 14.7L20 17l-2.5 2.3M4 17h3.2c1.1 0 1.9-.4 2.6-1.2M14.3 8.2c.7-.8 1.5-1.2 2.5-1.2H20M17.5 4.7L20 7l-2.5 2.3"/>',
    info: '<circle cx="12" cy="12" r="8.3"/><path d="M12 11v5.2M12 7.8v.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrowUp: '<path d="M12 19V5M6.5 10.5L12 5l5.5 5.5"/>',
    book: '<path d="M4.5 5.5c2.4-.8 4.6-.3 7.5 1.2v12c-2.9-1.5-5.1-2-7.5-1.2zM19.5 5.5c-2.4-.8-4.6-.3-7.5 1.2v12c2.9-1.5 5.1-2 7.5-1.2z"/>',
    calendarX: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 9.5h17M9.5 13.5l5 4M14.5 13.5l-5 4"/>',
    x: '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>'
  };

  var ICON_ALIASES = { 'calendar-x': 'calendarX', 'arrow-up': 'arrowUp' };

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

  function ratingText(n) {
    return Number.isInteger(n) ? n.toFixed(1) : String(n);
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  function header() {
    var modes = {
      timeline: { icon: 'i-timeline', label: '切换到列表视图' },
      list: { icon: 'i-grid', label: '切换到网格视图' },
      grid: { icon: 'i-calendar7', label: '切换到时间线视图' }
    };
    var m = modes[state.view] || modes.timeline;
    return '' +
      '<header class="app-header">' +
        '<button class="icon-btn" data-action="switch" aria-label="' + m.label + '" title="' + m.label + '">' + icon(m.icon) + '</button>' +
        '<h1>番剧时间表</h1>' +
        '<button class="icon-btn" data-action="open-search" aria-label="搜索番剧" title="搜索番剧">' + icon('i-search') + '</button>' +
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
    return '<div class="filters" role="group" aria-label="筛选">' + FILTERS.map(function (f) {
      return '<button class="filter' + (state.filter === f.key ? ' active' : '') + '" data-action="filter" data-filter="' + f.key + '">' + f.label + '</button>';
    }).join('') + '</div>';
  }

  function dayBar() {
    return '<div class="day-bar">' +
      '<div class="day-label"><i class="day-dot"></i><span class="day-name">' + window.WEEK[state.day].label + '</span><span class="day-md">' + window.WEEK[state.day].md + '</span></div>' +
      filters() +
    '</div>';
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
    return '<div class="page page-timeline">' + header() + weekStrip() + dayBar() +
      '<div class="timeline-wrap' + (items.length ? '' : ' is-empty') + '">' + body + '</div><div class="page-pad"></div></div>';
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
    return '<div class="page page-list">' + header() + weekChips() +
      '<div class="list-body-wrap">' + body + '</div><div class="page-pad"></div></div>';
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
    return '<div class="page page-grid">' + header() + weekChips() +
      '<div class="grid-body">' + body + '</div><div class="page-pad"></div></div>';
  }

  function searchRow(a) {
    return '<article class="search-row" data-action="open" data-id="' + a.id + '" role="button" tabindex="0" aria-label="查看 ' + esc(a.title) + ' 详情">' +
      '<img src="' + esc(a.poster) + '" alt="' + esc(a.title) + '" loading="lazy">' +
      '<div class="search-row-body">' +
        '<h3>' + esc(a.title) + '</h3>' +
        (a.jp ? '<p>' + esc(a.jp) + '</p>' : '') +
        '<div class="search-row-meta">' +
          '<span>' + window.WEEK[a.day].label + ' ' + a.time + '</span>' +
          '<span class="dot-sep"></span>' +
          '<span>' + (a.category === 'guochuang' ? '国创' : '番剧') + '</span>' +
          '<span class="dot-sep"></span>' +
          '<span>第' + a.ep + '话</span>' +
        '</div>' +
      '</div>' +
      '<span class="row-chev">›</span>' +
    '</article>';
  }

  function historyHTML() {
    var items = state.history;
    return '<section class="search-section">' +
        '<div class="section-head">' +
          '<h2 class="section-title">搜索历史</h2>' +
          (items.length ? '<button class="section-action" data-action="clear-history">清空</button>' : '') +
        '</div>' +
        (items.length
          ? '<div class="history-tags">' + items.map(function (k) {
              return '<button class="history-tag" data-action="keyword" data-q="' + esc(k) + '">' + esc(k) + '</button>';
            }).join('') + '</div>'
          : '<p class="history-empty">暂无搜索记录</p>') +
      '</section>';
  }

  function rememberQuery(q) {
    q = String(q || '').trim();
    if (!q) return;
    state.history = [q].concat(state.history.filter(function (h) { return h !== q; })).slice(0, 8);
  }

  function searchResultsHTML() {
    var q = state.q.trim().toLowerCase();
    if (!q) return historyHTML();
    var results = window.ANIME.filter(function (a) {
      var pool = [a.title, a.jp, a.studio, a.season, a.category === 'guochuang' ? '国创 国漫' : '番剧'].concat(a.tags, a.extraTags || [], a.genres).join(' ').toLowerCase();
      return pool.indexOf(q) > -1;
    });
    if (!results.length) return emptyState('search');
    return '<div class="search-count">找到 <b>' + results.length + '</b> 部番剧</div>' +
      '<div class="search-list">' + results.map(searchRow).join('') + '</div>';
  }

  function renderSearch() {
    return '<div class="page page-search">' +
      '<header class="app-header search-header">' +
        '<button class="icon-btn" data-action="back" aria-label="返回">' + icon('i-back') + '</button>' +
        '<div class="search-box">' + icon('i-search', 'search-box-ico') +
          '<input id="search-input" type="text" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="搜索番剧、制作、标签" value="' + esc(state.q) + '" aria-label="搜索番剧">' +
          '<button class="search-clear" id="search-clear" data-action="clear-search" aria-label="清空搜索"' + (state.q ? '' : ' hidden') + '>' + icon('i-x') + '</button>' +
        '</div>' +
      '</header>' +
      '<div class="search-body" id="search-results">' + searchResultsHTML() + '</div>' +
      '<div class="page-pad"></div>' +
    '</div>';
  }

  function originLabel(a) {
    if (a.tags.indexOf('漫画改') > -1 || a.tags.indexOf('漫改') > -1) return '漫画改编';
    if (a.tags.indexOf('轻改') > -1) return '轻小说改编';
    return '原创动画';
  }

  function renderDetail() {
    var a = byId(state.detailId) || byId('tenchi');
    var allTags = a.tags.concat(a.extraTags || []);
    var visibleTags = state.tagsOpen ? allTags : allTags.slice(0, 6);
    var next = a.next;
    var ratingLabels = ['MAL评分', 'Bangumi评分', 'AS评分', 'TMDB评分'];
    var rows = [
      ['集数', a.totalEps],
      ['季度', a.season],
      ['放送状态', a.status],
      ['制作', a.studio],
      ['类型', a.genres.join(' / ')],
      ['放送时段', window.WEEK[a.day].label + ' ' + a.time]
    ];
    var actionBtns = [
      { ico: 'i-info', action: 'scroll-info', label: '作品信息', active: true },
      { ico: 'i-users', action: 'demo', label: '角色列表', msg: '角色列表为演示占位，未接入真实数据' },
      { ico: 'i-shuffle', action: 'demo', label: '相关推荐', msg: '相关推荐为演示占位，未接入真实数据' }
    ];
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
        '<div class="ratings">' + a.ratings.map(function (v, i) {
          return '<div class="rating"><b>' + ratingText(v) + '</b><span>' + ratingLabels[i] + '</span></div>';
        }).join('') + '</div>' +
        '<div class="next-card">' +
          '<div class="next-ico">' + icon('i-clock') + '</div>' +
          '<div class="next-main"><div class="next-title">下一集 <b>第' + next.ep + '集</b> / 共' + next.total + '集</div><div class="next-sub">' + esc(next.date) + ' 放送（北京时间）</div></div>' +
          '<div class="next-right"><span>距开播</span><b>' + esc(next.countdown) + '</b></div>' +
        '</div>' +
        '<p class="synopsis">' + esc(a.synopsis) + '</p>' +
        '<div class="detail-actions">' + actionBtns.map(function (b) {
          return '<button class="act-btn' + (b.active ? ' active' : '') + '" data-action="' + b.action + '"' + (b.msg ? ' data-msg="' + b.msg + '"' : '') + ' aria-label="' + b.label + '">' + icon(b.ico) + '</button>';
        }).join('') + '</div>' +
      '</div>' +

      '<section class="detail-section" id="detail-info">' +
        '<h2>信息</h2>' +
        '<div class="origin-badge">' + icon('i-book') + originLabel(a) + '</div>' +
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

  function render() {
    if (state.view === 'timeline') viewport.innerHTML = renderTimeline();
    else if (state.view === 'list') viewport.innerHTML = renderList();
    else if (state.view === 'grid') viewport.innerHTML = renderGrid();
    else if (state.view === 'search') viewport.innerHTML = renderSearch();
    else viewport.innerHTML = renderDetail();

    var a = byId(state.detailId);
    document.title = state.view === 'detail' && a ? '追番助手 · ' + a.title
      : state.view === 'search' ? '追番助手 · 搜索'
      : '追番助手 · 番剧时间表';
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
    opts = opts || {};
    var from = state.view;
    if ((view === 'detail' || view === 'search') && from !== 'detail' && from !== 'search') {
      state.returnTo = from;
    }
    var hash;
    if (view === 'detail') {
      state.detailId = opts.id || state.detailId;
      state.tagsOpen = false;
      hash = '#/detail/' + encodeURIComponent(state.detailId);
    } else {
      if (view === 'search' && !opts.keepQuery) state.q = '';
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
    if (state.view === 'detail' || state.view === 'search') {
      navigate(state.returnTo || 'timeline', { keepQuery: true });
    } else {
      navigate('timeline');
    }
  }

  function switchView() {
    var next = { timeline: 'list', list: 'grid', grid: 'timeline' }[state.view];
    if (!next) return;
    if (state.view === 'timeline' && next !== 'timeline') state.filter = 'all';
    navigate(next);
  }

  window.addEventListener('hashchange', function () {
    applyRoute();
    renderAndTop();
  });

  viewport.addEventListener('click', function (e) {
    var target = e.target.closest('[data-action]');
    if (!target || !viewport.contains(target)) return;
    var action = target.getAttribute('data-action');
    var id = target.getAttribute('data-id');

    if (action === 'open') {
      if (state.view === 'search' && state.q.trim()) rememberQuery(state.q);
      navigate('detail', { id: id });
    } else if (action === 'switch') {
      switchView();
    } else if (action === 'open-search') {
      navigate('search');
    } else if (action === 'back') {
      goBack();
    } else if (action === 'day') {
      state.day = parseInt(target.getAttribute('data-day'), 10) || 0;
      renderAndTop();
    } else if (action === 'filter') {
      state.filter = target.getAttribute('data-filter');
      renderKeepScroll();
    } else if (action === 'reset-filter') {
      state.filter = 'all';
      renderKeepScroll();
    } else if (action === 'keyword') {
      applyKeyword(target.getAttribute('data-q') || '');
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
    } else if (action === 'scroll-info') {
      var info = document.getElementById('detail-info');
      if (info) info.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (action === 'top') {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (action === 'demo') {
      showToast(target.getAttribute('data-msg') || '该能力为原型占位');
    }
  });

  viewport.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'search-input') {
      state.q = e.target.value;
      updateSearchResults();
    }
  });

  viewport.addEventListener('keydown', function (e) {
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
