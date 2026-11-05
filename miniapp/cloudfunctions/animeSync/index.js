// 云函数 animeSync：从 AniList / Bangumi / AnimeSchedule 同步数据到云数据库
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const anilist = require('./lib/anilist');
const bangumi = require('./lib/bangumi');
const animeschedule = require('./lib/animeschedule');
const store = require('./lib/db');
const convert = require('./lib/convert');

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function union(a, b) {
  return Array.from(new Set((a || []).concat(b || [])));
}

function currentIsoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return { year: t.getUTCFullYear(), week };
}

async function syncSeason(event) {
  const season = String(event.season || 'FALL').toUpperCase();
  const seasonYear = num(event.seasonYear, new Date().getUTCFullYear());
  const page = Math.max(1, num(event.page, 1));
  const perPage = Math.min(50, Math.max(1, num(event.perPage, 50)));
  const deadline = Date.now() + num(event.timeBudgetMs, 4000);

  const data = await anilist.fetchSeason(season, seasonYear, page, perPage);
  const media = (data.Page && data.Page.media) || [];
  const pageInfo = (data.Page && data.Page.pageInfo) || {};

  let hiddenSeeds = 0;
  if (event.hideSeed !== false && page === 1) {
    hiddenSeeds = await store.hideSeeds();
  }

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  for (let i = 0; i < media.length; i += 1) {
    if (Date.now() > deadline) break;
    try {
      const result = await store.upsertAnime('anilist_' + media[i].id,
        convert.anilistToAnime(media[i], { season, seasonYear }));
      if (result === 'inserted') inserted += 1;
      else updated += 1;
    } catch (e) {
      failed += 1;
      console.warn('[season] 写入失败', media[i] && media[i].id, e.message);
    }
  }

  await store.saveSyncState('anilist_season_' + seasonYear + '_' + season, {
    source: 'anilist',
    task: 'season_list',
    params: { season, seasonYear, isAdult: false },
    cursor: { page, has_next: !!pageInfo.hasNextPage },
    status: 'success',
    stats: {
      fetched: media.length,
      inserted,
      updated,
      skipped: hiddenSeeds,
      failed
    },
    last_run_at: new Date(),
    last_success_at: new Date(),
    updated_at: new Date()
  });

  return {
    ok: true,
    action: 'season',
    season,
    seasonYear,
    stats: { fetched: media.length, inserted, updated, failed, hiddenSeeds },
    page,
    hasNextPage: !!pageInfo.hasNextPage
  };
}

async function syncSchedules(event) {
  const now = Math.floor(Date.now() / 1000);
  const from = num(event.from, now - 86400);
  const to = num(event.to, now + 8 * 86400);
  const page = Math.max(1, num(event.page, 1));
  const perPage = Math.min(50, Math.max(1, num(event.perPage, 50)));
  const deadline = Date.now() + num(event.timeBudgetMs, 4000);

  const data = await anilist.fetchSchedules(from, to, page, perPage);
  const list = (data.Page && data.Page.airingSchedules) || [];
  const pageInfo = (data.Page && data.Page.pageInfo) || {};

  let inserted = 0;
  let failed = 0;
  for (let i = 0; i < list.length; i += 1) {
    if (Date.now() > deadline) break;
    try {
      const doc = convert.anilistScheduleToDoc(list[i]);
      await store.upsert('airing_schedule', doc._id, doc);
      inserted += 1;
    } catch (e) {
      failed += 1;
      console.warn('[schedules] 写入失败', list[i] && list[i].id, e.message);
    }
  }

  await store.saveSyncState('anilist_schedules_' + convert.weekKey(new Date()), {
    source: 'anilist',
    task: 'airing_schedules',
    params: { from, to },
    cursor: { page, has_next: !!pageInfo.hasNextPage },
    status: 'success',
    stats: { fetched: list.length, inserted, updated: 0, skipped: 0, failed },
    last_run_at: new Date(),
    last_success_at: new Date(),
    updated_at: new Date()
  });

  return {
    ok: true,
    action: 'schedules',
    stats: { fetched: list.length, inserted, failed },
    page,
    hasNextPage: !!pageInfo.hasNextPage
  };
}

async function matchOne(doc) {
  const titles = [doc.title_native, doc.title_romaji, doc.title_english, doc.title_cn]
    .filter((t) => t && String(t).trim());

  let candidates = [];
  if (titles[0]) {
    const res = await bangumi.searchSubjects(titles[0], 8);
    candidates = (res && res.data) || [];
  }

  const best = bangumi.bestCandidate(candidates, titles);
  if (!best || best.score < 0.86) {
    await store.db.collection('match_review').doc('match_' + doc._id).set({
      data: {
        anilist_id: doc.anilist_id || null,
        query_titles: titles,
        candidates: candidates.slice(0, 6).map((c) => ({
          bgm_id: c.id,
          name: c.name,
          name_cn: c.name_cn,
          date: c.date || '',
          score: c.score || 0
        })),
        chosen_bgm_id: null,
        confidence: best ? best.score : 0,
        status: 'pending',
        created_at: new Date()
      }
    });
    await store.updateAnime(doc._id, {
      match_status: 'review',
      match_confidence: best ? best.score : 0,
      updated_at: new Date()
    });
    return { status: 'review', confidence: best ? best.score : 0, candidates: candidates.length };
  }

  const subject = await bangumi.getSubject(best.candidate.id);
  const nameCn = subject.name_cn || best.candidate.name_cn || '';
  const score = bangumi.bcp47Score(subject);
  const payload = {
    bgm_id: subject.id,
    match_status: 'matched',
    match_confidence: best.score,
    data_sources: union(doc.data_sources, ['bangumi']),
    synced_at: new Date(),
    updated_at: new Date()
  };
  if (nameCn) {
    payload.title_cn = nameCn;
    if (subject.summary) {
      payload.synopsis = String(subject.summary).trim();
      payload.synopsis_source = 'bangumi';
    }
  }
  if (score != null) {
    payload.ratings = Object.assign({}, doc.ratings || {}, { bangumi: score });
  }
  if (!doc.start_date && subject.date) payload.start_date = subject.date;
  if (!doc.episodes_total && subject.eps) payload.episodes_total = subject.eps;

  await store.updateAnime(doc._id, payload);
  return { status: 'matched', confidence: best.score, bgm_id: subject.id };
}

async function syncBangumi(event) {
  const limit = Math.min(20, Math.max(1, num(event.limit, 5)));
  const deadline = Date.now() + num(event.timeBudgetMs, 4000);
  const docs = await store.listVisible(1);
  const pending = docs.filter((d) =>
    !d.bgm_id && d.match_status !== 'review' && (d.title_native || d.title_cn));

  let matched = 0;
  let review = 0;
  let failed = 0;
  let processed = 0;

  for (let i = 0; i < pending.length && processed < limit; i += 1) {
    if (Date.now() > deadline) break;
    processed += 1;
    try {
      const result = await matchOne(pending[i]);
      if (result.status === 'matched') matched += 1;
      else review += 1;
    } catch (e) {
      failed += 1;
      console.warn('[bangumi] 匹配失败', pending[i]._id, e.message);
    }
    if (Date.now() < deadline) await sleep(200);
  }

  await store.saveSyncState('bangumi_title_match', {
    source: 'bangumi',
    task: 'title_match',
    params: { limit },
    cursor: { processed, remaining: Math.max(0, pending.length - processed) },
    status: 'success',
    stats: { fetched: pending.length, inserted: matched, updated: review, skipped: 0, failed },
    last_run_at: new Date(),
    last_success_at: new Date(),
    updated_at: new Date()
  });

  return {
    ok: true,
    action: 'bangumi',
    stats: { pending: pending.length, processed, matched, review, failed }
  };
}

async function findAnimeByItem(slug, title) {
  if (slug) {
    const res = await store.db.collection('anime').where({ as_slug: slug }).limit(1).get();
    if (res.data && res.data[0]) return res.data[0];
  }
  if (title) {
    const native = await store.db.collection('anime').where({ title_native: title }).limit(1).get();
    if (native.data && native.data[0]) return native.data[0];
    const cn = await store.db.collection('anime').where({ title_cn: title }).limit(1).get();
    if (cn.data && cn.data[0]) return cn.data[0];
  }
  return null;
}

async function syncAnimeSchedule(event) {
  const now = new Date();
  const fallback = currentIsoWeek(now);
  const year = num(event.year, fallback.year);
  const week = num(event.week, fallback.week);

  const data = await animeschedule.fetchTimetable(year, week);
  const items = (data && (data.timetables || data.data)) || [];

  let matched = 0;
  let skipped = 0;
  let failed = 0;
  for (let i = 0; i < items.length; i += 1) {
    try {
      const item = animeschedule.parseItem(items[i]);
      const at = item.airingTime ? new Date(item.airingTime) : null;
      if (!item.slug && !item.title || !item.episode || !at || Number.isNaN(at.getTime())) {
        skipped += 1;
        continue;
      }
      const anime = await findAnimeByItem(item.slug, item.title);
      if (!anime) {
        skipped += 1;
        continue;
      }
      const bj = convert.beijing(at);
      await store.upsert('airing_schedule', anime._id + '_ep' + item.episode, {
        anime_id: anime._id,
        anilist_id: anime.anilist_id || null,
        title_cn: anime.title_cn || item.title,
        cover_image: anime.cover_image || '',
        episode_number: item.episode,
        airing_at: at,
        airing_ts: Math.floor(at.getTime() / 1000),
        airing_date: bj.date,
        airing_time: bj.time,
        day_of_week: bj.day,
        week_key: year + '-W' + String(week).padStart(2, '0'),
        timezone: 'Asia/Shanghai',
        status: item.isDelayed ? 'delayed' : 'scheduled',
        is_delayed: item.isDelayed,
        delay_reason: item.delayReason || '',
        source: 'animeschedule',
        source_id: 'animeschedule:' + item.slug + ':' + item.episode,
        created_at: new Date(),
        updated_at: new Date()
      });
      if (anime.as_slug !== item.slug && item.slug) {
        await store.updateAnime(anime._id, {
          as_slug: item.slug,
          data_sources: union(anime.data_sources, ['animeschedule']),
          updated_at: new Date()
        });
      }
      matched += 1;
    } catch (e) {
      failed += 1;
      console.warn('[animeschedule] 同步失败', e.message);
    }
  }

  await store.saveSyncState('animeschedule_' + year + '_' + week, {
    source: 'animeschedule',
    task: 'weekly_schedule',
    params: { year, week, tz: 'Asia/Shanghai' },
    cursor: { page: 1, has_next: false },
    status: 'success',
    stats: { fetched: items.length, inserted: matched, updated: 0, skipped, failed },
    last_run_at: new Date(),
    last_success_at: new Date(),
    updated_at: new Date()
  });

  return {
    ok: true,
    action: 'animeschedule',
    year,
    week,
    stats: { fetched: items.length, matched, skipped, failed }
  };
}

exports.main = async (event) => {
  const e = event || {};
  const action = e.action || 'all';
  try {
    if (action === 'season') return await syncSeason(e);
    if (action === 'schedules') return await syncSchedules(e);
    if (action === 'bangumi') return await syncBangumi(e);
    if (action === 'animeschedule') return await syncAnimeSchedule(e);
    if (action === 'all') {
      const season = await syncSeason(e);
      const schedules = await syncSchedules(e);
      return { ok: true, action: 'all', season, schedules };
    }
    return { ok: false, action, message: '未知 action：' + action };
  } catch (err) {
    console.error('[animeSync]', action, err);
    return { ok: false, action, message: err.message || String(err) };
  }
};
