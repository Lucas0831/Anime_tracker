const { request } = require('./http');

const BASE = 'https://api.bgm.tv';
const USER_AGENT = 'anime-tracker/0.1 (WeChat cloud function)';

async function searchSubjects(keyword, limit) {
  return request('POST', BASE + '/v0/search/subjects?limit=' + (limit || 8), {
    headers: { 'User-Agent': USER_AGENT },
    body: { keyword, filter: { type: [2], nsfw: false } }
  });
}

async function getSubject(id) {
  return request('GET', BASE + '/v0/subjects/' + id, {
    headers: { 'User-Agent': USER_AGENT }
  });
}

function normalize(text) {
  return String(text || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

// 标题相似度：完全一致 1，包含 0.85，否则按二元组重合度估算
function similarity(a, b) {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.length >= 4 && y.indexOf(x) > -1) return 0.85;
  if (y.length >= 4 && x.indexOf(y) > -1) return 0.85;

  const grams = (s) => {
    const out = [];
    for (let i = 0; i < s.length - 1; i += 1) out.push(s.slice(i, i + 2));
    return out;
  };
  const ax = grams(x);
  const by = new Set(grams(y));
  if (!ax.length || !by.size) return 0;
  let hit = 0;
  ax.forEach((g) => { if (by.has(g)) hit += 1; });
  return hit / Math.max(ax.length, by.size);
}

function bestCandidate(candidates, titles) {
  let best = null;
  candidates.forEach((c) => {
    titles.forEach((t) => {
      const score = Math.max(similarity(c.name, t), similarity(c.name_cn, t));
      if (!best || score > best.score) best = { candidate: c, score };
    });
  });
  return best;
}

function bcp47Score(subject) {
  const rating = subject && subject.rating;
  return rating && typeof rating.score === 'number' && rating.score > 0 ? rating.score : null;
}

module.exports = { searchSubjects, getSubject, bestCandidate, similarity, bcp47Score };
