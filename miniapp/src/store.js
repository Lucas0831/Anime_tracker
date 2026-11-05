import { reactive } from 'vue';
import { WEEK, TODAY_INDEX, ANIME, SEARCH_HISTORY } from './data/anime';

export const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'anime', label: '番剧' },
  { key: 'guochuang', label: '国创' }
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
  history: SEARCH_HISTORY.slice()
});

export function byId(id) {
  return ANIME.filter((a) => a.id === id)[0];
}

export function passes(a, filter) {
  if (filter === 'anime') return a.category === 'anime';
  if (filter === 'guochuang') return a.category === 'guochuang';
  return true;
}

export function showsForDay(day, filter) {
  return ANIME.filter((a) => a.day === day && passes(a, filter))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function dayStatus(a) {
  return a.day <= TODAY_INDEX ? '已播' : '待播';
}

export function ratingText(n) {
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
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
  return ANIME.filter((a) => {
    const pool = [a.title, a.jp, a.studio, a.season, a.category === 'guochuang' ? '国创 国漫' : '番剧']
      .concat(a.tags, a.extraTags || [], a.genres)
      .join(' ')
      .toLowerCase();
    return pool.indexOf(keyword) > -1;
  });
}

export { WEEK, TODAY_INDEX, ANIME };
