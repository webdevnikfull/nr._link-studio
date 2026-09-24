'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const fixtures = path.join(__dirname, 'fixtures');
const model = require(path.join(project, 'image-files.js'));
const source = fs.readFileSync(path.join(project, 'image-files.js'), 'utf8');
const html = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(project, 'image-translations.js'), 'utf8'), context);
const translations = context.window.NRImageTranslations;
const bytes = name => new Uint8Array(fs.readFileSync(path.join(fixtures, name)));

test('identifies valid synthetic raster fixtures from their contents', () => {
  const cases = {
    'synthetic.jpg': 'jpeg', 'synthetic.jpeg': 'jpeg',
    'synthetic.png': 'png', 'transparent.png': 'png',
    'synthetic.gif': 'gif', 'synthetic.webp': 'webp',
    'synthetic.bmp': 'bmp', 'synthetic.ico': 'ico',
    'synthetic.tif': 'tiff', 'synthetic.tiff': 'tiff',
    'synthetic.avif': 'avif',
  };
  for (const [file, expected] of Object.entries(cases)) {
    assert.equal(model.detect(bytes(file)), expected, file);
  }
});

test('detects JPEG content despite a PNG filename', () => {
  assert.equal(model.detect(bytes('renamed-jpeg.png')), 'jpeg');
});

test('rejects empty, text, and SVG as raster signatures', () => {
  for (const file of ['empty.png', 'fake.png', 'safe.svg', 'unsafe-script.svg', 'unsafe-external.svg']) {
    assert.equal(model.detect(bytes(file)), null, file);
  }
});

test('requires the complete minimum signature for each detected family', () => {
  for (const [file, length] of [['synthetic.jpg', 3], ['synthetic.png', 8], ['synthetic.gif', 6], ['synthetic.webp', 12], ['synthetic.ico', 4]]) {
    assert.equal(model.detect(bytes(file).slice(0, length - 1)), null, file);
  }
});

test('handles TIFF byte order and BigTIFF signatures', () => {
  for (const signature of [[73, 73, 42, 0], [77, 77, 0, 42], [73, 73, 43, 0], [77, 77, 0, 43]]) {
    assert.equal(model.detect(Uint8Array.from(signature)), 'tiff');
  }
});

function isoFile(major, compatible = []) {
  const buffer = Buffer.alloc(16 + compatible.length * 4);
  buffer.writeUInt32BE(buffer.length, 0);
  buffer.write('ftyp', 4); buffer.write(major, 8);
  compatible.forEach((brand, index) => buffer.write(brand, 16 + index * 4));
  return new Uint8Array(buffer);
}

test('distinguishes AVIF/HEIC/HEIF container brands from unrelated video', () => {
  assert.equal(model.detect(isoFile('avif')), 'avif');
  assert.equal(model.detect(isoFile('mif1', ['avif'])), 'avif');
  assert.equal(model.detect(isoFile('heic')), 'heic');
  assert.equal(model.detect(isoFile('mif1', ['heic'])), 'heic');
  assert.equal(model.detect(isoFile('mif1')), 'heif');
  assert.equal(model.detect(isoFile('mp42', ['isom'])), null);
});

test('signature detection does not falsely claim full image validation', () => {
  // This intentional result documents the need for actual decoding/server checks.
  assert.equal(model.detect(bytes('truncated.jpg')), 'jpeg');
});

test('prepare rejects empty and oversized inputs before decoding', async () => {
  await assert.rejects(model.prepare({ size: 0 }), { message: 'emptyFile' });
  await assert.rejects(model.prepare({ size: model.MAX_BYTES + 1 }), { message: 'too_large' });
  await assert.rejects(model.prepare({ size: 1025 }, 1024), { message: 'too_large' });
});

test('PL, EN and DE dictionaries have identical, nonempty keys and placeholders', () => {
  assert.deepEqual(Object.keys(translations).sort(), ['de', 'en', 'pl']);
  const base = Object.keys(translations.pl).sort();
  const placeholders = value => [...value.matchAll(/\{([a-zA-Z]+)\}/g)].map(match => match[1]).sort();
  for (const [locale, entries] of Object.entries(translations)) {
    assert.deepEqual(Object.keys(entries).sort(), base, `${locale}: missing/extra keys`);
    for (const key of base) {
      assert.equal(typeof entries[key], 'string', `${locale}.${key}`);
      assert.ok(entries[key].trim(), `${locale}.${key}: empty`);
      assert.deepEqual(placeholders(entries[key]), placeholders(translations.pl[key]), `${locale}.${key}: placeholders`);
      assert.ok(!entries[key].includes('\uFFFD'), `${locale}.${key}: damaged encoding`);
    }
  }
});

test('every new image section data-i key and shared navigation key is translated', () => {
  const imageSection = html.slice(html.indexOf('<section id="image-workspace"'), html.indexOf('<section class="how-it-works"'));
  assert.ok(imageSection.includes('id="upload-image"'), 'Image section must be found');
  const keys = new Set([...imageSection.matchAll(/data-i="([^"]+)"/g)].map(match => match[1]));
  ['imageTab', 'shortTab', 'qrTab', 'title', 'intro', 'step1', 'step1Text', 'step2', 'step2Text', 'step3', 'step3Text', 'back', 'language', 'skip'].forEach(key => keys.add(key));
  for (const locale of Object.keys(translations)) {
    for (const key of keys) assert.equal(typeof translations[locale][key], 'string', `${locale}.${key}`);
  }
});

test('file-preparation error identifiers have localized messages', () => {
  const keys = new Set([...source.matchAll(/(?:throw |finish\()Error\('([^']+)'\)/g)].map(match => match[1]));
  assert.ok(keys.has('unsafeSvg') && keys.has('invalid_image'));
  for (const locale of Object.keys(translations)) {
    for (const key of keys) assert.equal(typeof translations[locale][key], 'string', `${locale}.${key}`);
  }
});

