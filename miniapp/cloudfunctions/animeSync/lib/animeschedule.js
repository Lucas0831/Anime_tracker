const { request } = require('./http');

function config() {
  return {
    base: process.env.ANIMESCHEDULE_BASE_URL || 'https://api.animeschedule.net/api/v3',
    token: process.env.ANIMESCHEDULE_TOKEN || ''
  };
}

async function fetchTimetable(year, week) {
  const { base, token } = config();
  if (!token) throw new Error('未配置 ANIMESCHEDULE_TOKEN');
  return request('GET', base + '/timetables/' + year + '/' + week, {
    headers: { Authorization: 'Bearer ' + token }
  });
}

// AnimeSchedule 不同版本字段名略有差异，统一取别名
function parseItem(item) {
  const anime = item.anime || item;
  const slug = anime.slug || item.slug || '';
  const title = anime.title || anime.en_title || anime.romaji_title || '';
  const episode = item.episodeNumber != null ? item.episodeNumber
    : (item.episode_number != null ? item.episode_number : item.episode);
  const airingTime = item.airingTime || item.airing_time || item.airingAt;
  return {
    slug,
    title,
    episode,
    airingTime,
    isDelayed: !!(item.isDelayed || item.is_delayed),
    delayReason: item.delayReason || item.delay_reason || ''
  };
}

module.exports = { fetchTimetable, parseItem, config };
