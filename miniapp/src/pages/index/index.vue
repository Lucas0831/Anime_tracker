<template>
  <view
    class="page"
    :class="pageClass"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchCancel"
  >
    <view class="top-bar" :class="{ 'is-fixed': state.view === 'timeline' }">
      <view class="app-header">
        <view class="header-row">
          <view class="icon-btn" :aria-label="mode.label" @tap="switchView">
            <AppIcon :name="mode.icon" :size="42" />
          </view>
          <text class="app-title">{{ mode.title }}</text>
          <view class="icon-btn" aria-label="搜索番剧" @tap="openSearch">
            <AppIcon name="search" :size="42" />
          </view>
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
        <view class="filters" role="group" aria-label="筛选">
          <view
            v-for="f in FILTERS"
            :key="f.key"
            class="filter"
            :class="{ active: state.filter === f.key }"
            @tap="state.filter = f.key"
          >{{ f.label }}</view>
        </view>
      </view>
    </view>

    <view v-if="state.view === 'timeline'" class="timeline-wrap" :class="{ 'is-empty': !items.length }">
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
      <EmptyState v-else :kind="state.filter === 'all' ? 'day' : 'filter'" @reset="state.filter = 'all'" />
    </view>

    <view v-else-if="state.view === 'list'" class="list-body-wrap">
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
      <EmptyState v-if="!items.length" :kind="state.filter === 'all' ? 'day' : 'filter'" @reset="state.filter = 'all'" />
    </view>

    <view v-else class="grid-body">
      <view v-if="items.length" class="grid-wrap">
        <view v-for="a in items" :key="a.id" class="grid-card" @tap="openDetail(a.id)">
          <view class="grid-cover">
            <image class="grid-cover-img" :src="a.poster" mode="aspectFill" />
            <text class="grid-time">{{ a.time }} 播放</text>
          </view>
          <text class="grid-title">{{ a.title }}</text>
        </view>
      </view>
      <EmptyState v-else :kind="state.filter === 'all' ? 'day' : 'filter'" @reset="state.filter = 'all'" />
    </view>

    <view class="page-pad"></view>
  </view>
</template>

<script setup>
  import { computed } from 'vue';
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
