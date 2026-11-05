// 接口数据 → 云数据库文档的字段转换
const STATUS_MAP = {
  RELEASING: 'airing',
  FINISHED: 'finished',
  NOT_YET_RELEASED: 'upcoming',
  HIATUS: 'airing'
};

const STATUS_TEXT = {
  airing: '放送中',
  finished: '已完结',
  upcoming: '未开播'
};

const SOURCE_LABEL = {
  MANGA: '漫画改',
  LIGHT_NOVEL: '轻改',
  NOVEL: '轻改',
  ORIGINAL: '原创'
};

const SOURCE_TYPE = {
  MANGA: 'MANGA',
  LIGHT_NOVEL: 'LIGHT_NOVEL',
  NOVEL: 'LIGHT_NOVEL',
  ORIGINAL: 'ORIGINAL'
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function stripHtml(text) {
  return String(text || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function beijing(d) {
  const t = new Date(d.getTime() + 8 * 3600 * 1000);
  return {
    date: t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()),
    time: pad(t.getUTCHours()) + ':' + pad(t.getUTCMinutes()),
    day: (t.getUTCDay() + 6) % 7
  };
}

function weekKey(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return t.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
}

function dateOnly(parts) {
  if (!parts || !parts.year || !parts.month || !parts.day) return null;
  return parts.year + '-' + pad(parts.month) + '-' + pad(parts.day);
}

function startDay(parts) {
  if (!parts || !parts.year || !parts.month || !parts.day) return null;
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return (d.getUTCDay() + 6) % 7;
}

function seasonText(season, year) {
  const s = String(season || '').toLowerCase();
  return year + ' ' + s.charAt(0).toUpperCase() + s.slice(1);
}

function statusKey(raw) {
  return STATUS_MAP[raw] || 'airing';
}

function anilistToAnime(media, params) {
  const status = statusKey(media.status);
  const next = media.nextAiringEpisode;
  const airing = next && next.airingAt ? beijing(new Date(next.airingAt * 1000)) : null;
  const day = airing ? airing.day : startDay(media.startDate);
  const sourceLabel = SOURCE_LABEL[media.source] || '动画';
  const genres = Array.isArray(media.genres) ? media.genres : [];
  const titleNative = (media.title && media.title.native) || '';
  const titleRomaji = (media.title && media.title.romaji) || '';
  const titleEnglish = (media.title && media.title.english) || '';
  const category = media.countryOfOrigin === 'CN' ? 'guochuang' : 'anime';

  return {
    anilist_id: media.id,
    id_mal: media.idMal || null,
    bgm_id: null,
    as_slug: null,
    match_status: 'pending',
    match_confidence: null,
    title_cn: titleNative || titleRomaji,
    title_native: titleNative,
    title_romaji: titleRomaji,
    title_english: titleEnglish,
    title_aliases: [],
    search_text: [titleNative, titleRomaji, titleEnglish, media.studios && media.studios.nodes
      ? media.studios.nodes.map((s) => s.name).join(' ') : '']
      .concat(genres)
      .join(' ')
      .toLowerCase(),
    cover_image: (media.coverImage && media.coverImage.extraLarge) || '',
    cover_file_id: '',
    cover_source_url: (media.coverImage && media.coverImage.extraLarge) || '',
    synopsis: stripHtml(media.description),
    synopsis_source: 'anilist',
    status,
    status_text: STATUS_TEXT[status],
    status_raw: media.status || '',
    format: media.format || '',
    category,
    country_of_origin: media.countryOfOrigin || '',
    season: media.season || params.season,
    season_year: media.seasonYear || params.seasonYear,
    season_text: seasonText(media.season || params.season, media.seasonYear || params.seasonYear),
    start_date: dateOnly(media.startDate),
    end_date: dateOnly(media.endDate),
    episodes_total: media.episodes || 0,
    episodes_aired: next ? Math.max(0, next.episode - 1) : (status === 'finished' ? (media.episodes || 0) : 0),
    next_episode: next ? next.episode : null,
    next_airing_at: next ? new Date(next.airingAt * 1000) : null,
    airing_day: day,
    airing_time: airing ? airing.time : '',
    airing_timezone: 'Asia/Shanghai',
    studio: media.studios && media.studios.nodes && media.studios.nodes[0]
      ? media.studios.nodes[0].name : '',
    studios: media.studios && media.studios.nodes
      ? media.studios.nodes.map((s) => s.name) : [],
    source_type: SOURCE_TYPE[media.source] || 'ORIGINAL',
    genres,
    tags: [sourceLabel].concat(genres.slice(0, 2)),
    extra_tags: genres.slice(2),
    platforms: [],
    ratings: {
      anilist: media.averageScore == null ? null : media.averageScore,
      bangumi: null,
      mal: null,
      tmdb: null
    },
    popularity: media.popularity || 0,
    average_score: media.averageScore || 0,
    is_adult: !!media.isAdult,
    is_visible: true,
    data_sources: ['anilist'],
    source_updated_at: new Date(),
    synced_at: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  };
}

function anilistScheduleToDoc(item) {
  const media = item.media || {};
  const at = new Date(item.airingAt * 1000);
  const bj = beijing(at);
  const animeId = 'anilist_' + media.id;
  return {
    _id: animeId + '_ep' + item.episode,
    anime_id: animeId,
    anilist_id: media.id,
    title_cn: (media.title && media.title.native) || '',
    cover_image: (media.coverImage && media.coverImage.large) || '',
    episode_number: item.episode,
    airing_at: at,
    airing_ts: item.airingAt,
    airing_date: bj.date,
    airing_time: bj.time,
    day_of_week: bj.day,
    week_key: weekKey(at),
    timezone: 'Asia/Shanghai',
    status: 'scheduled',
    is_delayed: false,
    delay_reason: '',
    source: 'anilist',
    source_id: 'anilist:' + media.id + ':' + item.episode,
    created_at: new Date(),
    updated_at: new Date()
  };
}

module.exports = {
  anilistToAnime,
  anilistScheduleToDoc,
  beijing,
  weekKey,
  stripHtml,
  seasonText,
  pad
};
