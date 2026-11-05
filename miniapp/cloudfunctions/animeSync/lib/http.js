const https = require('https');
const { URL } = require('url');

// 统一的 HTTPS JSON 请求，避免云函数引入额外依赖
function request(method, url, options) {
  const opts = options || {};
  return new Promise((resolve, reject) => {
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
          reject(err);
          return;
        }
        resolve(data);
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = { request };
