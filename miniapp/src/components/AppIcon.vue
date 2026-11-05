<template>
  <view class="app-ico" :style="iconStyle"></view>
</template>

<script setup>
  import { computed } from 'vue';
  import { iconUri } from '../icons';

  const props = defineProps({
    name: { type: String, required: true },
    color: { type: String, default: '#17171a' },
    size: { type: Number, default: 44 }
  });

  const iconStyle = computed(() => ({
    width: props.size + 'rpx',
    height: props.size + 'rpx',
    backgroundImage: 'url("' + iconUri(props.name, props.color) + '")'
  }));
</script>
