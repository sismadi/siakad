/* Daftar Tugas Akhir (meniru SEVIMA /siakad/list_ta, peran Dosen).
   Data dari dataset.js (tugasakhir, mahasiswa, prodi, periode, dosen). Pola sama dengan Berhenti Studi (bstudi.js): filter program studi, periode mulai, periode masuk, kelengkapan, status, tahap; tabel kolom inti; detail di drawer (ringkasan, Edit -> form, Delete).
   Program Studi dan Periode Masuk (angkatan) dibaca dari tabel mahasiswa. Filter Kelengkapan = satu pilihan (SEVIMA: pilihan ganda). Tanggal memakai kuliah.model.tgl (kuliah.js).
   Komponen daftar, drawer, badge, paging, konfirmasi: lihat ui di app.js. Nama modul "takhir" karena "ta" dan "tugasakhir" dapat bentrok dengan nama tabel. */
var takhir = {
    // filter: prodi, periode (id, 0 = semua); masuk, lengkap, status, tahap (teks, '' = semua); l = {q, rpp, page}
    st: { prodi: 0, periode: 0, masuk: '', lengkap: '', status: 'aktif', tahap: '', l: { q: '', rpp: 10, page: 1 } },

    model: {
        DOSEN: 1,   // dosen yang sedang masuk (sama seperti mhspa.js dan pta.js)
        STATUS: [{ id: 'aktif', nama: 'Aktif' }, { id: 'selesai', nama: 'Selesai' }, { id: 'tidak aktif', nama: 'Tidak Aktif' }],
        TAHAP: ['Pengajuan Proposal', 'Seminar Proposal', 'Penelitian', 'Sidang Akhir'].map(function(t) { return { id: t }; }),
        LENGKAP: [{ id: 'tanpa_pembimbing', nama: 'Belum ada pembimbing' }, { id: 'tanpa_penguji', nama: 'Belum ada penguji' }, { id: 'tanpa_jadwal', nama: 'Belum ada jadwal' },
            { id: 'nilai_kosong', nama: 'Nilai belum terisi' }, { id: 'nilai_belum_dikunci', nama: 'Nilai belum dikunci' }],
        WARNA: { 'aktif': '#2b9fc9', 'selesai': '#2e7d32', 'tidak aktif': '#8a8f98' },
        data: function() { d.service.init(); return dataset; },
        find: function(tb, id) { return takhir.model.data()[tb].data.find(function(x) { return x.id == id; }); },
        // angkatan unik, terbaru di atas (Periode Masuk)
        masuk: function() {
            var a = [];
            takhir.model.data().mahasiswa.data.forEach(function(x) { if (a.indexOf(String(x.angkatan)) < 0) { a.push(String(x.angkatan)); } });
            return a.sort().reverse().map(function(x) { return { id: x }; });
        },
        // nama dosen dari daftar id (0 = belum ada dilewati)
        dosen: function(ids) {
            var m = takhir.model;
            return ids.filter(function(i) { return Number(i) > 0; }).map(function(i) { return (m.find('dosen', i) || {}).nama || '-'; });
        },
        rows: function() {
            var m = takhir.model, st = takhir.st, q = st.l.q.toLowerCase();
            return m.data().tugasakhir.data.filter(function(t) {
                return [t.pembimbing1_id, t.pembimbing2_id, t.penguji1_id, t.penguji2_id].some(function(i) { return i == m.DOSEN; });
            }).map(function(t) {
                var mh = m.find('mahasiswa', t.mahasiswa_id) || {}, pb = m.dosen([t.pembimbing1_id, t.pembimbing2_id]), pg = m.dosen([t.penguji1_id, t.penguji2_id]);
                var kosong = t.nilai === '' || t.nilai == null;
                return { id: t.id, mhs: (mh.nim || '-') + ' - ' + (mh.nama || '-'), judul: t.judul, tahap: t.tahap, nilai: kosong ? '' : String(t.nilai), status: t.status,
                    pembimbing: pb.join(', '), penguji: pg.join(', '), prodi_id: mh.prodi_id, periode_id: t.periode_id, angkatan: String(mh.angkatan || ''),
                    ada: { tanpa_pembimbing: !pb.length, tanpa_penguji: !pg.length, tanpa_jadwal: !t.tgl_sidang, nilai_kosong: kosong, nilai_belum_dikunci: t.nilai_dikunci !== 'ya' } };
            }).filter(function(r) {
                if (st.prodi && r.prodi_id != st.prodi) { return false; }
                if (st.periode && r.periode_id != st.periode) { return false; }
                if (st.masuk && r.angkatan !== st.masuk) { return false; }
                if (st.lengkap && !r.ada[st.lengkap]) { return false; }
                if (st.status && r.status !== st.status) { return false; }
                if (st.tahap && r.tahap !== st.tahap) { return false; }
                return !q || [r.mhs, r.judul, r.pembimbing, r.penguji, r.tahap, r.nilai].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return a.mhs.localeCompare(b.mhs); });
        }
    },

    view: {
        cols: [
            { t: 'Mahasiswa', k: 'mhs' },
            { t: 'Judul Tugas Akhir', k: 'judul' },
            { t: 'Tahap', k: 'tahap' },
            { t: 'Nilai', v: function(r) { return r.nilai ? ui.esc(r.nilai) : '-'; } },
            { t: 'Status', v: function(r) { return ui.badge(r.status, takhir.model.WARNA[r.status] || '#777'); } }
        ]
    },

    controller: {
        takhir: function() {
            var m = takhir.model, ds = m.data(), st = takhir.st, nm = function(x) { return x.nama || x.id; };
            d.gebi('content').innerHTML = ui.listPage(ui.head('Daftar Tugas Akhir', 'Progres TA Mahasiswa'),
                ui.sel('takhir.controller.filter', 'prodi', ui.opt(ds.prodi.data, st.prodi, ui.prodi, '-- Semua Program Studi --')) +
                ui.sel('takhir.controller.filter', 'periode', ui.opt(ds.periode.data.slice().reverse(), st.periode, nm, '-- Pilih Periode --')) +
                ui.sel('takhir.controller.filter', 'masuk', ui.opt(m.masuk(), st.masuk, nm, '-- Semua Periode Masuk --', '')) +
                ui.sel('takhir.controller.filter', 'lengkap', ui.opt(m.LENGKAP, st.lengkap, nm, '-- Semua Kelengkapan --', '')) +
                ui.sel('takhir.controller.filter', 'status', ui.opt(m.STATUS, st.status, nm, '-- Pilih Semua Status --', '')) +
                ui.sel('takhir.controller.filter', 'tahap', ui.opt(m.TAHAP, st.tahap, nm, '-- Pilih Semua Tahap --', '')) +
                ui.search('takhir.controller.kset', st.l, 'Cari Tugas Akhir'));
            takhir.controller.draw();
        },

        // d.url(modul) memanggil view() setelah simpan/hapus
        view: function() { takhir.controller.takhir(); },

        // prodi dan periode angka, selebihnya teks; halaman dibangun ulang agar pilihan terpilih ikut
        filter: function(k, v) {
            var st = takhir.st; st[k] = (k === 'prodi' || k === 'periode') ? Number(v) : v; st.l.page = 1;
            takhir.controller.takhir();
        },
        kset: function(k, v) { ui.query(takhir.st.l, k, v); takhir.controller.draw(); },
        go: function(n) { takhir.st.l.page = n; takhir.controller.draw(); },
        draw: function() { ui.list({ rows: takhir.model.rows(), l: takhir.st.l, cols: takhir.view.cols, click: 'takhir.controller.edit', go: 'takhir.controller.go' }); },

        // klik baris -> drawer: ringkasan; "Edit" menampilkan form DonatJS (tabel tugasakhir)
        edit: function(id, mode) {
            var m = takhir.model, t = m.find('tugasakhir', id); if (!t) { return; }
            var mh = m.find('mahasiswa', t.mahasiswa_id) || {}, pr = m.find('prodi', mh.prodi_id) || {}, pe = m.find('periode', t.periode_id) || {}, e = ui.esc;
            var kosong = '<span class="redup">-</span>', daftar = function(a) { return a.length ? e(a.join(', ')) : kosong; };
            var kunci = t.nilai_dikunci === 'ya';
            ui.drawer({
                judul: (mh.nim || '-') + ' - ' + (mh.nama || '-'), tb: 'tugasakhir', modul: 'takhir', row: t, mode: mode, lanjut: ['nama', 'mahasiswa_id', 'bimbingan_id', 'keterangan'],
                back: 'takhir.controller.edit(' + t.id + ')', edit: 'takhir.controller.edit(' + t.id + ", 'form')", hapus: 'takhir.controller.hapus(' + t.id + ')',
                ringkas: ui.detail([
                    ['Mahasiswa', e((mh.nim || '-') + ' - ' + (mh.nama || '-'))],
                    ['Program Studi', e(ui.prodi(pr) || '-')],
                    ['Periode Masuk', e(mh.angkatan || '-')],
                    ['Periode Mulai', e(pe.nama || '-')],
                    ['Judul Tugas Akhir', e(t.judul)],
                    ['Dosen Pembimbing', daftar(m.dosen([t.pembimbing1_id, t.pembimbing2_id]))],
                    ['Dosen Penguji', daftar(m.dosen([t.penguji1_id, t.penguji2_id]))],
                    ['Tahap', e(t.tahap)],
                    ['Jadwal Sidang', t.tgl_sidang ? e(kuliah.model.tgl(t.tgl_sidang)) : kosong],
                    ['Nilai', (t.nilai === '' || t.nilai == null ? kosong : e(t.nilai)) + ' ' + ui.badge(kunci ? 'Dikunci' : 'Belum dikunci', kunci ? '#2e7d32' : '#d9534f')],
                    ['Status', ui.badge(t.status, m.WARNA[t.status] || '#777')],
                    ['Keterangan', t.keterangan ? e(t.keterangan) : kosong]
                ])
            });
        },
        hapus: function(id) {
            var m = takhir.model, t = m.find('tugasakhir', id); if (!t) { return; }
            var mh = m.find('mahasiswa', t.mahasiswa_id) || {};
            ui.hapusRow('tugasakhir', id, 'Hapus Tugas Akhir', 'Yakin menghapus tugas akhir <b>' + ui.esc(mh.nama || '-') + '</b>? Tindakan ini tidak dapat dibatalkan.', takhir.controller.takhir);
        }
    }
};
