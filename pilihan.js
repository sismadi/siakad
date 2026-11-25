// Dropdown field *_id: tampil "id-nama" (mis. 1-Informatika) + kotak cari cepat.
// Nilai yang tersimpan tetap id. <select> asli tetap ada (disembunyikan) sehingga donat.js membaca/menyimpan seperti biasa.
(function () {
  'use strict';
  // Bersihkan kunci "" (sisa bug lama: kolom tampilan ikut tersimpan) dari data di localStorage.
  try {
    var raw = window.localStorage.getItem('dataset');
    if (raw) {
      var ds = JSON.parse(raw), kotor = false;
      Object.keys(ds).forEach(function (t) { ((ds[t] && ds[t].data) || []).forEach(function (r) { if (r && Object.prototype.hasOwnProperty.call(r, '')) { delete r['']; kotor = true; } }); });
      if (kotor) window.localStorage.setItem('dataset', JSON.stringify(ds));
    }
  } catch (e) {}

  // field *_id yang namanya bukan nama tabel (selain itu: buang akhiran _id)
  var PETA = { dosen_pa_id: 'dosen' };
  var panel = null, aktif = null;

  function data() {
    try { var s = window.localStorage.getItem('dataset'); if (s) return JSON.parse(s); } catch (e) {}
    return window.dataset || {};
  }
  function cari(D, tabel, id) {
    var t = D[tabel]; if (!t || !t.data) return null;
    for (var i = 0; i < t.data.length; i++) if (String(t.data[i].id) === String(id)) return t.data[i];
    return null;
  }
  function nama(field, id, D) {
    var tabel = PETA[field] || field.replace(/_id$/, '');
    if (String(id) === '0') return field === 'ruangan_id' ? 'Belum ditentukan' : '';
    var r = cari(D, tabel, id); if (!r) return '';
    if (tabel === 'kelas') { var m = cari(D, 'matakuliah', r.matakuliah_id); return r.kode + (m ? ' ' + m.nama : ''); }
    if (tabel === 'pertemuan') { var k = cari(D, 'kelas', r.kelas_id); return (k ? k.kode + ' ' : '') + 'Sesi ' + r.ke; }
    if (tabel === 'ruangan') return r.kode + (r.nama ? ' (' + r.nama + ')' : '');
    return r.nama || r.kode || r.judul || '';
  }
  function label(field, id, D) { var n = nama(field, id, D); return id === '' ? '' : (n ? id + '-' + n : String(id)); }

  function tutup() {
    if (panel) { panel.remove(); panel = null; }
    if (aktif) { aktif.inp.value = aktif.label(aktif.sel.value); aktif = null; }
  }
  function pilih(ctx, v) {
    ctx.sel.value = v; ctx.sel.setAttribute('value', v);
    ctx.sel.dispatchEvent(new Event('change', { bubbles: true }));
    ctx.inp.value = ctx.label(v);
    aktif = null; tutup();
    ctx.inp.blur();
  }
  function buka(ctx) {
    if (aktif && aktif !== ctx) tutup();
    aktif = ctx;
    if (!panel) {
      panel = document.createElement('div'); panel.className = 'pil-list'; document.body.appendChild(panel);
      panel.addEventListener('mousedown', function (e) { e.preventDefault(); });
    }
    var r = ctx.inp.getBoundingClientRect();
    var bawah = window.innerHeight - r.bottom, tinggi = Math.min(260, Math.max(120, bawah - 8));
    var naik = bawah < 160 && r.top > bawah;
    panel.style.left = r.left + 'px'; panel.style.width = r.width + 'px';
    if (naik) { panel.style.top = ''; panel.style.bottom = (window.innerHeight - r.top) + 'px'; tinggi = Math.min(260, r.top - 8); }
    else { panel.style.bottom = ''; panel.style.top = r.bottom + 'px'; }
    panel.style.maxHeight = tinggi + 'px';
    isi(ctx, '');
  }
  function isi(ctx, q) {
    q = q.toLowerCase(); panel.innerHTML = ''; ctx.idx = -1;
    var cur = ctx.sel.value, n = 0;
    ctx.opsi.forEach(function (o) {
      if (q && o.teks.toLowerCase().indexOf(q) < 0) return;
      var li = document.createElement('div'); li.className = 'pil-item' + (o.v === cur ? ' cur' : '');
      li.textContent = o.v === '' ? '— kosong —' : o.teks; li.dataset.v = o.v;
      li.addEventListener('click', function () { pilih(ctx, o.v); });
      panel.appendChild(li); n++;
    });
    if (!n) { var e = document.createElement('div'); e.className = 'pil-kosong'; e.textContent = 'Tidak ditemukan'; panel.appendChild(e); }
    var c = panel.querySelector('.cur'); if (c) c.scrollIntoView({ block: 'nearest' });
  }
  function sorot(ctx, arah) {
    var it = panel.querySelectorAll('.pil-item'); if (!it.length) return;
    ctx.idx = Math.max(0, Math.min(it.length - 1, ctx.idx + arah));
    [].forEach.call(it, function (x, i) { x.classList.toggle('hl', i === ctx.idx); });
    it[ctx.idx].scrollIntoView({ block: 'nearest' });
  }

  function tingkatkan(sel) {
    if (sel.dataset.pil || !/_id$/.test(sel.name || sel.id)) return;
    sel.dataset.pil = '1';
    var f = sel.name || sel.id, D = data();   // data dibaca sekali per dropdown, bukan per opsi
    var ctx = { sel: sel, idx: -1, label: function (v) { return label(f, v, D); } };
    ctx.opsi = [].map.call(sel.options, function (o) { return { v: o.value, teks: o.value === '' ? '' : ctx.label(o.value) }; });
    var inp = document.createElement('input');
    inp.type = 'text'; inp.className = sel.className; inp.autocomplete = 'off';
    inp.setAttribute('aria-label', f); inp.setAttribute('form', 'pil-tanpa-form'); inp.removeAttribute('name'); inp.removeAttribute('id'); inp.setAttribute('role', 'combobox');
    inp.value = ctx.label(sel.value); ctx.inp = inp;
    sel.style.display = 'none';
    sel.parentNode.insertBefore(inp, sel);
    inp.addEventListener('focus', function () { inp.select(); buka(ctx); });
    inp.addEventListener('click', function () { if (!panel || aktif !== ctx) { buka(ctx); } });
    inp.addEventListener('input', function () { if (aktif !== ctx) buka(ctx); isi(ctx, inp.value); });
    inp.addEventListener('blur', function () { if (aktif === ctx) tutup(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!panel) buka(ctx); sorot(ctx, 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (panel) sorot(ctx, -1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (panel) { var it = panel.querySelectorAll('.pil-item'); var x = it[ctx.idx >= 0 ? ctx.idx : 0]; if (x) pilih(ctx, x.dataset.v); } }
      else if (e.key === 'Escape') { if (panel) { e.stopPropagation(); tutup(); inp.blur(); } }
    });
  }
  function pindai(root) { [].forEach.call((root.querySelectorAll ? root.querySelectorAll('select[data-nama="option"]') : []), tingkatkan); }

  window.addEventListener('scroll', function (e) { if (panel && !panel.contains(e.target)) tutup(); }, true);
  window.addEventListener('resize', tutup);
  new MutationObserver(function (ms) {
    ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) { if (n.matches && n.matches('select[data-nama="option"]')) tingkatkan(n); else pindai(n); } }); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  pindai(document);
})();
