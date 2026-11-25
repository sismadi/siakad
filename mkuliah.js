/* Mata Kuliah - Daftar Mata Kuliah Dosen (meniru SEVIMA /siakad/list_matakuliah, peran Dosen).
   Data dari dataset.js (matakuliah, prodi). Pola sama dengan Kelas Kuliah (kuliah.js): tabel kolom inti, detail di drawer.
   Komponen daftar, drawer, badge, paging, konfirmasi: lihat ui di app.js. */
var mkuliah = {
    // list = state tabel ({q, rpp, page})
    st: { prodi: 0, jenis: '', list: { q: '', rpp: 10, page: 1 } },

    model: {
        KURIKULUM: 2022,
        // Jenis MK menurut SEVIMA; selain yang tercantum = Kuliah
        JENIS: { IMP406: 'Proposal Skripsi', IMU708: 'Skripsi' },
        JENIS_LIST: ['Kuliah', 'Proposal Skripsi', 'Skripsi'].map(function(j) { return { id: j }; }),
        data: function() { d.service.init(); return dataset; },
        find: function(id) { return mkuliah.model.data().matakuliah.data.find(function(x) { return x.id == id; }); },
        row: function(m) {
            var pr = mkuliah.model.data().prodi.data.find(function(p) { return p.id == m.prodi_id; }) || {};
            return { id: m.id, kur: mkuliah.model.KURIKULUM, kode: m.kode, nama: m.nama, sks: m.sks, jenis: mkuliah.model.JENIS[m.kode] || 'Kuliah',
                prodi: ui.prodi(pr), prodi_id: m.prodi_id };
        },
        rows: function() {
            var st = mkuliah.st, q = st.list.q.toLowerCase();
            return mkuliah.model.data().matakuliah.data.map(mkuliah.model.row).filter(function(r) {
                if (st.prodi && r.prodi_id != st.prodi) { return false; }
                if (st.jenis && r.jenis !== st.jenis) { return false; }
                return !q || [r.kode, r.nama, r.jenis, r.prodi].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return a.kode.localeCompare(b.kode); });
        }
    },

    // definisi kolom tabel (untuk ui.table)
    view: {
        cols: [
            { t: 'Kode MK', k: 'kode' },
            { t: 'Nama Mata Kuliah', k: 'nama' },
            { t: 'SKS', k: 'sks' },
            { t: 'Jenis MK', k: 'jenis' }
        ]
    },

    controller: {
        mkuliah: function() {
            var ds = mkuliah.model.data(), st = mkuliah.st;
            d.gebi('content').innerHTML = ui.listPage(ui.head('Mata Kuliah', 'Daftar Mata Kuliah Dosen'),
                ui.sel('mkuliah.controller.filter', 'prodi', ui.opt(ds.prodi.data, st.prodi, ui.prodi, '-- Semua Program Studi --')) +
                ui.sel('mkuliah.controller.filter', 'jenis', ui.opt(mkuliah.model.JENIS_LIST, st.jenis, function(j) { return j.id; }, '-- Semua Jenis MK --', '')) +
                ui.search('mkuliah.controller.kset', st.list, 'Cari Mata Kuliah'));
            mkuliah.controller.draw();
        },

        // d.url(modul) memanggil view() setelah simpan/hapus
        view: function() { mkuliah.controller.mkuliah(); },

        filter: function(k, v) { mkuliah.st[k] = (k === 'prodi') ? Number(v) : v; mkuliah.st.list.page = 1; mkuliah.controller.draw(); },
        kset: function(k, v) { ui.query(mkuliah.st.list, k, v); mkuliah.controller.draw(); },
        go: function(n) { mkuliah.st.list.page = n; mkuliah.controller.draw(); },
        draw: function() { ui.list({ rows: mkuliah.model.rows(), l: mkuliah.st.list, cols: mkuliah.view.cols, click: 'mkuliah.controller.edit', go: 'mkuliah.controller.go' }); },

        // klik baris -> drawer ringkasan; "Edit" menampilkan form DonatJS (tabel matakuliah)
        edit: function(id, mode) {
            var m = mkuliah.model.find(id); if (!m) { return; }
            var r = mkuliah.model.row(m), e = ui.esc, belum = ui.badge('Belum Terisi', '#8a8f98');
            ui.drawer({
                judul: m.kode + ' - ' + m.nama, tb: 'matakuliah', modul: 'mkuliah', row: m, mode: mode,
                back: 'mkuliah.controller.edit(' + m.id + ')', edit: 'mkuliah.controller.edit(' + m.id + ", 'form')", hapus: 'mkuliah.controller.hapus(' + m.id + ')',
                ringkas: ui.detail([
                    ['Mata Kuliah', e(m.kode + ' - ' + m.nama) + (m.metode ? ' ' + ui.badge(m.metode, '#2b9fc9') : '')],
                    ['SKS', e(Number(m.sks || 0).toFixed(2)) + (m.semester ? ' &middot; Smt ' + e(m.semester) : '')],
                    ['Jenis MK', e(r.jenis) + (m.jenis ? ' &middot; ' + e(m.jenis) : '')],
                    ['Kurikulum', e(r.kur)],
                    ['Prodi Pengampu', e(r.prodi)],
                    ['RPS', belum], ['CPL', belum], ['CPMK', belum]
                ])
            });
        },
        hapus: function(id) {
            var m = mkuliah.model.find(id); if (!m) { return; }
            ui.hapusRow('matakuliah', id, 'Hapus Mata Kuliah', 'Yakin menghapus mata kuliah <b>' + ui.esc(m.kode) + '</b>? Tindakan ini tidak dapat dibatalkan.', mkuliah.controller.mkuliah);
        }
    }
};
