<template>
  <view class="page page-search">
    <view class="app-header">
      <view class="header-row search-header">
        <view class="icon-btn" aria-label="返回" @tap="goBack">
          <AppIcon name="back" :size="42" />
        </view>
        <view class="search-box">
          <AppIcon name="search" color="#8c8c92" :size="35" />
          <input
            class="search-input"
            type="text"
            confirm-type="search"
            :focus="false"
            placeholder="搜索番剧、制作、标签"
            placeholder-class="search-placeholder"
            v-model="state.q"
            @confirm="onConfirm"
          />
          <view v-show="state.q" class="search-clear" aria-label="清空搜索" @tap="state.q = ''">
            <AppIcon name="x" color="#96969c" :size="31" />
          </view>
        </view>
      </view>
    </view>

    <view class="search-body">
      <view v-if="!keyword" class="search-section">
        <view class="section-head">
          <text class="section-title">搜索历史</text>
          <view v-if="state.history.length" class="section-action" @tap="clearHistory">清空</view>
        </view>
        <view v-if="state.history.length" class="history-tags">
          <view
            v-for="k in state.history"
            :key="k"
            class="history-tag"
            @tap="useKeyword(k)"
          >{{ k }}</view>
        </view>
        <text v-else class="history-empty">暂无搜索记录</text>
      </view>

      <template v-else>
        <EmptyState v-if="!results.length" kind="search" />
        <template v-else>
          <view class="search-count">找到 <text class="search-count-num">{{ results.length }}</text> 部番剧</view>
          <view class="search-list">
            <view
              v-for="a in results"
              :key="a.id"
              class="search-row"
              @tap="openDetail(a.id)"
            >
              <image class="search-row-poster" :src="a.poster" mode="aspectFill" />
              <view class="search-row-body">
                <text class="search-row-title">{{ a.title }}</text>
                <text v-if="a.jp" class="search-row-jp">{{ a.jp }}</text>
                <view class="search-row-meta">
                  <text>{{ WEEK[a.day].label }} {{ a.time }}</text>
                  <view class="dot-sep"></view>
                  <text>{{ a.category === 'guochuang' ? '国创' : '番剧' }}</text>
                  <view class="dot-sep"></view>
                  <text>第{{ a.ep }}话</text>
                </view>
              </view>
              <text class="row-chev">›</text>
            </view>
          </view>
        </template>
      </template>
    </view>

    <view class="page-pad"></view>
  </view>
</template>

<script setup>
  import { computed } from 'vue';
  import AppIcon from '../../components/AppIcon.vue';
  import EmptyState from '../../components/EmptyState.vue';
  import { WEEK, state, rememberQuery, searchAnime } from '../../store';

  const keyword = computed(() => state.q.trim());
  const results = computed(() => searchAnime(state.q));

  function onConfirm() {
    rememberQuery(state.q);
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
