var ui = {
initial: function(name) {
var t = String(name || '?').split(' ').slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
var bg = (getComputedStyle(document.body).getPropertyValue('--pColor') || '#427aa1').trim();
var svg = `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='150' height='150' fill='${bg}'/><text x='50%' y='50%' dy='.35em' text-anchor='middle' font-size='56' font-family='sans-serif' fill='#fff'>${t}</text></svg>`;
return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
},

renderHeader: function(user) {
const ctas = user.cta || user.media || [];
return `
<div class="row shadow">
<div class="col-1-4">
${user.avatar ? `<div class="user-avatar">
<img id="avatar" class="img" style="max-width:150px;" src="${user.avatar}" alt="${user.name || user.nama}" onerror="this.onerror=null;this.src=ui.initial(this.alt)" ></div>
${user.media ? `<div class="user-avatar"><p>
${(user.media || []).map(item => `<img data-src="${item.icon}" alt="Donat">`).join('')}
</p></div>` : ''}` : `<img class="img" style="max-width:150px;" data-src="${user.avatar || user.icon}">`}
</div>

<div class="col-3-4">
<div class="artikel">
<h1>${user.name || user.nama}</h1>
<p><strong>${user.role || user.tagline}</strong></p>
<p>
${user.bio || user.deskripsi}</p>
${user.location ? `<small>${user.location} | ${user.email}</small>` : ''}
</div>
${user.cta ? `<div class="artikel">
${ctas.map(item => `<button ${item.onclick ? `onclick="${item.onclick}"` : ''}> <img data-src="${item.icon}" alt="Donat"> ${item.text}</button> `).join('')}
</div>` : ''}
</div>
</div>`;
},

renderKpi: function(items) {
return items.map(item => {
const nm = String(item.icon || '').replace('?', '').split('/')[0];
return `
<div class="col-1-4">
<div class="card shadow">
<img data-src="?${nm}/150x150" alt="">
<strong>${item.nama || item.title}</strong>
<div class="artikel"><span class="kpi-val">${item.isi}</span>${item.info ? `<small class="kpi-trend">${item.info}</small>` : ''}</div>
</div>
</div>`;
}).join('');
},

renderBars: function(items, satuan) {
const max = Math.max.apply(null, items.map(i => i.value)) || 1;
return `<div class="bars">` + items.map(i => `
<div class="bar-col" title="${i.label}: ${i.value} ${satuan || ''}">
<div class="bar-plot"><div class="bar ${i.value === max ? 'top' : ''}" style="height:calc((100% - 22px) * ${i.value / max})"><span class="bar-val">${i.value}</span></div></div>
<span class="bar-label">${i.label}</span>
</div>`).join('') + `</div>`;
},

renderLegend: function(items, colors) {
return `<ul class="legend">` + items.map((it, i) => `<li><i style="background:${colors[i]}"></i><span>${it.nama}</span><b>${it.isi}%</b></li>`).join('') + `</ul>`;
},

renderStats: function(items) {
return items.map(item => `
<div class="col-1-4">
<div class="card shadow">
<img data-src="${item.icon}">
<strong>${item.nama || item.title || item.name}</strong>
<div class="artikel">${item.isi || item.desc || ''}<br/></div>
</div>
</div>`).join('');
},

renderTable: function(data) {
if (!data || data.length === 0) return "<p>Data tidak tersedia.</p>";
const headers = Object.keys(data[0]);
let html = `<table class="table"><thead><tr>`;
headers.forEach(h => html += `<th>${h.toUpperCase()}</th>`);
html += `</tr></thead><tbody>`;
data.forEach(row => {
html += `<tr>`;
headers.forEach(h => html += `<td>${row[h]}</td>`);
html += `</tr>`;
});
return html + `</tbody></table>`;
},

// Render Progress Bars
renderProgress: function(progressData, colors) {
return progressData.map((p, i) => `
<div class="progress-bar-linear"><p class="progress-bar-text"><span>${p.label}</span><span>${p.value} (${p.percent}%)</span></p>
<div class="progress-bar">
<span data-percent="${p.percent}" style="background:${colors[i]}; width:${p.percent}%;"> </span>
</div>
</div>`).join('');
},

/* ===== komponen daftar & drawer (tabel gaya Master) =====
   Dipakai halaman daftar: kuliah.js (Kelas Kuliah, Jadwal Perkuliahan) dan mkuliah.js (Mata Kuliah).
   Pola: ui.listPage -> toolbar (ui.sel / ui.search) -> ui.list (tabel #table + paging #paging) -> klik baris -> ui.drawer (ringkasan, tombol Edit -> form DonatJS). */
esc: function(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },

// render ikon <img data-src> yang baru disisipkan (satu pintu untuk semua halaman)
gambar: function() { if (typeof d.renderImage === 'function') { d.renderImage(); } },

// nama program studi: "S1 - Informatika"
prodi: function(p) { return p && p.nama ? p.jenjang + ' - ' + p.nama : ''; },

badge: function(t, c) { return '<span class="badge" style="white-space:nowrap;background:' + c + '">' + ui.esc(t) + '</span>'; },

// fungsi tombol menurut ikon -> atribut data-action (warna latar diatur di tambahan.css); selain yang terdaftar = Info
AKSI: { plus: 'Add', pen: 'Edit', prev: 'Back', trush: 'Delete' },

// aksi = fungsi tombol (menentukan warna di tambahan.css); kosong = menurut ikon
btn: function(label, icon, act, on, aksi) {
return '<button class="' + css.button + '" data-action="' + (aksi || ui.AKSI[icon] || 'Info') + '"' + (on ? ' onclick="' + act + '"' : ' disabled title="Belum tersedia" style="opacity:.45;cursor:not-allowed"') + '> <img data-src="?' + icon + '/32x32" alt="Donat"> ' + label + '</button>';
},

// tombol pilihan (chip): on = terpilih, extra = atribut tambahan (style/title)
chip: function(label, on, act, extra) {
return '<button class="' + css.button + (on ? ' aktif' : '') + '"' + (extra || '') + ' onclick="' + act + '">' + label + '</button>';
},

head: function(judul, sub) {
return '<div class="dash-head"><div><h2>' + judul + '</h2><small>' + sub + '</small></div>' + (window.notif ? notif.bell() : '') + '</div>';
},

// pilihan <option>; all = teks pilihan "semua" (nilainya allVal, default 0)
opt: function(arr, val, label, all, allVal) {
return (all ? '<option value="' + (allVal == null ? 0 : allVal) + '">' + all + '</option>' : '') +
arr.map(function(x) { return '<option value="' + ui.esc(x.id) + '"' + (x.id == val ? ' selected' : '') + '>' + ui.esc(label(x)) + '</option>'; }).join('');
},

// fn = nama fungsi controller (k, v); k = kunci filter
sel: function(fn, k, html, min) {
return '<select class="input" style="flex:1;min-width:' + (min || 160) + 'px" onchange="' + fn + '(\'' + k + '\',this.value)">' + html + '</select>';
},

// kolom cari + baris per halaman; l = {q, rpp, page}
search: function(fn, l, ph) {
return '<input class="input" style="flex:2;min-width:180px" type="text" placeholder="' + ph + '" value="' + ui.esc(l.q) + '" onkeyup="' + fn + '(\'q\',this.value)">' +
'<select class="input" onchange="' + fn + '(\'rpp\',this.value)">' + [5, 10, 50].map(function(n) { return '<option' + (n == l.rpp ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select>';
},

/* filter toolbar bersama (dropdown + chip berhitung); dipakai bersama ui.search dan ui.btn di ui.listPage.
   o = { fn: nama fungsi controller (k, v) yang menerima perubahan, st: state filter modul,
         sel: [{k: kunci di st, arr: [{id, nama}], label: fungsi(x) -> teks (bawaan x.nama atau x.id), all: teks pilihan "semua" (kosong = tanpa), allVal: nilainya (bawaan ''), min: lebar minimum}],
         chip: {k: kunci di st, semua: teks chip "semua" (kosong = tanpa), n: jumlah semua, items: [{id, nama, n}]} }
   Pasangkan dengan ui.filterSet di fungsi fn. Contoh: mhspa.js. */
filter: function(o) {
var nm = function(x) { return x.nama || x.id; };
var sel = (o.sel || []).map(function(s) {
return ui.sel(o.fn, s.k, ui.opt(s.arr, o.st[s.k], s.label || nm, s.all, s.allVal == null ? '' : s.allVal), s.min);
}).join('');
var c = o.chip, chip = '';
if (c) {
var tombol = function(id, teks, n) {
return ui.chip(ui.esc(teks) + (n == null ? '' : ' (' + n + ')'), o.st[c.k] === id, o.fn + "('" + c.k + "','" + id + "')");
};
chip = (c.semua ? tombol('', c.semua, c.n) : '') + (c.items || []).map(function(i) { return tombol(i.id, i.nama, i.n); }).join('');
}
return sel + chip;
},

// terapkan satu perubahan filter ke st: kunci di daftar angka diubah ke Number; halaman daftar l kembali ke 1 (l kosong = tidak ada)
filterSet: function(st, l, k, v, angka) {
st[k] = (angka || []).indexOf(k) >= 0 ? Number(v) : v;
if (l) { l.page = 1; }
},

// ubah state daftar dari toolbar: q = teks, selain itu angka; halaman kembali ke 1
query: function(l, k, v) { l[k] = (k === 'q') ? v : Number(v); l.page = 1; },

// kerangka kartu halaman: judul (ui.head) + satu kartu isi; nav (opsional, ui.subnav) = menu di sisi kiri isi (halaman detail)
panel: function(head, body, nav) {
if (nav) { return '<div class="dash">' + head + '<div class="dt-layout"><aside class="shadow dt-nav">' + nav + '</aside><div class="shadow dt-main">' + body + '</div></div></div>'; }
return '<div class="dash">' + head + '<div class="row"><div class="col-1-1"><div class="shadow">' + body + '</div></div></div></div>';
},

// menu samping halaman detail: items = [{t: teks, go: rute navigate, on: aktif, dim: belum tersedia}]
subnav: function(items) {
return '<ul class="dt-menu">' + items.map(function(i) {
return '<li class="' + (i.on ? 'active' : '') + (i.dim ? ' belum' : '') + '" onclick="navigate(\'' + i.go + '\')">' + ui.esc(i.t) + '</li>';
}).join('') + '</ul>';
},

// kerangka halaman daftar (id #table dan #paging sama dengan Master, sehingga gaya hover/terpilih ikut berlaku)
listPage: function(head, bar, nav) {
return ui.panel(head, '<div style="display:flex;flex-wrap:wrap;gap:8px">' + bar + '</div>' +
'<div id="table" class="gTable"></div><div id="paging" class="gpaging" style="margin-top:10px"></div>', nav);
},

// cols = [{t: judul, k: kunci | v: fungsi(row) -> html, s: style}]; baris diklik -> click(id) (click kosong = baris tidak bisa diklik)
table: function(cols, rows, click) {
if (!rows.length) { return '<p>Data tidak ditemukan.</p>'; }
return '<table class="table"><thead><tr>' + cols.map(function(c) { return '<th scope="col">' + c.t + '</th>'; }).join('') + '</tr></thead><tbody>' +
rows.map(function(r) {
return '<tr data-id="' + r.id + '"' + (click ? ' onclick="' + click + '(' + r.id + ')"' : '') + '>' + cols.map(function(c) {
return '<td data-title="' + c.t + '"' + (c.s ? ' style="' + c.s + '"' : '') + '>' + (c.v ? c.v(r) : ui.esc(r[c.k])) + '</td>';
}).join('') + '</tr>';
}).join('') + '</tbody></table>';
},

paging: function(id, page, np, n, rpp, fn) {
var p = page === 1 ? 'hide' : 'show', x = page === np ? 'hide' : 'show';
if (n < rpp) { p = 'hide'; x = 'hide'; }
d.gebi(id).innerHTML = '<div class="gPaging">' +
'<button class="button ' + p + '" onclick="' + fn + '(' + (page - 1) + ')"><img data-src="?prev/32x32"> Prev </button>' +
'<button class="button ' + x + '" onclick="' + fn + '(' + (page + 1) + ')"> <img data-src="?next/32x32"> Next </button>' +
'<span>page: ' + page + '/' + np + ' data:' + n + ' row(s) </span></div>';
},

// gambar tabel + paging dari o = {rows (sudah difilter), l ({rpp, page}), cols, click, go (fungsi halaman)}
list: function(o) {
var np = Math.max(1, Math.ceil(o.rows.length / o.l.rpp));
if (o.l.page > np) { o.l.page = np; }
d.gebi('table').innerHTML = ui.table(o.cols, o.rows.slice((o.l.page - 1) * o.l.rpp, o.l.page * o.l.rpp), o.click);
ui.paging('paging', o.l.page, np, o.rows.length, o.l.rpp, o.go);
ui.gambar();
},

// tabel ringkasan di drawer: pairs = [[label, html], ...]
detail: function(pairs) {
return '<table class="table ringkas"><tbody>' + pairs.map(function(p) { return '<tr><th>' + p[0] + '</th><td>' + p[1] + '</td></tr>'; }).join('') + '</tbody></table>';
},

// tandai baris terpilih (dibersihkan d.controller.unselect saat drawer ditutup)
pick: function(id) {
d.controller.unselect();
var r = d.qs('.table tr[data-id="' + id + '"]'); if (r) { r.classList.add('selected'); }
},

/* drawer data: mode ringkasan (default) atau form DonatJS.
   o = {judul, tb (tabel dataset), modul, row, mode, ringkas (html), aksi (html tombol), back/edit/hapus (aksi onclick; hapus kosong = tanpa tombol Delete), kembali (label tombol back, default Ringkasan), lanjut (kolom teknis)} */
drawer: function(o) {
d.service.init();
modul = o.modul;
d.service.param.t = o.tb;
d.model.edit.input.tipe = dataset[o.tb].tipe;
d.model.edit.input.data = o.row;
ui.pick(o.row.id);
if (o.mode === 'form') {
d.sidePanel(o.judul, '<div class="aksi-bar">' + ui.btn(o.kembali || 'Ringkasan', 'prev', o.back, true) + '</div>' + d.view.edit(d.model.edit));
if (o.lanjut) { ui.lanjut(o.lanjut, 'Lanjutan'); }
if (o.hapus) { ui.hapus(o.hapus); }
} else {
d.sidePanel(o.judul, '<div class="aksi-bar">' + (o.aksi || '') + ui.btn('Edit', 'pen', o.edit, true) + '</div>' + o.ringkas);
}
ui.gambar();
},

// bungkus kolom teknis form (yang sudah dirender DonatJS) ke <details> tertutup; kolom tetap di dalam <form> sehingga ikut tersimpan
lanjut: function(ids, label) {
var f = d.gebi('form'); if (!f) { return; }
var box = document.createElement('details'), n = 0; box.className = 'lanjut';
ids.forEach(function(i) { var el = f.querySelector('[name="' + i + '"]'), w = el && el.closest('.col-1-1'); if (w) { box.appendChild(w); n++; } });
if (!n) { return; }
var sm = document.createElement('summary'); sm.textContent = label + ' (' + n + ' kolom)'; box.insertBefore(sm, box.firstChild);
f.appendChild(box);
},

// tombol Delete pada baris tombol bawaan form (Cancel, Update)
hapus: function(act) {
var bs = document.querySelectorAll('#panel-body [data-action="Update"]'), g = bs.length ? bs[bs.length - 1].parentNode : document.querySelector('#panel-body .gButton[class*="kanan"]');
if (!g) { return; }
g.insertAdjacentHTML('beforeend', ui.btn('Delete', 'x', act, true, 'Delete'));
},

// konfirmasi lalu hapus 1 baris dataset: after = fungsi penyegar halaman
hapusRow: function(tb, id, judul, pesan, after) {
ui.konfirmasi(judul, pesan, function() {
d.model.id = String(id);
d.service.param.mod = 'delete';
d.service.param.t = tb;
d.service.get(function() { d.closePanel(); d.info('Terhapus'); after(); });
});
},

// modal konfirmasi (kelas .depan/.modal/.modalbar bawaan DonatJS), pengganti confirm() browser
konfirmasi: function(judul, pesan, ya) {
ui.tutupKonfirmasi();
var o = document.createElement('div');
o.id = 'konfirmasi'; o.className = 'depan konfirm'; ui._ya = ya;
o.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><div class="row modalbar"><span class="kiri">' + ui.esc(judul) + '</span>' +
'<button class="merah" title="Tutup" onclick="ui.tutupKonfirmasi()">x</button></div>' +
'<div class="row modalcontent"><div class="info">' + pesan + '</div>' +
'<div class="gButton kanan">' +
ui.btn('Cancel', 'x', 'ui.tutupKonfirmasi()', true, 'Cancel') + ui.btn('Delete', 'check', 'ui.yaKonfirmasi()', true, 'Delete') + '</div></div></div>';
o.onclick = function(ev) { if (ev.target === o) { ui.tutupKonfirmasi(); } };
document.body.appendChild(o);
ui.gambar();
var b = o.querySelector('[data-action="Cancel"]'); if (b) { b.focus(); }
},
tutupKonfirmasi: function() { var o = document.getElementById('konfirmasi'); if (o) { o.remove(); } ui._ya = null; },
yaKonfirmasi: function() { var f = ui._ya; ui.tutupKonfirmasi(); if (f) { f(); } }

};

document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { ui.tutupKonfirmasi(); } });
