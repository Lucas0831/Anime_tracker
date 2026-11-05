// 云开发接入：初始化 wx.cloud，优先调用云函数查询，失败时直查数据库
import { docToAnime } from './normalize';

const FUNCTION_NAME = 'animeApi';
const PAGE_SIZE = 20; // 小程序端单次查询上限
const MAX_RECORDS = 200;

let inited = false;
let available = false;

export function initCloud() {
  if (inited) return available;
  inited = true;
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.cloud) {
    try {
      // 环境 ID 通过 .env.local 注入，未配置时使用默认环境
      const env = import.meta.env.VITE_CLOUD_ENV || undefined;
      wx.cloud.init({ env, traceUser: true });
      available = true;
    } catch (e) {
      console.warn('[cloud] 初始化失败', e);
    }
  } else {
    console.warn('[cloud] 当前环境不支持 wx.cloud');
  }
  // #endif
  return available;
}

async function callFunction(payload) {
  const res = await wx.cloud.callFunction({ name: FUNCTION_NAME, data: payload });
  const result = res && res.result;
  if (!result || !result.ok) {
    throw new Error((result && result.message) || '云函数返回异常');
  }
  return result;
}

async function queryDirect() {
  const db = wx.cloud.database();
  const list = [];
  for (let skip = 0; skip < MAX_RECORDS; skip += PAGE_SIZE) {
    const res = await db
      .collection('anime')
      .where({ is_visible: true })
      .skip(skip)
      .limit(PAGE_SIZE)
      .get();
    const data = res.data || [];
    list.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return list;
}

function toList(docs) {
  return (docs || []).map(docToAnime).filter((a) => a && a.id);
}

export async function fetchAnimeList() {
  if (!initCloud()) return null;

  try {
    const result = await callFunction({ action: 'list', pageSize: MAX_RECORDS });
    const list = toList(result.data);
    if (list.length) return list;
    throw new Error('云函数返回空列表');
  } catch (e) {
    console.warn('[cloud] 云函数查询失败，改为直查数据库', e);
  }

  try {
    return toList(await queryDirect());
  } catch (e) {
    console.warn('[cloud] 数据库查询失败', e);
    return null;
  }
}
