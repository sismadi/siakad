/* Proposal Tugas Akhir - Daftar Pengajuan TA Mahasiswa Bimbingan (meniru SEVIMA /siakad/list_pengajuanta, peran Dosen).
   Data dari dataset.js (bimbingan, mahasiswa, prodi, dosen). Pola sama dengan Berhenti Studi (bstudi.js): filter jenis TA, status, program studi, angkatan; tabel kolom inti; detail di drawer (ringkasan, Edit -> form, Delete).
   Status "Aktif" di SEVIMA = bimbingan.status 'diajukan'. Program Studi dan Angkatan dibaca dari tabel mahasiswa. Tanggal memakai kuliah.model.tgl (kuliah.js).
   Komponen daftar, drawer, badge, paging, konfirmasi: lihat ui di app.js. Nama modul "pta" karena "bimbingan" sudah dipakai tabel dataset. */
var pta = {
    // filter: jenis, status ('aktif' | disetujui | revisi | ditolak), prodi (id), angkatan (teks, '' = semua); l = {q, rpp, page}
    st: { jenis: 'Tugas Akhir', status: 'aktif', prodi: 0, angkatan: '', l: { q: '', rpp: 10, page: 1 } },

    model: {
        DOSEN: 1,   // dosen yang sedang masuk (sama seperti kuliah.js)
        JENIS: ['Tugas Akhir', 'Skripsi', 'Tesis'].map(function(j) { return { id: j }; }),
        STATUS: [{ id: 'aktif', nama: 'Aktif' }, { id: 'disetujui', nama: 'Disetujui' }, { id: 'revisi', nama: 'Revisi' }, { id: 'ditolak', nama: 'Ditolak' }],
        WARNA: { aktif: '#2b9fc9', disetujui: '#2e7d32', revisi: '#f0ad4e', ditolak: '#d9534f' },
        data: function() { d.service.init(); return dataset; },
        find: function(tb, id) { return pta.model.data()[tb].data.find(function(x) { return x.id == id; }); },
        // status data -> status tampil ('diajukan' = Aktif)
        status: function(v) { return v === 'diajukan' ? 'aktif' : v; },
        // angkatan unik, terbaru di atas
        angkatan: function() {
            var a = [];
            pta.model.data().mahasiswa.data.forEach(function(x) { if (a.indexOf(String(x.angkatan)) < 0) { a.push(String(x.angkatan)); } });
            return a.sort().reverse().map(function(x) { return { id: x }; });
        },
        rows: function() {
            var m = pta.model, st = pta.st, q = st.l.q.toLowerCase();
            return m.data().bimbingan.data.filter(function(b) { return b.dosen_id == m.DOSEN; }).map(function(b) {
                var mh = m.find('mahasiswa', b.mahasiswa_id) || {}, dos = m.find('dosen', b.dosen_id) || {};
                return { id: b.id, mhs: (mh.nim || '-') + ' - ' + (mh.nama || '-'), judul: b.judul, topik: b.topik || '', pembimbing: dos.nama || '', tgl: b.tanggal,
                    status: m.status(b.status), jenis: b.jenis_ta, prodi_id: mh.prodi_id, angkatan: String(mh.angkatan || '') };
            }).filter(function(r) {
                if (st.jenis && r.jenis !== st.jenis) { return false; }
                if (st.status && r.status !== st.status) { return false; }
                if (st.prodi && r.prodi_id != st.prodi) { return false; }
                if (st.angkatan && r.angkatan !== st.angkatan) { return false; }
                return !q || [r.mhs, r.judul, r.topik, r.pembimbing].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return String(b.tgl).localeCompare(String(a.tgl)); });
        }
    },

    view: {
        cols: [
            { t: 'Mahasiswa', k: 'mhs' },
            { t: 'Judul Tugas Akhir', k: 'judul' },
            { t: 'Tgl. Pengajuan', s: 'white-space:nowrap', v: function(r) { return ui.esc(kuliah.model.tgl(r.tgl)); } },
            { t: 'Status', v: function(r) { return ui.badge(r.status, pta.model.WARNA[r.status] || '#777'); } }
        ]
    },

    controller: {
        pta: function() {
            var m = pta.model, ds = m.data(), st = pta.st, nm = function(x) { return x.nama || x.id; };
            d.gebi('content').innerHTML = ui.listPage(ui.head('Proposal Tugas Akhir', 'Pengajuan TA Mahasiswa'),
                ui.sel('pta.controller.filter', 'jenis', ui.opt(m.JENIS, st.jenis, nm)) +
                ui.sel('pta.controller.filter', 'status', ui.opt(m.STATUS, st.status, nm)) +
                ui.sel('pta.controller.filter', 'prodi', ui.opt(ds.prodi.data, st.prodi, ui.prodi, '-- Semua Program Studi --')) +
                ui.sel('pta.controller.filter', 'angkatan', ui.opt(m.angkatan(), st.angkatan, nm, '-- Semua Angkatan --', '')) +
                ui.search('pta.controller.kset', st.l, 'Cari Proposal Tugas Akhir'));
            pta.controller.draw();
        },

        // d.url(modul) memanggil view() setelah simpan/hapus
        view: function() { pta.controller.pta(); },

        // prodi angka, selebihnya teks; halaman dibangun ulang agar pilihan terpilih ikut
        filter: function(k, v) {
            var st = pta.st; st[k] = (k === 'prodi') ? Number(v) : v; st.l.page = 1;
            pta.controller.pta();
        },
        kset: function(k, v) { ui.query(pta.st.l, k, v); pta.controller.draw(); },
        go: function(n) { pta.st.l.page = n; pta.controller.draw(); },
        draw: function() { ui.list({ rows: pta.model.rows(), l: pta.st.l, cols: pta.view.cols, click: 'pta.controller.edit', go: 'pta.controller.go' }); },

        // klik baris -> drawer: ringkasan; "Edit" menampilkan form DonatJS (tabel bimbingan)
        edit: function(id, mode) {
            var m = pta.model, b = m.find('bimbingan', id); if (!b) { return; }
            var mh = m.find('mahasiswa', b.mahasiswa_id) || {}, pr = m.find('prodi', mh.prodi_id) || {}, dos = m.find('dosen', b.dosen_id) || {}, e = ui.esc, sv = m.status(b.status);
            ui.drawer({
                judul: (mh.nim || '-') + ' - ' + (mh.nama || '-'), tb: 'bimbingan', modul: 'pta', row: b, mode: mode, lanjut: ['nama', 'mahasiswa_id', 'dosen_id', 'keterangan'],
                back: 'pta.controller.edit(' + b.id + ')', edit: 'pta.controller.edit(' + b.id + ", 'form')", hapus: 'pta.controller.hapus(' + b.id + ')',
                ringkas: ui.detail([
                    ['Mahasiswa', e((mh.nim || '-') + ' - ' + (mh.nama || '-'))],
                    ['Program Studi', e(ui.prodi(pr) || '-')],
                    ['Angkatan', e(mh.angkatan || '-')],
                    ['Judul Tugas Akhir', e(b.judul)],
                    ['Topik', b.topik ? e(b.topik) : '<span class="redup">-</span>'],
                    ['Pembimbing', e(dos.nama || '-')],
                    ['Jenis TA', e(b.jenis_ta || '-') + (b.tahap ? ' &middot; ' + e(b.tahap) : '')],
                    ['Tgl. Pengajuan', e(kuliah.model.tgl(b.tanggal))],
                    ['Status', ui.badge(sv, m.WARNA[sv] || '#777')],
                    ['Keterangan', b.keterangan ? e(b.keterangan) : '<span class="redup">-</span>']
                ])
            });
        },
        hapus: function(id) {
            var m = pta.model, b = m.find('bimbingan', id); if (!b) { return; }
            var mh = m.find('mahasiswa', b.mahasiswa_id) || {};
            ui.hapusRow('bimbingan', id, 'Hapus Proposal', 'Yakin menghapus proposal tugas akhir <b>' + ui.esc(mh.nama || '-') + '</b>? Tindakan ini tidak dapat dibatalkan.', pta.controller.pta);
        }
    }
};
