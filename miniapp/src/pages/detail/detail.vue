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
              <AppIcon name="clock" color="#5f5f65" :size="33" />
              <text>{{ anime.totalEps }}集</text>
            </view>
            <view class="meta-line">
              <AppIcon name="broadcast" color="#5f5f65" :size="33" />
              <text>{{ anime.status }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="ratings">
        <view v-for="(v, i) in anime.ratings" :key="i" class="rating">
          <text class="rating-num">{{ ratingText(v) }}</text>
          <text class="rating-label">{{ ratingLabels[i] }}</text>
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

      <view class="detail-actions">
        <view
          v-for="b in actionBtns"
          :key="b.action"
          class="act-btn"
          :class="{ active: b.active }"
          :aria-label="b.label"
          @tap="handleAction(b)"
        >
          <AppIcon :name="b.ico" :color="b.active ? '#ffffff' : '#a2a2a8'" :size="37" />
        </view>
      </view>
    </view>

    <view id="detail-info" class="detail-section">
      <text class="section-h2">信息</text>
      <view class="origin-badge" :class="origin.cls">
        <AppIcon name="book" :color="origin.color" :size="29" />
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
        <view v-if="allTags.length > 6" class="more-tags" @tap="state.tagsOpen = !state.tagsOpen">
          <AppIcon name="plus" color="#56565c" :size="25" />
          <text>{{ state.tagsOpen ? '收起' : '更多' }}</text>
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
  import { WEEK, state, byId, ratingText, originInfo } from '../../store';

  const detailId = ref('tenchi');

  const anime = computed(() => byId(detailId.value) || byId('tenchi'));
  const allTags = computed(() => anime.value.tags.concat(anime.value.extraTags || []));
  const visibleTags = computed(() => (state.tagsOpen ? allTags.value : allTags.value.slice(0, 6)));
  const origin = computed(() => originInfo(anime.value));
  const ratingLabels = ['MAL评分', 'Bangumi评分', 'AS评分', 'TMDB评分'];

  const rows = computed(() => [
    ['集数', anime.value.totalEps],
    ['季度', anime.value.season],
    ['放送状态', anime.value.status],
    ['制作', anime.value.studio],
    ['类型', anime.value.genres.join(' / ')],
    ['放送时段', WEEK[anime.value.day].label + ' ' + anime.value.time]
  ]);

  const actionBtns = [
    { ico: 'info', action: 'scroll-info', label: '作品信息', active: true },
    { ico: 'users', action: 'demo', label: '角色列表', msg: '角色列表为演示占位，未接入真实数据' },
    { ico: 'shuffle', action: 'demo', label: '相关推荐', msg: '相关推荐为演示占位，未接入真实数据' }
  ];

  onLoad((options) => {
    if (options && options.id) detailId.value = options.id;
    state.tagsOpen = false;
  });

  function handleAction(b) {
    if (b.action === 'scroll-info') {
      uni.pageScrollTo({ selector: '#detail-info', duration: 250 });
      return;
    }
    uni.showToast({ title: b.msg, icon: 'none' });
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
