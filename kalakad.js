/* Kalender Akademik (meniru SEVIMA /siakad/view_kalender, peran Dosen).
   Data dari dataset.js (kalender, periode). Pola: daftar hanya baca, filter periode dan kategori kegiatan.
   Komponen bersama: lihat ui di app.js; periode aktif dan format tanggal dari kuliah.model (kuliah.js).
   Nama modul "kalakad" karena "kalender" sudah dipakai tabel dataset. Tampilan grid bulanan belum dibuat. */
var kalakad = {
    st: { periode: 0, kategori: '', list: { q: '', rpp: 10, page: 1 } },

    model: {
        data: function() { d.service.init(); return dataset; },
        // daftar kategori = pilihan field "kategori" pada tabel kalender
        kategori: function() {
            var t = kalakad.model.data().kalender.tipe.find(function(x) { return x.id === 'kategori'; });
            return t ? t.arr.split(',') : [];
        },
        waktu: function(a, b) {
            var f = kuliah.model.tglPanjang;
            return !b || a === b ? f(a) : f(a) + ' - ' + f(b);
        },
        rows: function() {
            var m = kalakad.model, st = kalakad.st, q = st.list.q.toLowerCase();
            return m.data().kalender.data.filter(function(x) {
                return x.periode_id == st.periode && (!st.kategori || x.kategori === st.kategori);
            }).sort(function(a, b) {
                return String(a.tgl_mulai).localeCompare(String(b.tgl_mulai));
            }).map(function(x) {
                // x.kegiatan = nama kolom skema lama
                return { id: x.id, waktu: m.waktu(x.tgl_mulai, x.tgl_selesai), nama: x.nama || x.kegiatan || '-', keterangan: x.keterangan || '-', kategori: x.kategori };
            }).filter(function(r) {
                return !q || [r.waktu, r.nama, r.keterangan, r.kategori].join(' ').toLowerCase().indexOf(q) >= 0;
            });
        }
    },

    view: {
        cols: [
            { t: 'Waktu Kegiatan', k: 'waktu', s: 'white-space:nowrap' },
            { t: 'Nama Kegiatan', k: 'nama' },
            { t: 'Keterangan', k: 'keterangan' }
        ],
        chips: function() {
            return [''].concat(kalakad.model.kategori()).map(function(k) {
                return ui.chip(ui.esc(k || 'Semua Kegiatan'), kalakad.st.kategori === k, "kalakad.controller.filter('kategori','" + ui.esc(k) + "')");
            }).join('');
        }
    },

    controller: {
        kalakad: function() {
            var ds = kalakad.model.data(), st = kalakad.st; modul = 'kalakad';
            if (!st.periode) { st.periode = kuliah.model.aktif(); }
            d.gebi('content').innerHTML = ui.listPage(ui.head('Kalender Akademik', 'Daftar Kegiatan Akademik'),
                ui.sel('kalakad.controller.filter', 'periode', ui.opt(ds.periode.data.slice().reverse(), st.periode, function(p) { return p.nama; })) +
                ui.search('kalakad.controller.kset', st.list, 'Cari Kegiatan') +
                '<div style="display:flex;flex-wrap:wrap;gap:8px;width:100%">' + kalakad.view.chips() + '</div>');
            kalakad.controller.draw();
        },
        view: function() { kalakad.controller.kalakad(); },
        filter: function(k, v) {
            kalakad.st[k] = (k === 'periode') ? Number(v) : v;
            kalakad.st.list.page = 1;
            kalakad.controller.view();
        },
        kset: function(k, v) { ui.query(kalakad.st.list, k, v); kalakad.controller.draw(); },
        go: function(n) { kalakad.st.list.page = n; kalakad.controller.draw(); },
        draw: function() { ui.list({ rows: kalakad.model.rows(), l: kalakad.st.list, cols: kalakad.view.cols, click: '', go: 'kalakad.controller.go' }); }
    }
};
