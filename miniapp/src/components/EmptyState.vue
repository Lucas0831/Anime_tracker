<template>
  <view class="empty-state">
    <view class="empty-ico">
      <AppIcon :name="config.icon" color="#b3b3b9" :size="54" />
    </view>
    <text class="empty-title">{{ config.title }}</text>
    <text class="empty-desc">{{ config.sub }}</text>
    <view v-if="kind === 'filter'" class="empty-action" @tap="$emit('reset')">查看全部</view>
  </view>
</template>

<script setup>
  import { computed } from 'vue';
  import AppIcon from './AppIcon.vue';

  const props = defineProps({
    kind: { type: String, default: 'day' }
  });
  defineEmits(['reset']);

  const STATES = {
    day: { icon: 'calendarX', title: '这一天没有番剧', sub: '试试切换其他日期看看' },
    filter: { icon: 'calendarX', title: '没有符合条件的番剧', sub: '换一个筛选条件试试' },
    search: { icon: 'search', title: '没有找到相关番剧', sub: '换个关键词再试试' }
  };

  const config = computed(() => STATES[props.kind] || STATES.day);
</script>
