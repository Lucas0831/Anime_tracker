<template>
  <view class="page page-search">
    <view class="search-top">
      <view class="search-nav">
        <view class="icon-btn" aria-label="返回" @tap="goBack">
          <AppIcon name="back" :size="42" />
        </view>
      </view>

      <view class="search-field" :class="{ 'is-focus': focused }">
        <view class="search-field-icon">
          <AppIcon name="search" :color="focused ? '#0a84ff' : '#8e8e94'" :size="34" />
        </view>
        <input
          class="search-input"
          type="text"
          confirm-type="search"
          :focus="false"
          placeholder="搜索番剧、制作、标签"
          placeholder-class="search-placeholder"
          aria-label="搜索番剧"
          v-model="state.q"
          @focus="focused = true"
          @blur="focused = false"
          @confirm="onConfirm"
        />
        <view
          v-show="state.q"
          class="search-clear"
          aria-label="清空搜索"
          @tap="clearQuery"
        >
          <AppIcon name="x" color="#8e8e94" :size="28" />
        </view>
      </view>
    </view>

    <view class="search-body">
      <template v-if="!keyword">
        <view class="search-section">
          <view class="section-head">
            <text class="section-title">最近搜索</text>
            <view class="section-rule"></view>
            <view v-if="state.history.length" class="section-action" @tap="clearHistory">清空</view>
          </view>

          <view v-if="state.history.length" class="search-panel">
            <view
              v-for="k in state.history"
              :key="k"
              class="history-row"
              @tap="useKeyword(k)"
            >
              <view class="history-ico">
                <AppIcon name="clock" color="#8e8e94" :size="28" />
              </view>
              <text class="history-text">{{ k }}</text>
              <AppIcon name="arrowUpRight" color="#a3a3ab" :size="28" />
            </view>
          </view>
          <view v-else class="history-blank">
            <AppIcon name="clock" color="#adadb5" :size="34" />
            <text class="history-blank-text">还没有搜索记录，试试下面的标签</text>
          </view>
        </view>

        <view class="search-section">
          <view class="section-head">
            <text class="section-title">按标签探索</text>
            <view class="section-rule"></view>
            <text class="section-note">{{ suggestTags.length }} 个标签</text>
          </view>

          <view class="suggest-cloud">
            <view
              v-for="t in suggestTags"
              :key="t.name"
              class="tag-chip"
              @tap="useKeyword(t.name)"
            >
              <text class="tag-chip-name">{{ t.name }}</text>
              <text class="tag-chip-count">{{ t.count }}</text>
            </view>
          </view>
        </view>
      </template>

      <template v-else>
        <view class="result-head">
          <view class="result-head-left">
            <text class="result-label">搜索结果</text>
            <text class="result-query">「{{ keyword }}」</text>
          </view>
          <view class="result-count">
            <text class="result-num">{{ pad(results.length) }}</text>
            <text class="result-unit">部</text>
          </view>
        </view>

        <view v-if="!results.length" class="result-blank">
          <view class="result-orb">
            <AppIcon name="search" color="#9a9aa2" :size="56" />
          </view>
          <text class="result-blank-title">没有找到「{{ keyword }}」</text>
          <text class="result-blank-desc">换个关键词，或从标签里挑一个</text>
        </view>

        <view v-else class="search-panel result-panel">
          <view
            v-for="a in results"
            :key="a.id"
            class="result-row"
            @tap="openDetail(a.id)"
          >
            <image class="result-poster" :src="a.poster" mode="aspectFill" />
            <view class="result-body">
              <text class="result-title">{{ a.title }}</text>
              <text v-if="a.jp" class="result-jp">{{ a.jp }}</text>
              <view class="result-meta">
                <text>{{ WEEK[a.day] ? WEEK[a.day].label : '待定' }} {{ a.time }}</text>
                <view class="dot-sep"></view>
                <text>{{ a.category === 'guochuang' ? '国漫' : '番剧' }}</text>
                <view class="dot-sep"></view>
                <text>第 {{ a.ep }} 话</text>
              </view>
            </view>
            <AppIcon name="arrowUpRight" color="#b3b3b9" :size="30" />
          </view>
        </view>
      </template>
    </view>

    <view class="page-pad"></view>
  </view>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import AppIcon from '../../components/AppIcon.vue';
  import { WEEK, state, rememberQuery, searchAnime } from '../../store';

  // 这些标签属于来源与分类，不作为「按标签探索」的入口
  const SKIP_TAGS = ['漫画改', '漫改', '国创', '国漫'];

  const keyword = computed(() => state.q.trim());
  const results = computed(() => searchAnime(state.q));
  const focused = ref(false);

  // 从当前数据里统计出现次数最多的标签，作为空关键词时的探索入口
  const suggestTags = computed(() => {
    const counts = {};
    state.anime.forEach((a) => {
      (a.tags || []).forEach((t) => {
        if (SKIP_TAGS.indexOf(t) > -1) return;
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.keys(counts)
      .map((name) => ({ name, count: counts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  });

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function onConfirm() {
    rememberQuery(state.q);
  }

  function clearQuery() {
    state.q = '';
  }

  function useKeyword(k) {
    state.q = k;
    rememberQuery(k);
  }

  function clearHistory() {
    state.history = [];
  }

  function openDetail(id) {
    rememberQuery(state.q);
    uni.navigateTo({ url: '/pages/detail/detail?id=' + id });
  }

  function goBack() {
    uni.navigateBack({
      fail() {
        uni.reLaunch({ url: '/pages/index/index' });
      }
    });
  }
</script>
