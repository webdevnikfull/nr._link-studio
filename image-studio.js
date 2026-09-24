/* Public image links use the configured PHP service. Previews stay local. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('tool') !== 'image') return;
  const $ = id => document.getElementById(id);
  const config = window.NR_LINK_STUDIO || {};
  const dictionaries = window.NRImageTranslations;
  let lang = Object.hasOwn(dictionaries, params.get('lang')) ? params.get('lang') : 'pl';
  let prepared = null, previewURL = '', uploaded = null, version = 0;
  let busy = '', ready = false, checkingService = false, maxBytes = NRImageFiles.MAX_BYTES, retentionDays = 30;
  let messageKey = 'checkingService', messageError = false;
  let endpoint;
  try { endpoint = config.imageApiUrl ? new URL(config.imageApiUrl, location.href) : null; } catch { endpoint = null; }

  document.documentElement.dataset.tool = 'image';
  $('link-workspace').hidden = true;
  $('image-workspace').hidden = false;
  document.querySelectorAll('.tool-tabs a').forEach(link => {
    if (new URL(link.href).searchParams.get('tool') === 'image') link.setAttribute('aria-current', 'page');
  });

  function t(key, values = {}) {
    const variables = { max: maxBytes / 1024 / 1024, days: retentionDays, ...values };
    return (dictionaries[lang][key] || dictionaries[lang].unavailable).replace(/\{(\w+)\}/g, (_, name) => variables[name] ?? '');
  }
  function message(key = '', error = false) {
    messageKey = key; messageError = error;
    $('image-message').textContent = key ? t(key) : '';
    $('image-message').classList.toggle('error', error);
  }
  function controls() {
    $('image-drop').disabled = Boolean(busy);
    $('image-file').disabled = Boolean(busy);
    $('clear-image').disabled = Boolean(busy);
    $('upload-image').disabled = Boolean(busy) || !prepared || !ready || Boolean(uploaded);
    $('delete-image').disabled = Boolean(busy);
    $('image-progress').hidden = busy !== 'upload';
    $('image-retry').hidden = ready || checkingService || Boolean(busy);
    $('image-workspace').setAttribute('aria-busy', String(Boolean(busy)));
    $('upload-image').querySelector('[data-i]').textContent = t(busy === 'upload' ? 'uploading' : 'upload');
  }
  function dateText(value) {
    return new Intl.DateTimeFormat({ pl: 'pl-PL', en: 'en-GB', de: 'de-DE' }[lang], {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(value));
  }
  function updateResult() {
    $('image-output').hidden = !uploaded;
    $('image-ready').hidden = !uploaded;
    $('image-preview-note').hidden = Boolean(uploaded);
    $('preview-tag').textContent = t(uploaded ? 'publicPreview' : 'localPreview');
    if (!uploaded) return;
    $('image-result-url').value = uploaded.url;
    $('open-image').href = uploaded.url;
    $('image-expiry').textContent = t('expiry', { date: dateText(uploaded.expiresAt) });
    const qr = new URL('index.html', location.href);
    qr.searchParams.set('tool', 'qr'); qr.searchParams.set('lang', lang);
    qr.hash = new URLSearchParams({ url: uploaded.url }).toString();
    $('image-make-qr').href = qr.href;
  }
  function localize() {
    document.documentElement.lang = lang;
    $('language').value = lang;
    document.title = `NR. Link Studio — ${t('imageTab')}`;
    document.querySelector('meta[name="description"]').content = t('meta');
    document.querySelectorAll('[data-i]').forEach(element => {
      if (Object.hasOwn(dictionaries[lang], element.dataset.i)) element.textContent = t(element.dataset.i);
    });
    document.querySelectorAll('.tool-tabs a').forEach(link => {
      const url = new URL(link.href); url.searchParams.set('lang', lang); link.href = url.href;
    });
    document.querySelector('.tool-tabs').setAttribute('aria-label', 'Link Studio');
    $('theme').setAttribute('aria-label', t('theme'));
    $('image-file').setAttribute('aria-label', t('imageInputHeading'));
    $('clear-image').setAttribute('aria-label', t('removeFile'));
    $('image-result-url').setAttribute('aria-label', t('publicLink'));
    $('image-progress').querySelector('progress').setAttribute('aria-label', t('uploading'));
    document.querySelector('.image-limit').textContent = `${maxBytes / 1024 / 1024} MB`;
    const home = config.portfolioUrl || 'index.html';
    $('portfolio-link').href = home; $('back-link').href = home; $('back-link').hidden = !config.portfolioUrl;
    message(messageKey, messageError);
    updateResult(); controls();
  }

  function clearSelection() {
    version++;
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = ''; prepared = null; uploaded = null;
    $('image-file').value = '';
    $('image-preview').removeAttribute('src'); $('selected-thumb').removeAttribute('src');
    $('image-empty').hidden = false; $('image-preview-wrap').hidden = true; $('selected-file').hidden = true;
    $('image-result-url').value = '';
    $('open-image').removeAttribute('href'); $('image-make-qr').removeAttribute('href');
    updateResult(); controls();
  }
  function formatBytes(bytes) {
    return new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(bytes < 1048576 ? bytes / 1024 : bytes / 1048576) + (bytes < 1048576 ? ' KB' : ' MB');
  }
  async function selectFiles(files) {
    if (busy || !files?.length) return;
    if (files.length !== 1) { message('multiple', true); return; }
    const file = files[0];
    clearSelection();
    const selectedVersion = version;
    busy = 'prepare'; controls(); message('checking');
    try {
      const selection = await NRImageFiles.prepare(file, maxBytes);
      if (selectedVersion !== version) return;
      prepared = selection;
      $('selected-name').textContent = selection.file.name;
      $('selected-meta').textContent = `${selection.format.toUpperCase()} · ${formatBytes(selection.file.size)}${selection.width ? ` · ${selection.width} × ${selection.height} px` : ''}`;
      $('preview-name').textContent = selection.file.name;
      $('selected-file').hidden = false; $('image-empty').hidden = true; $('image-preview-wrap').hidden = false;
      $('preview-fallback').hidden = selection.preview;
      $('image-preview').hidden = !selection.preview;
      $('selected-thumb').hidden = !selection.preview;
      $('selected-extension').hidden = selection.preview;
      $('fallback-extension').textContent = $('selected-extension').textContent = selection.format.toUpperCase();
      if (selection.preview) {
        previewURL = URL.createObjectURL(selection.file);
        $('image-preview').src = previewURL; $('image-preview').alt = selection.file.name;
        $('selected-thumb').src = previewURL;
      }
      message(!ready ? 'unavailable' : (selection.converted ? 'svgConverted' : 'selected'), !ready);
    } catch (error) {
      message(Object.hasOwn(dictionaries[lang], error.message) ? error.message : 'invalid_image', true);
    } finally { if (selectedVersion === version) { busy = ''; controls(); } }
  }

  async function request(options = {}, timeoutMs = 30000) {
    if (!endpoint) throw Error('unavailable');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, { ...options, signal: controller.signal, credentials: 'omit', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw Error(data.error || 'unavailable');
      return data;
    } finally { clearTimeout(timer); }
  }
  function errorMessage(error) {
    return Object.hasOwn(dictionaries[lang], error.message) ? error.message : 'unavailable';
  }
  function validateResult(data) {
    const url = new URL(data.url);
    if (!endpoint || url.origin !== endpoint.origin || !['https:', 'http:'].includes(url.protocol) ||
        !/^[a-f0-9]{32}$/.test(data.id) || !/^[a-f0-9]{64}$/.test(data.deleteToken) ||
        url.searchParams.get('id') !== data.id || !Number.isFinite(Date.parse(data.expiresAt))) throw Error('unavailable');
    return { ...data, url: url.href };
  }

  $('image-drop').addEventListener('click', () => $('image-file').click());
  $('image-file').addEventListener('change', event => selectFiles(event.target.files));
  ['dragenter', 'dragover'].forEach(type => $('image-drop').addEventListener(type, event => {
    event.preventDefault(); if (!busy) $('image-drop').classList.add('is-dragging');
  }));
  ['dragleave', 'drop'].forEach(type => $('image-drop').addEventListener(type, event => {
    event.preventDefault(); $('image-drop').classList.remove('is-dragging');
  }));
  $('image-drop').addEventListener('drop', event => selectFiles(event.dataTransfer.files));
  // Prevent an accidental browser navigation if a file is dropped outside the drop zone.
  document.addEventListener('dragover', event => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); });
  document.addEventListener('drop', event => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); });
  $('clear-image').addEventListener('click', () => {
    if (busy) return;
    clearSelection(); message(ready ? '' : 'unavailable', !ready); $('image-drop').focus();
  });

  $('upload-image').addEventListener('click', async () => {
    if (!prepared || !ready || busy || uploaded) return;
    const uploadVersion = version;
    busy = 'upload'; controls(); message('uploading');
    try {
      const form = new FormData(); form.append('image', prepared.file, prepared.file.name);
      const data = validateResult(await request({ method: 'POST', body: form }, 60000));
      if (version !== uploadVersion) return;
      uploaded = data; updateResult(); message('generated');
      if (matchMedia('(max-width: 760px)').matches) {
        $('image-output').scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }
    } catch (error) { if (version === uploadVersion) message(errorMessage(error), true); }
    finally { busy = ''; controls(); }
  });
  $('image-copy').addEventListener('click', async () => {
    if (!uploaded) return;
    try { await navigator.clipboard.writeText(uploaded.url); message('copied'); }
    catch { $('image-result-url').focus(); $('image-result-url').select(); message('copyError', true); }
  });
  $('delete-image').addEventListener('click', async () => {
    if (!uploaded || busy) return;
    busy = 'delete'; controls(); message('deleting');
    try {
      await request({ method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: uploaded.id, deleteToken: uploaded.deleteToken }) });
      uploaded = null; updateResult(); message('deleted'); $('image-drop').focus();
    } catch (error) { message(errorMessage(error), true); }
    finally { busy = ''; controls(); }
  });
  $('image-receipt').addEventListener('click', () => {
    if (!uploaded) return;
    const content = `NR. Link Studio\n${uploaded.url}\n${t('expiry', { date: dateText(uploaded.expiresAt) })}\n`;
    const href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = href; link.download = 'nr-image-link.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(href), 10000); message('saved');
  });
  $('language').addEventListener('change', () => {
    if (!Object.hasOwn(dictionaries, $('language').value)) return;
    lang = $('language').value;
    const url = new URL(location.href); url.searchParams.set('lang', lang); history.replaceState(null, '', url);
    localize();
  });
  $('theme').setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
  $('theme').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('theme').setAttribute('aria-pressed', String(dark));
    try { localStorage.setItem('qa-portfolio-theme', dark ? 'dark' : 'light'); } catch { /* Optional setting. */ }
  });
  window.addEventListener('pagehide', () => { if (previewURL) URL.revokeObjectURL(previewURL); previewURL = ''; });
  window.addEventListener('pageshow', event => {
    if (event.persisted && prepared?.preview && !previewURL) {
      previewURL = URL.createObjectURL(prepared.file);
      $('image-preview').src = previewURL; $('selected-thumb').src = previewURL;
    }
  });

  async function checkService() {
    if (checkingService) return;
    checkingService = true; controls(); message('checkingService');
    try {
      const data = await request({}, 8000);
      if (!Number.isFinite(data.maxBytes) || data.maxBytes <= 0 || !Number.isFinite(data.retentionDays) || data.retentionDays <= 0) throw Error('unavailable');
      maxBytes = Math.min(data.maxBytes, NRImageFiles.MAX_BYTES); retentionDays = data.retentionDays; ready = true;
      if (prepared && prepared.file.size > maxBytes) { clearSelection(); message('too_large', true); }
      else if (messageKey === 'checkingService' || messageKey === 'unavailable') message(prepared ? (prepared.converted ? 'svgConverted' : 'selected') : '');
      localize();
    } catch { ready = false; if (!busy) message('unavailable', true); }
    finally { checkingService = false; controls(); }
  }
  $('image-retry').addEventListener('click', checkService);
  window.addEventListener('online', () => { if (!ready && !busy) checkService(); });
  localize(); checkService();
})();
