/* File signatures and local preview preparation. No upload happens in this module. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NRImageFiles = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_BYTES = 10 * 1024 * 1024;
  const MAX_PIXELS = 40 * 1000 * 1000;
  function detect(bytes) {
    const text = (start, end) => String.fromCharCode(...bytes.slice(start, end));
    const starts = list => list.every((value, index) => bytes[index] === value);
    if (starts([255, 216, 255])) return 'jpeg';
    if (starts([137, 80, 78, 71, 13, 10, 26, 10])) return 'png';
    if (/^GIF8[79]a$/.test(text(0, 6))) return 'gif';
    if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'webp';
    if (text(0, 2) === 'BM') return 'bmp';
    if (starts([0, 0, 1, 0])) return 'ico';
    if (starts([73, 73, 42, 0]) || starts([77, 77, 0, 42]) || starts([73, 73, 43, 0]) || starts([77, 77, 0, 43])) return 'tiff';
    if (text(4, 8) === 'ftyp') {
      const boxSize = (bytes[0] * 16777216) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3];
      const brands = [text(8, 12)];
      for (let i = 16; i + 4 <= Math.min(boxSize, bytes.length, 512); i += 4) brands.push(text(i, i + 4));
      if (brands.some(brand => ['avif', 'avis'].includes(brand))) return 'avif';
      if (brands.some(brand => ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs'].includes(brand))) return 'heic';
      if (brands.some(brand => ['mif1', 'msf1'].includes(brand))) return 'heif';
    }
    return null;
  }

  function validateSvg(text) {
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw Error('unsafeSvg');
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw Error('invalid_image');
    if (doc.documentElement.namespaceURI !== 'http://www.w3.org/2000/svg') throw Error('invalid_image');
    const denied = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'animate', 'animatemotion', 'animatetransform', 'set', 'audio', 'video']);
    const unsafeCss = value => {
      if (/@|\\/.test(value)) return true;
      for (const match of value.matchAll(/url\s*\(([^)]*)\)/gi)) {
        const reference = match[1].trim().replace(/^(['"])(.*)\1$/, '$2').trim();
        if (!/^#[\w:.-]+$/.test(reference)) return true;
      }
      return false;
    };
    for (const node of doc.querySelectorAll('*')) {
      if (denied.has(node.localName.toLowerCase())) throw Error('unsafeSvg');
      if (node.localName === 'style' && unsafeCss(node.textContent)) throw Error('unsafeSvg');
      for (const attribute of node.attributes) {
        if (attribute.name === 'xml:base') throw Error('unsafeSvg');
        if (/^on/i.test(attribute.localName)) throw Error('unsafeSvg');
        if (attribute.localName === 'href' && !/^#[\w:.-]+$/.test(attribute.value)) throw Error('unsafeSvg');
        if (unsafeCss(attribute.value) || /javascript\s*:/i.test(attribute.value)) throw Error('unsafeSvg');
      }
    }
    // A browser image context is used; SVG markup is never injected into the page.
    return new XMLSerializer().serializeToString(doc.documentElement);
  }

  function decode(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      const timer = setTimeout(() => finish(Error('previewTimeout')), 10000);
      function finish(error) {
        clearTimeout(timer); image.onload = null; image.onerror = null;
        URL.revokeObjectURL(url);
        if (error) reject(error); else resolve(image);
      }
      image.onload = () => finish(); image.onerror = () => finish(Error('invalid_image')); image.src = url;
    });
  }

  async function prepare(file, maxBytes = MAX_BYTES) {
    if (!file.size) throw Error('emptyFile');
    if (file.size > maxBytes) throw Error('too_large');
    const bytes = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    let format = detect(bytes), upload = file, converted = false, image = null;
    if (!format && (/\.svg$/i.test(file.name) || file.type === 'image/svg+xml')) {
      if (file.size > 1024 * 1024) throw Error('svgTooLarge');
      const safe = validateSvg(await file.text());
      image = await decode(new Blob([safe], { type: 'image/svg+xml' }));
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > MAX_PIXELS) throw Error('dimensions');
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!png || !png.size) throw Error('invalid_image');
      if (png.size > maxBytes) throw Error('too_large');
      upload = new File([png], file.name.replace(/\.svg$/i, '') + '.png', { type: 'image/png' });
      converted = true; format = 'png';
    }
    if (!format) throw Error('unsupported');
    if (!image) {
      try { image = await decode(file); }
      catch (error) {
        // Some valid formats have no browser decoder. The server checks the file again.
        if (!['tiff', 'heic', 'heif', 'avif'].includes(format)) throw error;
      }
    }
    if (image && image.naturalWidth * image.naturalHeight > MAX_PIXELS) throw Error('dimensions');
    return { file: upload, originalName: file.name, format, converted, preview: Boolean(image), width: image?.naturalWidth || null, height: image?.naturalHeight || null };
  }

  return Object.freeze({ MAX_BYTES, MAX_PIXELS, detect, prepare, validateSvg });
});
