<template>
  <view
    class="page"
    :class="pageClass"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchCancel"
  >
    <view class="top-bar">
      <view class="app-header">
        <view class="header-row">
          <view class="icon-btn" :aria-label="mode.label" @tap="switchView">
            <AppIcon :name="mode.icon" :size="42" />
          </view>
          <text class="app-title">{{ mode.title }}</text>
          <view class="header-spacer"></view>
        </view>
      </view>

      <view v-if="state.view === 'timeline'" class="week-strip" aria-label="本周日期">
        <view
          v-for="(d, i) in WEEK"
          :key="d.date"
          class="week-cell"
          :class="{ active: i === state.day }"
          @tap="state.day = i"
        >
          <text class="week-date">{{ d.md }}</text>
          <text class="week-day">{{ d.label.slice(1) }}</text>
          <view v-if="i === state.day" class="today-dot"></view>
        </view>
      </view>

      <view v-else class="week-chips" aria-label="本周日期">
        <view
          v-for="(d, i) in WEEK"
          :key="d.date"
          class="week-chip"
          :class="{ active: i === state.day }"
          @tap="state.day = i"
        >{{ d.label }}</view>
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
</template>

<script setup>
  import { computed, getCurrentInstance, nextTick, onMounted, reactive, ref } from 'vue';
  import AppIcon from '../../components/AppIcon.vue';
  import EmptyState from '../../components/EmptyState.vue';
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

  onMounted(() => {
    nextTick(measureTabs);
    setTimeout(measureTabs, 120);
  });

  const NEXT_VIEW = { timeline: 'list', list: 'grid', grid: 'timeline' };

  function switchView() {
    state.view = NEXT_VIEW[state.view] || 'timeline';
  }

  function openSearch() {
    uni.navigateTo({ url: '/pages/search/search' });
  }

  function openDetail(id) {
    uni.navigateTo({ url: '/pages/detail/detail?id=' + id });
  }

  let swipeStart = null;

  function setDay(day) {
    state.day = Math.max(0, Math.min(WEEK.length - 1, day));
  }

  function onTouchStart(e) {
    const t = e.touches && e.touches[0];
    swipeStart = t ? { x: t.clientX, y: t.clientY } : null;
  }

  function onTouchEnd(e) {
    const start = swipeStart;
    swipeStart = null;
    if (!start) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // 横向位移超过 56px 且明显大于纵向位移才切换日期，避免干扰纵向滚动与点击
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    setDay(state.day + (dx < 0 ? 1 : -1));
  }

  function onTouchCancel() {
    swipeStart = null;
  }
</script>
