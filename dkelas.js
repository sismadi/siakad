/* Detail Kelas (meniru SEVIMA /siakad/data_kelas/detail/{idkelas}, peran Dosen).
   Menu kiri (Detail Kelas ... Tugas Kuliah) dibaca dari menuData.kelas (menu.data.js) dan digambar komponen bersama ui.subnav (app.js).
   Rute: dkelas/<halaman>/<id kelas>. Nama modul "dkelas" karena "kelas" sudah dipakai tabel dataset (Master).
   Halaman yang belum punya data SEVIMA otomatis memakai halaman keterangan (dkelas.controller.belum).
   Jadwal Perkuliahan memakai halaman kuliah.js (kuliah/jadwal/<id>) yang juga memuat menu kiri yang sama. */
var dkelas = {
    st: { id: 0, tab: 'detail', peserta: { q: '', rpp: 10, page: 1 } },

    model: {
        KRS: { disetujui: '#2e7d32', diajukan: '#f0ad4e', ditolak: '#d9534f' },
        find: function(tb, id) { return kuliah.model.find(tb, id); },
        jadwal: function(k) {
            if (!k.hari) { return []; }
            var p = kuliah.model.sesi(k.id)[0] || {};
            return [{ id: 1, hari: k.hari, jam: k.jam_mulai + ' - ' + k.jam_selesai, jenis: p.jenis || '-', metode: p.metode || '-', ruang: kuliah.model.ruang(k.ruangan_id), frekuensi: k.frekuensi || '-' }];
        },
        pengajaran: function(dosenId) {
            var m = kuliah.model;
            return m.data().kelas.data.filter(function(k) { return k.dosen_id == dosenId; }).map(function(k) {
                var mk = m.find('matakuliah', k.matakuliah_id) || {};
                return { id: k.id, kode: mk.kode || '-', mk: mk.nama || '-', sks: mk.sks || 0, kelas: k.kode, jadwal: k.hari ? k.hari + ', ' + k.jam_mulai + ' - ' + k.jam_selesai : '-' };
            });
        },
        peserta: function(id) {
            var ds = kuliah.model.data(), q = dkelas.st.peserta.q.toLowerCase(), out = [];
            ds.krs.data.forEach(function(r) {
                var m = r.kelas_id == id ? ds.mahasiswa.data.find(function(x) { return x.id == r.mahasiswa_id; }) : null;
                if (m) { out.push({ id: m.id, nim: m.nim, nama: m.nama, program: m.program, krs: r.status }); }
            });
            return out.filter(function(r) { return !q || [r.nim, r.nama, r.program, r.krs].join(' ').toLowerCase().indexOf(q) >= 0; })
                .sort(function(a, b) { return a.nim.localeCompare(b.nim); });
        },
        // rekap presensi per sesi (hitungan memakai absen.model.rekap)
        presensi: function(id) {
            var m = kuliah.model;
            return m.sesi(id).map(function(p) {
                var r = window.absen ? absen.model.rekap({ kelas_id: p.kelas_id, ke: p.ke }) : { total: 0, kosong: 0, persen: 0 };
                return { id: p.id, ke: p.ke, tanggal: m.namaHari(p.tanggal) + ', ' + m.tgl(p.tanggal), terisi: (r.total - r.kosong) + ' / ' + r.total, hadir: r.persen + '%', dosen: p.presensi_dosen };
            });
        }
    },

    view: {
        jadwalCols: [
            { t: 'Hari', k: 'hari' }, { t: 'Jam', k: 'jam' }, { t: 'Jenis Pertemuan', k: 'jenis' },
            { t: 'Metode Pembelajaran', k: 'metode' }, { t: 'Ruang', k: 'ruang' }, { t: 'Frekuensi', k: 'frekuensi' }
        ],
        pengajaranCols: [
            { t: 'Kode', k: 'kode' }, { t: 'Mata Kuliah', k: 'mk' }, { t: 'SKS', k: 'sks' }, { t: 'Kelas', k: 'kelas' }, { t: 'Jadwal', k: 'jadwal' }
        ],
        pesertaCols: [
            { t: 'NIM', k: 'nim' }, { t: 'Nama', k: 'nama' }, { t: 'Program', k: 'program' },
            { t: 'KRS', v: function(r) { return ui.badge(r.krs, dkelas.model.KRS[r.krs] || '#777'); } }
        ],
        presensiCols: [
            { t: 'Sesi', k: 'ke' }, { t: 'Tanggal', k: 'tanggal', s: 'white-space:nowrap' }, { t: 'Terisi', k: 'terisi' }, { t: 'Hadir', k: 'hadir' },
            { t: 'Presensi Dosen', v: function(r) { return ui.badge(r.dosen ? 'Sudah' : 'Belum', r.dosen ? '#2e7d32' : '#d9534f'); } }
        ],
        // menu kiri: dari menuData.kelas; aktif = nama fungsi rute halaman yang sedang dibuka
        nav: function(id, aktif) {
            return ui.subnav(menuData.kelas.map(function(n) {
                return { t: n.nama, go: n.rute + '/' + id, on: n.rute.split('/')[1] === aktif, dim: n.status !== 'tersedia' };
            }));
        },
        // kerangka halaman: judul + menu kiri + isi
        page: function(k, aktif, judul, body) {
            return ui.panel(ui.head(judul, kuliah.model.judulKelas(k)), body, dkelas.view.nav(k.id, aktif));
        }
    },

    // dipanggil di awal tiap halaman: set state & modul (d.url(modul) memanggil view() setelah simpan/hapus); null = kelas tidak ada
    enter: function(id, tab) {
        var k = kuliah.model.find('kelas', id), st = dkelas.st; modul = 'dkelas';
        if (!k) { d.gebi('content').innerHTML = '<p>Kelas tidak ditemukan.</p>'; return null; }
        if (st.id != k.id) { st.peserta.q = ''; st.peserta.page = 1; }
        st.id = k.id; st.tab = tab;
        return k;
    },

    controller: {
        view: function() { dkelas.controller[dkelas.st.tab || 'detail'](dkelas.st.id); },

        detail: function(id) {
            var k = dkelas.enter(id, 'detail'); if (!k) { return; }
            var m = kuliah.model, e = ui.esc, mk = m.find('matakuliah', k.matakuliah_id) || {}, pr = m.find('prodi', mk.prodi_id) || {};
            var pe = m.find('periode', k.periode_id) || {}, dos = m.find('dosen', k.dosen_id) || {};
            var aksi = '<div class="aksi-bar">' +
                ui.btn('Kembali ke Daftar', 'prev', "navigate('kuliah/kuliah/1')", true) +
                ui.btn('Edit', 'pen', 'dkelas.controller.edit(' + k.id + ')', true) +
                ui.btn('Hapus', 'trush', 'dkelas.controller.hapus(' + k.id + ')', true) + '</div>';
            var body = aksi + ui.detail([
                ['Periode Akademik', e(pe.nama || '-')],
                ['Program Studi', e(ui.prodi(pr) || '-')],
                ['Tahun Kurikulum', e(k.kurikulum || '-')],
                ['Mata Kuliah', e((mk.kode || '-') + ' - ' + (mk.nama || '-') + ' (' + Number(mk.sks || 0) + ' SKS' + (mk.semester ? ' - SEMESTER ' + mk.semester : '') + ')')],
                ['Nama Kelas', e(k.kode)],
                ['Sistem Kuliah', e(k.sistem_kuliah || '-')],
                ['Kelas Mahasiswa', '-'],
                ['Kapasitas', e(k.kapasitas)],
                ['Tgl. Mulai', e(m.tglLengkap(k.tgl_mulai) || '-')],
                ['Tgl. Selesai', e(m.tglLengkap(k.tgl_selesai) || '-')],
                ['Jumlah Pertemuan', e(k.jumlah_pertemuan || '-')],
                ['Kampus Berdampak?', k.kampus_berdampak ? (k.kampus_berdampak === 'ya' ? 'Ya' : 'Tidak') : '-'],
                ['Jenis Kelas', mk.metode ? ui.badge(mk.metode, '#2b9fc9') : '-']
            ]) +
                '<h3>Dosen Pengajar</h3>' + ui.detail([
                    ['Metode Pengajaran', e(k.metode_pengajaran || '-')],
                    ['Dosen Pengajar', e((dos.nidn || '-') + ' - ' + (dos.nama || '-'))]
                ]) +
                '<h3>Jadwal Mingguan</h3><div class="gTable">' + ui.table(dkelas.view.jadwalCols, dkelas.model.jadwal(k)) + '</div>';
            d.gebi('content').innerHTML = dkelas.view.page(k, 'detail', 'Detail Kelas', body);
            ui.gambar();
        },

        // Edit = form DonatJS langsung (kolom teknis di "Lanjutan"); simpan -> view() kembali ke halaman ini
        edit: function(id) {
            var k = kuliah.model.find('kelas', id); if (!k) { return; }
            ui.drawer({ judul: 'Edit Kelas ' + k.kode, tb: 'kelas', modul: 'dkelas', row: k, mode: 'form', lanjut: kuliah.model.LANJUT_KELAS,
                kembali: 'Tutup', back: 'd.closePanel()', hapus: 'dkelas.controller.hapus(' + k.id + ')' });
        },
        hapus: function(id) {
            var k = kuliah.model.find('kelas', id); if (!k) { return; }
            ui.hapusRow('kelas', id, 'Hapus Kelas', 'Yakin menghapus kelas <b>' + ui.esc(k.kode) + '</b>? Tindakan ini tidak dapat dibatalkan.', function() { navigate('kuliah/kuliah/1'); });
        },

        pengajar: function(id) {
            var k = dkelas.enter(id, 'pengajar'); if (!k) { return; }
            var m = kuliah.model, e = ui.esc, dos = m.find('dosen', k.dosen_id) || {}, pr = m.find('prodi', dos.prodi_id) || {};
            var rows = dkelas.model.pengajaran(dos.id), sks = rows.reduce(function(a, r) { return a + Number(r.sks); }, 0);
            var body = ui.detail([
                ['Metode Pengajaran', e(k.metode_pengajaran || '-')],
                ['Dosen Pengajar', e((dos.nidn || '-') + ' - ' + (dos.nama || '-')) + (k.pjmk === 'ya' ? ' ' + ui.badge('PJMK', '#777') : '')],
                ['Program Studi', e(ui.prodi(pr) || '-')],
                ['Jabatan', e(dos.jabatan || '-')],
                ['Email', e(dos.email || '-')],
                ['Telepon', e(dos.telepon || '-')],
                ['Status', ui.badge(dos.status || '-', dos.status === 'aktif' ? '#2e7d32' : '#777')]
            ]) + '<h3>Pengajaran Dosen (' + e(sks) + ' SKS)</h3><div class="gTable">' + ui.table(dkelas.view.pengajaranCols, rows) + '</div>';
            d.gebi('content').innerHTML = dkelas.view.page(k, 'pengajar', 'Dosen Pengajar', body);
        },

        peserta: function(id) {
            var k = dkelas.enter(id, 'peserta'); if (!k) { return; }
            d.gebi('content').innerHTML = ui.listPage(ui.head('Peserta Kelas', kuliah.model.judulKelas(k)),
                ui.search('dkelas.controller.pset', dkelas.st.peserta, 'Cari Peserta Kelas'), dkelas.view.nav(k.id, 'peserta'));
            dkelas.controller.drawPeserta();
        },
        pset: function(k, v) { ui.query(dkelas.st.peserta, k, v); dkelas.controller.drawPeserta(); },
        pgo: function(n) { dkelas.st.peserta.page = n; dkelas.controller.drawPeserta(); },
        drawPeserta: function() {
            ui.list({ rows: dkelas.model.peserta(dkelas.st.id), l: dkelas.st.peserta, cols: dkelas.view.pesertaCols, click: 'dkelas.controller.mhs', go: 'dkelas.controller.pgo' });
        },
        // klik peserta -> drawer ringkasan mahasiswa (Edit = form tabel mahasiswa)
        mhs: function(id, mode) {
            var m = kuliah.model.find('mahasiswa', id); if (!m) { return; }
            var pr = kuliah.model.find('prodi', m.prodi_id) || {}, pa = kuliah.model.find('dosen', m.dosen_pa_id) || {}, e = ui.esc;
            ui.drawer({ judul: m.nim + ' - ' + m.nama, tb: 'mahasiswa', modul: 'dkelas', row: m, mode: mode,
                back: 'dkelas.controller.mhs(' + m.id + ')', edit: 'dkelas.controller.mhs(' + m.id + ", 'form')",
                ringkas: ui.detail([
                    ['NIM', e(m.nim)], ['Nama', e(m.nama)], ['Angkatan', e(m.angkatan)], ['Program Studi', e(ui.prodi(pr) || '-')],
                    ['Program', e(m.program)], ['Status', e(m.status)], ['Dosen PA', e(pa.nama || '-')], ['Email', e(m.email)], ['Telepon', e(m.telepon)]
                ]) });
        },

        // rekap presensi per sesi; klik baris -> halaman Presensi (absen.js) untuk sesi tersebut
        presensi: function(id) {
            var k = dkelas.enter(id, 'presensi'); if (!k) { return; }
            var body = '<div id="table" class="gTable">' + ui.table(dkelas.view.presensiCols, dkelas.model.presensi(k.id), 'dkelas.controller.bukaPresensi') + '</div>';
            d.gebi('content').innerHTML = dkelas.view.page(k, 'presensi', 'Presensi Kelas', body);
        },
        bukaPresensi: function(pid) {
            var p = kuliah.model.find('pertemuan', pid); if (p) { kuliah.controller.presensi(p.kelas_id, p.ke); }
        },

        // halaman keterangan untuk menu SEVIMA yang isinya belum dimasukkan
        belum: function(id, tab) {
            var k = dkelas.enter(id, tab); if (!k) { return; }
            var n = menuData.kelas.find(function(x) { return x.rute.split('/')[1] === tab; }) || { nama: 'Halaman', url: '' }, e = ui.esc;
            d.gebi('content').innerHTML = dkelas.view.page(k, tab, n.nama,
                '<h3>' + e(n.nama) + '</h3>' +
                '<p>Menu ini sudah tersedia di SIM Akademik SEVIMA (<code>/siakad/' + e(n.url) + '/' + e(k.idkelas) + '</code>), tetapi isi halamannya belum dimasukkan ke aplikasi ini.</p>' +
                '<p>Kirim HTML halaman tersebut agar kontennya diisi sesuai data SEVIMA.</p>');
        }
    }
};

// menu kiri yang belum punya halaman sendiri: rute dkelas/<nama>/<id> otomatis ke halaman keterangan
menuData.kelas.forEach(function(n) {
    var f = n.rute.split('/');
    if (f[0] === 'dkelas' && !dkelas.controller[f[1]]) { dkelas.controller[f[1]] = function(id) { dkelas.controller.belum(id, f[1]); }; }
});
