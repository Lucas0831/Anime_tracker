<script>
  import { initCloud } from './cloud';
  import { loadAnime, syncWeek } from './store';

  export default {
    onLaunch() {
      initCloud();
      loadAnime();
    },
    onShow() {
      // 小程序常驻后台跨天后，重建顶部日期条
      syncWeek();
    },
    onHide() {}
  };
</script>

<style>
  /* 全局样式统一在 styles/app.css 中维护 */
  @import './styles/app.css';
</style>
