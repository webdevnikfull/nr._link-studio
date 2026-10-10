/* Payload validation and exports are independent of the interface. */
(() => {
  'use strict';
  function normalize(raw) {
    raw = raw.trim();
    if (!raw || /[\s\u0000-\u001f\u007f]/.test(raw)) throw Error('invalid');
    if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = 'https://' + raw;
    const url = new URL(raw);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.hostname || url.href.length > 2048) throw Error('invalid');
    return url.href;
  }
  function svg(qr, ink, size) {
    if (!['#081d63', '#111111', '#164e3f'].includes(ink) || ![512, 1024, 2048].includes(size)) throw Error('settings');
    const count = qr.getModuleCount(), side = count + 8;
    let path = '';
    for (let y = 0; y < count; y++) for (let x = 0; x < count; x++) {
      if (qr.isDark(y, x)) path += `M${x + 4} ${y + 4}h1v1h-1z`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${side} ${side}" role="img" aria-label="QR code" shape-rendering="crispEdges"><rect width="${side}" height="${side}" fill="#fff"/><path d="${path}" fill="${ink}"/></svg>`;
  }
  window.QRModel = {normalize, svg};
})();
