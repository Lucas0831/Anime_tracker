import { reactive } from 'vue';
import { WEEK, TODAY_INDEX, ANIME as SEED_ANIME, SEARCH_HISTORY } from './data/anime';
import { fetchAnimeList } from './cloud';

export const FILTERS = [
  { key: 'all', label: '全部', icon: 'layers' },
  { key: 'anime', label: '番剧', icon: 'broadcast' },
  { key: 'guochuang', label: '国漫', icon: 'globe' }
];

export const MODES = {
  timeline: { icon: 'timeline', label: '切换到列表视图', title: '番剧时间轴' },
  list: { icon: 'grid', label: '切换到网格视图', title: '番剧列表' },
  grid: { icon: 'calendar7', label: '切换到时间线视图', title: '番剧网格' }
};

export const state = reactive({
  view: 'timeline',
  day: TODAY_INDEX,
  filter: 'all',
  q: '',
  tagsOpen: false,
  history: SEARCH_HISTORY.slice(),
  // 数据源：默认本地假数据，云数据库可用时整体替换
  anime: SEED_ANIME.slice(),
  source: 'local',
  loading: false,
  error: ''
});

// 拉取云数据库番剧列表，失败则保留本地数据
export async function loadAnime(force) {
  if (state.loading) return state.anime;
  if (!force && state.source === 'cloud') return state.anime;
  state.loading = true;
  state.error = '';
  try {
    const list = await fetchAnimeList();
    if (list && list.length) {
      state.anime = list;
      state.source = 'cloud';
    } else {
      state.source = 'local';
    }
  } catch (e) {
    state.source = 'local';
    state.error = (e && e.message) || '云数据加载失败';
    console.warn('[cloud] 加载失败，继续使用本地数据', e);
  } finally {
    state.loading = false;
  }
  return state.anime;
}

export function byId(id) {
  return state.anime.filter((a) => a.id === id)[0];
}

export function passes(a, filter) {
  if (filter === 'anime') return a.category === 'anime';
  if (filter === 'guochuang') return a.category === 'guochuang';
  return true;
}

export function showsForDay(day, filter) {
  return state.anime.filter((a) => a.day === day && passes(a, filter))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function dayStatus(a) {
  return a.day <= TODAY_INDEX ? '已播' : '待播';
}

export function originInfo(a) {
  if (a.tags.indexOf('漫画改') > -1 || a.tags.indexOf('漫改') > -1) {
    return { label: '漫画改编', cls: 'origin-manga', color: '#7b5cc8' };
  }
  if (a.tags.indexOf('轻改') > -1) {
    return { label: '轻小说改编', cls: 'origin-novel', color: '#e08b32' };
  }
  return { label: '原创动画', cls: 'origin-original', color: '#d8608c' };
}

export function rememberQuery(q) {
  const value = String(q || '').trim();
  if (!value) return;
  state.history = [value].concat(state.history.filter((h) => h !== value)).slice(0, 8);
}

export function searchAnime(q) {
  const keyword = String(q || '').trim().toLowerCase();
  if (!keyword) return [];
  return state.anime.filter((a) => {
    const pool = [a.title, a.jp, a.studio, a.season, a.category === 'guochuang' ? '国创 国漫' : '番剧']
      .concat(a.tags, a.extraTags || [], a.genres)
      .join(' ')
      .toLowerCase();
    return pool.indexOf(keyword) > -1;
  });
}

export { WEEK, TODAY_INDEX };
