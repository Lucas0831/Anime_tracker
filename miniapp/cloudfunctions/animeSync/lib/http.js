const https = require('https');
const { URL } = require('url');

const DEFAULT_TIMEOUT = 5000;

// 统一的 HTTPS JSON 请求，避免云函数引入额外依赖
function request(method, url, options) {
  const opts = options || {};
  const timeout = opts.timeout || DEFAULT_TIMEOUT;
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (fn, value) => {
      if (finished) return;
      finished = true;
      fn(value);
    };
    const u = new URL(url);
    const payload = opts.body === undefined ? null
      : (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
    const headers = Object.assign({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }, opts.headers || {});
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request({
      method,
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers
    }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let data = null;
        try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = raw; }
        if (res.statusCode >= 400) {
          const text = typeof data === 'string' ? data : JSON.stringify(data);
          const err = new Error('HTTP ' + res.statusCode + ': ' + String(text).slice(0, 200));
          err.status = res.statusCode;
          err.data = data;
          finish(reject, err);
          return;
        }
        finish(resolve, data);
      });
    });

    // 连接或响应挂起时主动失败，避免被云函数总超时直接杀死而看不到原因
    req.setTimeout(timeout, () => {
      req.destroy();
      finish(reject, new Error('请求超时（' + timeout + 'ms）：' + url));
    });
    req.on('error', (e) => finish(reject, e));
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = { request };
