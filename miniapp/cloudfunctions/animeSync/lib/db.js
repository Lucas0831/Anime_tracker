const cloud = require('wx-server-sdk');

const db = cloud.database();

async function upsert(collection, id, data) {
  // 服务端 SDK 不允许在 set 的 data 中携带 _id
  const payload = Object.assign({}, data);
  delete payload._id;
  await db.collection(collection).doc(id).set({ data: payload });
}

async function getDoc(collection, id) {
  try {
    const res = await db.collection(collection).doc(id).get();
    return res && res.data ? res.data : null;
  } catch (e) {
    return null;
  }
}

// 写入番剧时保留 Bangumi 补充字段，避免重复跑 AniList 覆盖中文名与评分
async function upsertAnime(id, data) {
  const existing = await getDoc('anime', id);
  if (!existing) {
    await upsert('anime', id, data);
    return 'inserted';
  }

  const payload = Object.assign({}, data);
  if (existing.bgm_id) payload.bgm_id = existing.bgm_id;
  if (existing.as_slug) payload.as_slug = existing.as_slug;
  if (existing.bgm_id && existing.title_cn) payload.title_cn = existing.title_cn;
  if (existing.match_status) payload.match_status = existing.match_status;
  if (existing.match_confidence != null) payload.match_confidence = existing.match_confidence;
  if (existing.ratings && existing.ratings.bangumi != null) {
    payload.ratings = Object.assign({}, data.ratings, { bangumi: existing.ratings.bangumi });
  }
  if (existing.synopsis_source === 'bangumi' && existing.synopsis) {
    payload.synopsis = existing.synopsis;
    payload.synopsis_source = 'bangumi';
  }
  if (existing.created_at) payload.created_at = existing.created_at;
  if (Array.isArray(existing.data_sources) && existing.data_sources.length) {
    payload.data_sources = existing.data_sources;
  }

  await db.collection('anime').doc(id).update({ data: payload });
  return 'updated';
}

async function listVisible(maxPages) {
  const out = [];
  const pages = maxPages || 10;
  for (let p = 0; p < pages; p += 1) {
    const res = await db.collection('anime')
      .where({ is_visible: true })
      .skip(p * 100)
      .limit(100)
      .get();
    const data = res.data || [];
    out.push.apply(out, data);
    if (data.length < 100) break;
  }
  return out;
}

async function hideSeeds() {
  const docs = await listVisible();
  let hidden = 0;
  for (let i = 0; i < docs.length; i += 1) {
    const doc = docs[i];
    if (String(doc._id).indexOf('seed_') !== 0) continue;
    await db.collection('anime').doc(doc._id).update({
      data: { is_visible: false, updated_at: new Date() }
    });
    hidden += 1;
  }
  return hidden;
}

async function updateAnime(id, data) {
  await db.collection('anime').doc(id).update({ data });
}

async function saveSyncState(id, data) {
  await db.collection('sync_state').doc(id).set({ data });
}

module.exports = {
  db,
  upsert,
  getDoc,
  upsertAnime,
  listVisible,
  hideSeeds,
  updateAnime,
  saveSyncState
};
