// 云函数 animeApi：统一查询 anime / airing_schedule 集合
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function ok(data, extra) {
  return Object.assign({ ok: true, data }, extra || {});
}

function fail(message) {
  return { ok: false, message };
}

async function list(event) {
  const pageSize = Math.min(100, Math.max(1, Number(event.pageSize) || 100));
  const page = Math.max(1, Number(event.page) || 1);
  const where = { is_visible: true };
  if (event.day !== undefined && event.day !== null && event.day !== '') {
    where.airing_day = Number(event.day);
  }
  if (event.category) {
    where.category = String(event.category);
  }
  const res = await db
    .collection('anime')
    .where(where)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();
  return ok(res.data, { page, pageSize });
}

async function detail(event) {
  const id = String(event.id || '');
  if (!id) return fail('缺少番剧 id');
  // 兼容控制台种子数据的 seed_ 前缀
  const ids = id.indexOf('seed_') === 0 ? [id] : [id, 'seed_' + id];
  for (let i = 0; i < ids.length; i += 1) {
    try {
      const res = await db.collection('anime').doc(ids[i]).get();
      if (res && res.data) return ok(res.data);
    } catch (e) {
      // 换下一个 id 继续尝试
    }
  }
  return fail('未找到番剧：' + id);
}

async function week(event) {
  const weekKey = String(event.weekKey || '');
  let query = db.collection('airing_schedule');
  if (weekKey) query = query.where({ week_key: weekKey });
  const res = await query.orderBy('airing_at', 'asc').limit(100).get();
  return ok(res.data, { weekKey });
}

exports.main = async (event = {}) => {
  const action = event.action || 'list';
  try {
    if (action === 'list') return await list(event);
    if (action === 'detail') return await detail(event);
    if (action === 'week') return await week(event);
    return fail('未知 action：' + action);
  } catch (e) {
    console.error('[animeApi]', e);
    return fail(e.message || String(e));
  }
};
