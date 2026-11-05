<template>
  <view class="page page-detail">
    <view class="detail-hero">
      <view class="hero-blur" :style="'background-image:url(' + anime.poster + ')'"></view>
      <view class="detail-topbar">
        <view class="round-back" aria-label="返回" @tap="goBack">
          <AppIcon name="back" :size="40" />
        </view>
      </view>
      <view class="hero-main">
        <image class="detail-poster" :src="anime.poster" mode="aspectFill" />
        <view class="hero-info">
          <text class="hero-title">{{ anime.title }}</text>
          <view class="hero-meta">
            <view class="meta-line">
              <AppIcon name="clock" color="#8e8e94" :size="33" />
              <text>{{ anime.totalEps }}集</text>
            </view>
            <view class="meta-line">
              <AppIcon name="broadcast" color="#8e8e94" :size="33" />
              <text>{{ anime.status }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="next-card">
        <view class="next-ico">
          <AppIcon name="clock" :size="37" />
        </view>
        <view class="next-main">
          <view class="next-title">下一集 <text class="next-ep">第{{ anime.next.ep }}集</text> / 共{{ anime.next.total }}集</view>
          <text class="next-sub">{{ anime.next.date }} 放送（北京时间）</text>
        </view>
        <view class="next-right">
          <text class="next-cap">距开播</text>
          <text class="next-count">{{ anime.next.countdown }}</text>
        </view>
      </view>

      <text class="synopsis">{{ anime.synopsis }}</text>
    </view>

    <view class="detail-section">
      <text class="section-h2">信息</text>
      <view class="origin-badge" :class="origin.cls">
        <AppIcon name="book" color="#8e8e94" :size="29" />
        <text>{{ origin.label }}</text>
      </view>
      <view class="info-table">
        <view v-for="r in rows" :key="r[0]" class="info-row">
          <text class="info-dt">{{ r[0] }}</text>
          <text class="info-dd">{{ r[1] }}</text>
        </view>
      </view>
    </view>

    <view class="detail-section">
      <text class="section-h2">工作室</text>
      <view class="pill-row">
        <text class="outline-pill">{{ anime.studio }}</text>
      </view>
    </view>

    <view class="detail-section">
      <text class="section-h2">标签</text>
      <view class="tag-cloud">
        <text v-for="t in visibleTags" :key="t" class="tag-pill">{{ t }}</text>
        <view v-if="allTags.length > 6" class="more-tags" @tap="toggleTags">
          <AppIcon name="plus" color="#8e8e94" :size="25" />
          <text>{{ tagsOpen ? '收起' : '更多' }}</text>
        </view>
      </view>
    </view>

    <view class="page-pad"></view>
    <view class="to-top" aria-label="回到顶部" @tap="toTop">
      <AppIcon name="arrowUp" :size="38" />
    </view>
  </view>
</template>

<script setup>
  import { computed, ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import AppIcon from '../../components/AppIcon.vue';
  import { WEEK, state, byId, originInfo } from '../../store';

  const detailId = ref('tenchi');

  const anime = computed(() => byId(detailId.value) || byId('tenchi'));
  const allTags = computed(() => anime.value.tags.concat(anime.value.extraTags || []));
  const tagsOpen = computed(() => state.tagsOpen);
  const visibleTags = computed(() => (tagsOpen.value ? allTags.value : allTags.value.slice(0, 6)));
  const origin = computed(() => originInfo(anime.value));

  const rows = computed(() => [
    ['集数', anime.value.totalEps],
    ['季度', anime.value.season],
    ['放送状态', anime.value.status],
    ['制作', anime.value.studio],
    ['类型', anime.value.genres.join(' / ')],
    ['放送时段', WEEK[anime.value.day].label + ' ' + anime.value.time]
  ]);

  onLoad((options) => {
    if (options && options.id) detailId.value = options.id;
    state.tagsOpen = false;
  });

  function toggleTags() {
    state.tagsOpen = !state.tagsOpen;
  }

  function toTop() {
    uni.pageScrollTo({ scrollTop: 0, duration: 300 });
  }

  function goBack() {
    uni.navigateBack({
      fail() {
        uni.reLaunch({ url: '/pages/index/index' });
      }
    });
  }
</script>
