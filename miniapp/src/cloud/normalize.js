// 云数据库文档 → 小程序 ANIME 结构，字段命名差异集中在这里处理
const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const STATUS_TEXT = { airing: '放送中', finished: '已完结', upcoming: '未开播' };

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// 云库时间统一存 UTC，展示固定按北京时间（Asia/Shanghai）
function beijingParts(d) {
  const t = new Date(d.getTime() + 8 * 3600 * 1000);
  return {
    md: pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()),
    week: WEEK_LABELS[(t.getUTCDay() + 6) % 7],
    time: pad(t.getUTCHours()) + ':' + pad(t.getUTCMinutes())
  };
}

function countdownText(d) {
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return '已开播';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return days + '天 ' + pad(hours) + ':' + pad(minutes);
}

function score(doc, key) {
  const ratings = doc.ratings || {};
  return ratings[key] === undefined ? null : ratings[key];
}

export function docToAnime(doc) {
  if (!doc) return null;
  const id = String(doc._id || '').replace(/^seed_/, '');
  const nextAt = toDate(doc.next_airing_at);
  const parts = nextAt ? beijingParts(nextAt) : null;
  const nextEp = doc.next_episode || (doc.episodes_aired || 0) + 1;

  return {
    id,
    day: typeof doc.airing_day === 'number' ? doc.airing_day : null,
    time: doc.airing_time || '待定',
    ep: doc.episodes_aired || 0,
    totalEps: doc.episodes_total || 0,
    category: doc.category === 'guochuang' ? 'guochuang' : 'anime',
    title: doc.title_cn || doc.title_native || '未命名番剧',
    jp: doc.title_native || '',
    poster: doc.cover_image || '',
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    studio: doc.studio || '',
    season: doc.season_text || '',
    status: doc.status_text || STATUS_TEXT[doc.status] || '放送中',
    genres: Array.isArray(doc.genres) ? doc.genres : [],
    ratings: [score(doc, 'mal'), score(doc, 'bangumi'), score(doc, 'anilist'), score(doc, 'tmdb')],
    next: {
      ep: nextEp,
      total: doc.episodes_total || 0,
      date: parts ? parts.md + ' ' + parts.week + ' ' + parts.time : '待定',
      countdown: nextAt ? countdownText(nextAt) : '待定'
    },
    synopsis: doc.synopsis || '',
    platforms: Array.isArray(doc.platforms) ? doc.platforms : [],
    extraTags: Array.isArray(doc.extra_tags) ? doc.extra_tags : []
  };
}
