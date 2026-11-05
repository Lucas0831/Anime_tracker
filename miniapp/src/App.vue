<script>
  import { initCloud } from './cloud';
  import { loadAnime } from './store';

  export default {
    onLaunch() {
      initCloud();
      loadAnime();
    },
    onShow() {},
    onHide() {}
  };
</script>

<style>
  /* 全局样式统一在 styles/app.css 中维护 */
  @import './styles/app.css';
</style>
