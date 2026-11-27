/* Berhenti Studi (meniru SEVIMA /siakad/set_berhentistudi, peran Dosen).
   Data dari dataset.js (berhenti, mahasiswa, prodi, periode). Pola sama dengan Kelas Kuliah (kuliah.js): filter periode, program studi, status; tabel kolom inti; detail di drawer (ringkasan, Edit -> form, Delete).
   Status Akademik dan Program Studi dibaca dari tabel mahasiswa, tidak disimpan di tabel berhenti.
   Komponen daftar, drawer, badge, paging, konfirmasi: lihat ui di app.js. */
var bstudi = {
    // filter: periode (id), prodi (id), status (teks, '' = semua); l = {q, rpp, page}
    st: { periode: 0, prodi: 0, status: '', l: { q: '', rpp: 10, page: 1 } },

    model: {
        data: function() { d.service.init(); return dataset; },
        find: function(tb, id) { return bstudi.model.data()[tb].data.find(function(x) { return x.id == id; }); },
        STATUS: [{ id: 'disetujui', nama: 'Disetujui' }, { id: 'proses validasi', nama: 'Proses Validasi' }, { id: 'dibatalkan', nama: 'Dibatalkan' }],
        WARNA: { 'disetujui': '#2e7d32', 'proses validasi': '#f0ad4e', 'dibatalkan': '#d9534f' },
        aktif: function() { var a = bstudi.model.data().periode.data.find(function(p) { return p.status === 'aktif'; }); return a ? a.id : 0; },
        rows: function() {
            var m = bstudi.model, st = bstudi.st, q = st.l.q.toLowerCase();
            return m.data().berhenti.data.map(function(b) {
                var mh = m.find('mahasiswa', b.mahasiswa_id) || {}, pr = m.find('prodi', mh.prodi_id) || {}, pe = m.find('periode', b.periode_id) || {};
                return { id: b.id, mhs: (mh.nim || '-') + ' - ' + (mh.nama || '-'), periode: pe.nama || '-', jenis: b.jenis, akademik: mh.status || '-', status: b.status,
                    prodi: ui.prodi(pr), periode_id: b.periode_id, prodi_id: mh.prodi_id };
            }).filter(function(r) {
                if (st.periode && r.periode_id != st.periode) { return false; }
                if (st.prodi && r.prodi_id != st.prodi) { return false; }
                if (st.status && r.status !== st.status) { return false; }
                return !q || [r.mhs, r.periode, r.jenis, r.akademik, r.status, r.prodi].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return a.mhs.localeCompare(b.mhs); });
        }
    },

    view: {
        cols: [
            { t: 'Mahasiswa', k: 'mhs' },
            { t: 'Periode', k: 'periode' },
            { t: 'Jenis Pengajuan', k: 'jenis' },
            { t: 'Status Akademik', k: 'akademik' },
            { t: 'Status', v: function(r) { return ui.badge(r.status, bstudi.model.WARNA[r.status] || '#777'); } }
        ]
    },

    controller: {
        bstudi: function() {
            var m = bstudi.model, ds = m.data(), st = bstudi.st;
            if (!st.periode) { st.periode = m.aktif(); }
            d.gebi('content').innerHTML = ui.listPage(ui.head('Berhenti Studi', 'Monitoring Mahasiswa'),
                ui.sel('bstudi.controller.filter', 'periode', ui.opt(ds.periode.data.slice().reverse(), st.periode, function(p) { return p.nama; })) +
                ui.sel('bstudi.controller.filter', 'prodi', ui.opt(ds.prodi.data, st.prodi, ui.prodi, '-- Semua Program Studi --')) +
                ui.sel('bstudi.controller.filter', 'status', ui.opt(m.STATUS, st.status, function(s) { return s.nama; }, 'Semua', '')) +
                ui.search('bstudi.controller.kset', st.l, 'Cari Berhenti Studi'));
            bstudi.controller.draw();
        },

        // d.url(modul) memanggil view() setelah simpan/hapus
        view: function() { bstudi.controller.bstudi(); },

        // filter periode / prodi (angka) dan status (teks); halaman dibangun ulang agar pilihan terpilih ikut
        filter: function(k, v) {
            var st = bstudi.st; st[k] = (k === 'status') ? v : Number(v); st.l.page = 1;
            bstudi.controller.bstudi();
        },
        kset: function(k, v) { ui.query(bstudi.st.l, k, v); bstudi.controller.draw(); },
        go: function(n) { bstudi.st.l.page = n; bstudi.controller.draw(); },
        draw: function() { ui.list({ rows: bstudi.model.rows(), l: bstudi.st.l, cols: bstudi.view.cols, click: 'bstudi.controller.edit', go: 'bstudi.controller.go' }); },

        // klik baris -> drawer: ringkasan; "Edit" menampilkan form DonatJS
        edit: function(id, mode) {
            var m = bstudi.model, b = m.find('berhenti', id); if (!b) { return; }
            var mh = m.find('mahasiswa', b.mahasiswa_id) || {}, pr = m.find('prodi', mh.prodi_id) || {}, pe = m.find('periode', b.periode_id) || {}, e = ui.esc;
            ui.drawer({
                judul: (mh.nim || '-') + ' - ' + (mh.nama || '-'), tb: 'berhenti', modul: 'bstudi', row: b, mode: mode,
                back: 'bstudi.controller.edit(' + b.id + ')', edit: 'bstudi.controller.edit(' + b.id + ", 'form')", hapus: 'bstudi.controller.hapus(' + b.id + ')',
                ringkas: ui.detail([
                    ['Mahasiswa', e((mh.nim || '-') + ' - ' + (mh.nama || '-'))],
                    ['Program Studi', e(ui.prodi(pr) || '-')],
                    ['Angkatan', e(mh.angkatan || '-')],
                    ['Periode', e(pe.nama || '-')],
                    ['Jenis Pengajuan', e(b.jenis)],
                    ['Status Akademik', e(mh.status || '-')],
                    ['Status', ui.badge(b.status, m.WARNA[b.status] || '#777')],
                    ['Keterangan', b.keterangan ? e(b.keterangan) : '<span class="redup">-</span>']
                ])
            });
        },
        hapus: function(id) {
            var m = bstudi.model, b = m.find('berhenti', id); if (!b) { return; }
            var mh = m.find('mahasiswa', b.mahasiswa_id) || {};
            ui.hapusRow('berhenti', id, 'Hapus Pengajuan', 'Yakin menghapus pengajuan berhenti studi <b>' + ui.esc(mh.nama || '-') + '</b>? Tindakan ini tidak dapat dibatalkan.', bstudi.controller.bstudi);
        }
    }
};
