<template>
  <view class="page-shell">
    <page-meta :page-style="searchOpen ? 'overflow: hidden;' : ''"></page-meta>

    <view
      class="page"
      :class="pageClass"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchCancel"
    >
    <view class="top-bar">
      <view class="app-header" :style="headerPad">
        <view class="header-row" :style="headerRow">
          <view class="icon-btn" :aria-label="mode.label" @tap="switchView">
            <AppIcon :name="mode.icon" :size="42" />
          </view>
          <text class="app-title">{{ mode.title }}</text>
          <view class="header-spacer"></view>
        </view>
      </view>

      <view class="week-tabs" aria-label="本周星期">
        <view class="week-track">
          <view class="week-underline" :style="underlineStyle"></view>
          <view
            v-for="(d, i) in WEEK"
            :key="d.date"
            class="week-tab"
            :style="tabStyle(i)"
            @tap="selectDay(i)"
          >{{ d.label }}</view>
        </view>
      </view>

      <view v-if="state.view === 'timeline'" class="day-bar">
        <view class="day-label">
          <view class="day-dot"></view>
          <text class="day-name">{{ WEEK[state.day].label }}</text>
          <text class="day-md">{{ WEEK[state.day].md }}</text>
        </view>
      </view>
    </view>

    <view v-if="state.view === 'timeline'" class="timeline-wrap" :class="{ 'is-empty': !items.length }" :style="pushStyle">
      <template v-if="items.length">
        <view v-for="g in groups" :key="g.time" class="tl-group">
          <view class="tl-rail">
            <view class="tl-dot"></view>
            <text class="tl-time">{{ g.time }}</text>
          </view>
          <view class="tl-items">
            <view
              v-for="a in g.list"
              :key="a.id"
              class="tl-item"
              @tap="openDetail(a.id)"
            >
              <image class="tl-poster" :src="a.poster" mode="aspectFill" />
              <view class="tl-body">
                <text class="tl-title">{{ a.title }}</text>
                <text class="tl-ep">第{{ a.ep }}话</text>
                <view class="tl-tags">
                  <text v-for="t in a.tags.slice(0, 2)" :key="t" class="tag-outline">{{ t }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </template>
      <EmptyState v-else :kind="state.filter === 'all' ? 'day' : 'filter'" @reset="resetFilter" />
    </view>

    <view v-else-if="state.view === 'list'" class="list-body-wrap" :style="pushStyle">
      <view
        v-for="a in items"
        :key="a.id"
        class="list-card"
        @tap="openDetail(a.id)"
      >
        <image class="list-poster" :src="a.poster" mode="aspectFill" />
        <view class="list-body">
          <text class="list-title">{{ a.title }}</text>
          <text v-if="a.jp" class="list-jp">{{ a.jp }}</text>
          <view class="list-meta">
            <view class="meta-chip">
              <AppIcon name="clock" color="#8e8e94" :size="26" />
              <text>{{ a.time }} {{ dayStatus(a) }}</text>
            </view>
            <view class="meta-chip">
              <text class="hash">#</text>
              <text>第{{ a.ep }}集</text>
            </view>
            <view v-if="a.category === 'guochuang'" class="meta-chip">
              <AppIcon name="globe" color="#8e8e94" :size="26" />
              <text>国漫</text>
            </view>
          </view>
        </view>
      </view>
      <EmptyState v-if="!items.length" :kind="state.filter === 'all' ? 'day' : 'filter'" @reset="resetFilter" />
    </view>

    <view v-else class="grid-body" :style="pushStyle">
      <view v-if="items.length" class="grid-wrap">
        <view v-for="a in items" :key="a.id" class="grid-card" @tap="openDetail(a.id)">
          <view class="grid-cover">
            <image class="grid-cover-img" :src="a.poster" mode="aspectFill" />
            <text class="grid-time">{{ a.time }} 播放</text>
          </view>
          <text class="grid-title">{{ a.title }}</text>
        </view>
      </view>
      <EmptyState v-else :kind="state.filter === 'all' ? 'day' : 'filter'" @reset="resetFilter" />
    </view>

    <view class="bottom-dock" aria-label="底部导航">
      <view class="dock-group" role="group" aria-label="筛选">
        <view class="dock-thumb" :style="thumbStyle" aria-hidden="true"></view>
        <view
          v-for="f in FILTERS"
          :key="f.key"
          class="dock-tab"
          :class="{ active: state.filter === f.key }"
          @tap="selectFilter(f.key)"
        >
          <view class="dock-ico" :class="{ 'is-pop': popKey === f.key }">
            <AppIcon :name="f.icon" :size="40" :color="state.filter === f.key ? '#0a84ff' : '#1d1d20'" />
          </view>
          <text class="dock-label">{{ f.label }}</text>
        </view>
      </view>
      <view class="dock-search" aria-label="搜索番剧" @tap="openSearch">
        <AppIcon name="search" :size="46" />
      </view>
    </view>

    <view class="page-pad"></view>
    </view>

    <SearchSheet :open="searchOpen" @close="closeSearch" @open-detail="onSheetDetail" />
  </view>
</template>

<script setup>
  import { computed, getCurrentInstance, nextTick, onMounted, reactive, ref, watch } from 'vue';
  import AppIcon from '../../components/AppIcon.vue';
  import EmptyState from '../../components/EmptyState.vue';
  import SearchSheet from '../../components/SearchSheet.vue';
  import {
    FILTERS,
    MODES,
    WEEK,
    state,
    showsForDay,
    dayStatus
  } from '../../store';

  const mode = computed(() => MODES[state.view] || MODES.timeline);
  const pageClass = computed(() => 'page-' + state.view);
  const items = computed(() => showsForDay(state.day, state.filter));
  // 搜索浮层：与主页面同处一页，背景页保持原尺寸、仅被遮罩压暗
  const searchOpen = ref(false);

  const groups = computed(() => {
    const result = [];
    items.value.forEach((a) => {
      let group = result.filter((g) => g.time === a.time)[0];
      if (!group) {
        group = { time: a.time, list: [] };
        result.push(group);
      }
      group.list.push(a);
    });
    return result;
  });

  /* ---------- 底部胶囊液态动效 ---------- */
  const instance = getCurrentInstance();
  const thumb = reactive({ left: 0, top: 0, width: 0, height: 0 });
  const thumbStyle = computed(() => ({
    left: thumb.left + 'px',
    top: thumb.top + 'px',
    width: thumb.width + 'px',
    height: thumb.height + 'px'
  }));
  const pushStyle = reactive({ opacity: '', transform: '', transition: '' });
  const popKey = ref('');
  const tabRects = {};
  let thumbAnimating = false;
  let rafId = 0;
  let lastFrame = 0;

  function nowMs() {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  }

  function raf(cb) {
    return typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : setTimeout(cb, 16);
  }

  function caf(id) {
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id);
    else clearTimeout(id);
  }

  function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function measureTabs() {
    const query = uni.createSelectorQuery().in(instance.proxy);
    query.select('.dock-group').boundingClientRect();
    query.selectAll('.dock-tab').boundingClientRect();
    query.exec((res) => {
      const group = res[0];
      const tabs = res[1] || [];
      if (!group || !tabs.length) return;
      tabs.forEach((r, i) => {
        tabRects[FILTERS[i].key] = {
          left: r.left - group.left,
          top: r.top - group.top,
          width: r.width,
          height: r.height
        };
      });
      if (!thumbAnimating) {
        const rect = tabRects[state.filter];
        if (rect) Object.assign(thumb, rect);
      }
    });
  }

  function springStep(edge, target, stiffness, damping, dt) {
    const accel = (target - edge.v) * stiffness - edge.vel * damping;
    edge.vel += accel * dt;
    edge.v += edge.vel * dt;
  }

  // 前沿与后沿各自用弹簧追赶目标：前沿更快到位，后沿稍慢并轻微回弹，中途被拉长、压扁
  function animateThumb(start, target) {
    if (rafId) caf(rafId);
    const rightward = target.left >= start.left;
    const leadFrom = rightward ? start.left + start.width : start.left;
    const leadTo = rightward ? target.left + target.width : target.left;
    const trailFrom = rightward ? start.left : start.left + start.width;
    const trailTo = rightward ? target.left : target.left + target.width;
    const lead = { v: leadFrom, vel: 0 };
    const trail = { v: trailFrom, vel: 0 };
    const baseHeight = target.height;
    const startedAt = nowMs();
    lastFrame = startedAt;
    thumbAnimating = true;

    function frame() {
      const now = nowMs();
      const dt = Math.min(34, now - lastFrame) / 1000;
      lastFrame = now;
      springStep(lead, leadTo, 420, 30, dt);
      springStep(trail, trailTo, 220, 20, dt);

      const settled = Math.abs(lead.v - leadTo) < 0.25 && Math.abs(lead.vel) < 0.35 &&
        Math.abs(trail.v - trailTo) < 0.25 && Math.abs(trail.vel) < 0.35;
      if (settled || now - startedAt > 420) {
        thumb.left = target.left;
        thumb.top = target.top;
        thumb.width = target.width;
        thumb.height = baseHeight;
        thumbAnimating = false;
        rafId = 0;
        return;
      }

      const width = Math.max(24, Math.abs(lead.v - trail.v));
      const stretch = target.width ? Math.max(0, width - target.width) / target.width : 0;
      const height = baseHeight * (1 - Math.min(0.1, stretch * 0.5));
      thumb.left = Math.min(lead.v, trail.v);
      thumb.width = width;
      thumb.height = height;
      thumb.top = target.top + (baseHeight - height) / 2;
      rafId = raf(frame);
    }

    rafId = raf(frame);
  }

  // 页面内容沿点击方向轻推淡入
  let pushToken = 0;

  function pushContent(dir) {
    if (prefersReducedMotion()) return;
    const token = ++pushToken;
    pushStyle.transition = 'none';
    pushStyle.opacity = '0';
    pushStyle.transform = 'translateX(' + dir * 14 + 'px)';
    nextTick(() => {
      setTimeout(() => {
        if (token !== pushToken) return;
        pushStyle.transition = 'transform 0.34s cubic-bezier(0.22, 0.9, 0.24, 1), opacity 0.28s ease';
        pushStyle.opacity = '1';
        pushStyle.transform = 'translateX(0)';
        setTimeout(() => {
          if (token !== pushToken) return;
          pushStyle.transition = '';
          pushStyle.opacity = '';
          pushStyle.transform = '';
        }, 380);
      }, 24);
    });
  }

  function selectFilter(key) {
    if (key === state.filter) return;
    const fromKey = state.filter;
    const fromIndex = FILTERS.findIndex((f) => f.key === fromKey);
    const toIndex = FILTERS.findIndex((f) => f.key === key);
    const start = { left: thumb.left, top: thumb.top, width: thumb.width, height: thumb.height };
    state.filter = key;
    popKey.value = key;
    pushContent(toIndex > fromIndex ? 1 : -1);

    const target = tabRects[key];
    if (!target) {
      nextTick(measureTabs);
      return;
    }
    if (prefersReducedMotion() || !start.width) {
      Object.assign(thumb, target);
      return;
    }
    animateThumb(start, target);
  }

  function resetFilter() {
    selectFilter('all');
  }

  /* ---------- 顶栏与原生胶囊对齐 ---------- */
  const headerPad = ref({});
  const headerRow = ref({});

  // 用状态栏高度 + 胶囊按钮位置反推标题行高度，使标题中线与胶囊中线重合
  function syncHeaderMetrics() {
    try {
      const statusBar = uni.getSystemInfoSync().statusBarHeight || 0;
      if (statusBar) headerPad.value = { paddingTop: statusBar + 'px' };
      const rect = typeof wx !== 'undefined' && wx.getMenuButtonBoundingClientRect
        ? wx.getMenuButtonBoundingClientRect()
        : null;
      if (rect && rect.height) {
        const topGap = Math.max(0, rect.top - statusBar);
        headerRow.value = { height: topGap * 2 + rect.height + 'px' };
      }
    } catch (e) {
      // 取不到胶囊位置时沿用样式中的默认行高
    }
  }

  onMounted(() => {
    syncHeaderMetrics();
    nextTick(measureTabs);
    setTimeout(measureTabs, 120);
    nextTick(measureSeg);
    setTimeout(measureSeg, 120);
  });

  const NEXT_VIEW = { timeline: 'list', list: 'grid', grid: 'timeline' };

  function switchView() {
    state.view = NEXT_VIEW[state.view] || 'timeline';
    setTimeout(measureSeg, 60);
  }

  function openSearch() {
    state.q = '';
    searchOpen.value = true;
  }

  function closeSearch() {
    searchOpen.value = false;
    setTimeout(() => {
      if (!searchOpen.value) state.q = '';
    }, 520);
  }

  function onSheetDetail(id) {
    searchOpen.value = false;
    state.q = '';
    uni.navigateTo({ url: '/pages/detail/detail?id=' + id });
  }

  function openDetail(id) {
    uni.navigateTo({ url: '/pages/detail/detail?id=' + id });
  }

  /* ---------- 星期分段标签：跟手下划线 + 毛毛虫伸缩 ---------- */
  const seg = reactive({ left: 0, width: 0, pos: null, ready: false });
  const segRects = [];
  let segPitch = 1;
  let segBaseW = 28;
  let segRaf = 0;
  let segMeasuring = false;
  let drag = null;
  let pendingFrom = null;
  let suppressTapUntil = 0;

  const underlineStyle = computed(() => ({
    left: seg.left + 'px',
    width: seg.width + 'px',
    opacity: seg.ready ? 1 : 0
  }));

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function segCenter(i) {
    const r = segRects[i];
    return r ? r.left + r.width / 2 : 0;
  }

  function segBaseLeft(i) {
    return segCenter(i) - segBaseW / 2;
  }

  // 文字颜色与字重按与下划线中心的距离平滑过渡
  function tabStyle(i) {
    const p = seg.pos === null ? state.day : seg.pos;
    const raw = Math.max(0, 1 - Math.abs(i - p));
    const f = raw * raw * (3 - 2 * raw);
    const r = Math.round(98 + (17 - 98) * f);
    const b = Math.round(106 + (17 - 106) * f);
    return {
      color: 'rgb(' + r + ',' + r + ',' + b + ')',
      fontWeight: String(Math.round(400 + 300 * f))
    };
  }

  function measureSeg() {
    if (segMeasuring) return;
    segMeasuring = true;
    const query = uni.createSelectorQuery().in(instance.proxy);
    query.select('.week-track').boundingClientRect();
    query.selectAll('.week-tab').boundingClientRect();
    query.exec((res) => {
      segMeasuring = false;
      const track = res[0];
      const tabs = res[1] || [];
      if (!track || tabs.length !== WEEK.length) return;
      segRects.length = 0;
      tabs.forEach((r) => segRects.push({ left: r.left - track.left, width: r.width }));
      segPitch = tabs.reduce((sum, r) => sum + r.width, 0) / tabs.length;
      const win = uni.getSystemInfoSync().windowWidth || 375;
      // 56rpx 的下划线宽度，按屏宽换算成 px，并留出格内边距
      segBaseW = Math.max(18, Math.min(segPitch - 12, Math.round((56 * win) / 750)));
      if (seg.pos === null) {
        seg.left = segBaseLeft(state.day);
        seg.width = segBaseW;
      }
      seg.ready = true;
    });
  }

  // 拖动时前缘快、后缘慢：中途被拉长，落点时收回到标签宽度
  function dragGeometry(p, rightward) {
    const max = WEEK.length - 1;
    const x = clamp(p, 0, max);
    const i0 = Math.min(max, Math.floor(x));
    const i1 = Math.min(max, i0 + 1);
    const u = x - i0;
    let lead;
    let trail;
    if (rightward) {
      const eo = 1 - (1 - u) * (1 - u);
      const ei = u * u;
      lead = segBaseLeft(i0) + segBaseW + (segBaseLeft(i1) - segBaseLeft(i0)) * eo;
      trail = segBaseLeft(i0) + (segBaseLeft(i1) - segBaseLeft(i0)) * ei;
    } else {
      const w = 1 - u;
      const eo = 1 - (1 - w) * (1 - w);
      const ei = w * w;
      lead = segBaseLeft(i1) + (segBaseLeft(i0) - segBaseLeft(i1)) * eo;
      trail = segBaseLeft(i1) + segBaseW + (segBaseLeft(i0) - segBaseLeft(i1)) * ei;
    }
    return {
      left: Math.min(lead, trail),
      width: Math.max(8, Math.abs(trail - lead))
    };
  }

  function animateSeg(target, fromPos) {
    if (segRaf) caf(segRaf);
    segRaf = 0;
    const toLeft = segBaseLeft(target);
    const startLeft = seg.left;
    const startWidth = Math.max(8, seg.width);
    const startAt = nowMs();

    if (prefersReducedMotion() || !segRects.length) {
      seg.left = toLeft;
      seg.width = segBaseW;
      seg.pos = null;
      return;
    }

    const rightward = target >= fromPos;
    const lead = { v: rightward ? startLeft + startWidth : startLeft, vel: 0 };
    const trail = { v: rightward ? startLeft : startLeft + startWidth, vel: 0 };
    const leadTo = rightward ? toLeft + segBaseW : toLeft;
    const trailTo = rightward ? toLeft : toLeft + segBaseW;
    const center0 = segCenter(0);
    let last = startAt;

    function frame() {
      const now = nowMs();
      const dt = Math.min(34, now - last) / 1000;
      last = now;
      springStep(lead, leadTo, 420, 28, dt);
      springStep(trail, trailTo, 240, 20, dt);

      const settled = Math.abs(lead.v - leadTo) < 0.35 && Math.abs(lead.vel) < 0.4 &&
        Math.abs(trail.v - trailTo) < 0.35 && Math.abs(trail.vel) < 0.4;
      if (settled || now - startAt > 620) {
        seg.left = toLeft;
        seg.width = segBaseW;
        seg.pos = null;
        segRaf = 0;
        return;
      }

      const left = Math.min(lead.v, trail.v);
      const width = Math.max(8, Math.abs(trail.v - lead.v));
      seg.left = left;
      seg.width = width;
      // 文字明暗由下划线中心反推，保证与下划线同步收尾
      seg.pos = clamp((left + width / 2 - center0) / segPitch, 0, WEEK.length - 1);
      segRaf = raf(frame);
    }

    segRaf = raf(frame);
  }

  watch(
    () => state.day,
    (to, from) => {
      if (!seg.ready) return;
      const fromPos = pendingFrom === null ? from : pendingFrom;
      pendingFrom = null;
      pushContent(to > fromPos ? 1 : -1);
      animateSeg(to, fromPos);
    }
  );

  function selectDay(i) {
    if (nowMs() < suppressTapUntil || i === state.day) return;
    state.day = i;
  }

  function onTouchStart(e) {
    const t = e.touches && e.touches[0];
    drag = t
      ? { x: t.clientX, y: t.clientY, active: false, anchor: state.day, lastX: t.clientX, lastT: nowMs(), vx: 0 }
      : null;
  }

  function onTouchMove(e) {
    if (!drag) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    const dx = t.clientX - drag.x;
    const dy = t.clientY - drag.y;

    if (!drag.active) {
      // 横向位移明显大于纵向才接管，避免抢走纵向滚动
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.15) {
        if (Math.abs(dy) > 8) drag = null;
        return;
      }
      if (!seg.ready) measureSeg();
      if (segRaf) {
        caf(segRaf);
        segRaf = 0;
        seg.pos = null;
        seg.left = segBaseLeft(state.day);
        seg.width = segBaseW;
      }
      drag.active = true;
      seg.pos = drag.anchor;
    }

    const now = nowMs();
    const dt = now - drag.lastT;
    if (dt > 0) {
      drag.vx = drag.vx * 0.6 + ((t.clientX - drag.lastX) / dt) * 0.4;
      drag.lastX = t.clientX;
      drag.lastT = now;
    }

    // 单次滑动最多只跨到相邻一天：下划线跟手时限制在 anchor ± 1 格内
    const lo = Math.max(0, drag.anchor - 1);
    const hi = Math.min(WEEK.length - 1, drag.anchor + 1);
    const p = clamp(drag.anchor - dx / segPitch, lo, hi);
    const rightward = p >= (seg.pos === null ? drag.anchor : seg.pos);
    seg.pos = p;
    const geo = dragGeometry(p, rightward);
    seg.left = geo.left;
    seg.width = geo.width;
  }

  function onTouchEnd(e) {
    const d = drag;
    drag = null;
    if (!d || !d.active) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;

    const dx = t.clientX - d.x;
    // 单次手势最多切到相邻一天，速度再快也不跨格
    const lo = Math.max(0, d.anchor - 1);
    const hi = Math.min(WEEK.length - 1, d.anchor + 1);
    const p = clamp(d.anchor - dx / segPitch, lo, hi);
    // 距离 + 速度投影（最多再滑 1 格），松手吸附到最近的一格
    const kick = clamp((d.vx * 0.06) / segPitch, -1, 1);
    const target = clamp(Math.round(p + kick), lo, hi);

    suppressTapUntil = nowMs() + 260;
    if (target === state.day) {
      animateSeg(state.day, p);
      return;
    }
    pendingFrom = p;
    state.day = target;
  }

  function onTouchCancel() {
    const d = drag;
    drag = null;
    if (!d || !d.active) return;
    animateSeg(state.day, seg.pos === null ? d.anchor : seg.pos);
  }
</script>

