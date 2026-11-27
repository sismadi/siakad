/* Jadwal Minggu Ini (meniru SEVIMA /siakad/list_jadwalajar, peran Dosen).
   Data dari dataset.js (pertemuan, kelas, matakuliah, ruangan, dosen). Pola: daftar hanya baca per hari Senin-Minggu pada minggu berjalan, detail di panel samping.
   Komponen bersama: lihat ui di app.js; nama hari, format tanggal, dan warna status dari kuliah.model (kuliah.js). */
var jminggu = {
    st: { dosen: 1 },   // dosen yang login (data contoh: 1 = WAWAN SISMADI)

    model: {
        data: function() { d.service.init(); return dataset; },
        // Date -> YYYY-MM-DD waktu setempat (toISOString memakai UTC sehingga tanggal bisa mundur sehari)
        iso: function(t) {
            var dua = function(n) { return (n < 10 ? '0' : '') + n; };
            return t.getFullYear() + '-' + dua(t.getMonth() + 1) + '-' + dua(t.getDate());
        },
        // 7 tanggal Senin-Minggu pada minggu yang memuat "kini"
        minggu: function(kini) {
            var senin = new Date(kini.getFullYear(), kini.getMonth(), kini.getDate() - (kini.getDay() + 6) % 7);
            return [0, 1, 2, 3, 4, 5, 6].map(function(i) {
                return jminggu.model.iso(new Date(senin.getFullYear(), senin.getMonth(), senin.getDate() + i));
            });
        },
        kelas: function(p) {
            var k = kuliah.model.find('kelas', p.kelas_id) || {}, mk = kuliah.model.find('matakuliah', k.matakuliah_id) || {};
            return (mk.kode || '-') + ' - ' + (mk.nama || '-') + ' (' + (k.kode || '-') + ')';
        },
        ruang: function(p) { return p.metode === 'Online' ? 'Online' : kuliah.model.ruang(p.ruangan_id); },
        rows: function(tgl) {
            return jminggu.model.data().pertemuan.data.filter(function(p) {
                return p.tanggal === tgl && p.dosen_id == jminggu.st.dosen;
            }).sort(function(a, b) { return String(a.jam_mulai).localeCompare(String(b.jam_mulai)); });
        }
    },

    view: {
        cols: [
            { t: 'Waktu', s: 'white-space:nowrap', v: function(p) { return ui.esc(p.jam_mulai + ' - ' + p.jam_selesai); } },
            { t: 'Jenis', k: 'jenis' },
            { t: 'Kelas Mata Kuliah', v: function(p) { return ui.esc(jminggu.model.kelas(p)); } },
            { t: 'Ruang', v: function(p) { return ui.esc(jminggu.model.ruang(p)); } },
            { t: 'Status', v: function(p) { return ui.badge(p.status, kuliah.model.WARNA[p.status] || '#777'); } }
        ],
        // menu samping pegawai; butir tanpa halaman diredupkan
        nav: function() {
            var belum = 'jminggu/belum/1';
            return ui.subnav([
                { t: 'Detail Pegawai', go: belum, dim: true },
                { t: 'Jadwal Minggu Ini', go: 'jminggu/jminggu/1', on: true },
                { t: 'Jadwal Mengajar', go: belum, dim: true },
                { t: 'Jadwal Perkuliahan', go: 'kuliah/jadwal/0' },
                { t: 'Ujian Tugas Akhir', go: belum, dim: true }
            ]);
        },
        hari: function(tgl) {
            var rows = jminggu.model.rows(tgl);
            return '<h3>' + kuliah.model.namaHari(tgl) + ', ' + kuliah.model.tglLengkap(tgl) + '</h3>' +
                (rows.length ? '<div class="gTable">' + ui.table(jminggu.view.cols, rows, 'jminggu.controller.detail') + '</div>'
                    : '<p class="redup">Tidak ada jadwal mengajar pada hari ini</p>');
        }
    },

    controller: {
        jminggu: function() {
            var m = jminggu.model, minggu = m.minggu(new Date()); modul = 'jminggu';
            d.gebi('content').innerHTML = ui.panel(
                ui.head('Jadwal Minggu Ini', kuliah.model.tglLengkap(minggu[0]) + ' - ' + kuliah.model.tglLengkap(minggu[6])),
                minggu.map(jminggu.view.hari).join(''),
                jminggu.view.nav());
            ui.gambar();
        },
        view: function() { jminggu.controller.jminggu(); },
        belum: function() { jminggu.controller.jminggu(); d.info('Halaman belum tersedia'); },
        detail: function(id) {
            var p = kuliah.model.find('pertemuan', id); if (!p) { return; }
            var m = jminggu.model, e = ui.esc, dos = kuliah.model.find('dosen', p.dosen_id) || {};
            var url = /^https?:\/\//.test(p.url_online || '')
                ? '<a href="' + e(p.url_online) + '" target="_blank" rel="noopener">' + e(p.url_online) + '</a>' : '';
            ui.pick(p.id);
            d.sidePanel('Detail Perkuliahan',
                (p.status === 'dimulai' ? '<div class="aksi-bar">' + ui.btn('QR-Code Presensi', 'check', '', false) + '</div>' : '') +
                ui.detail([
                    ['Kelas', e(m.kelas(p))],
                    ['Jadwal', e(kuliah.model.namaHari(p.tanggal) + ', ' + kuliah.model.tglLengkap(p.tanggal) + ' ' + p.jam_mulai + ' - ' + p.jam_selesai)],
                    ['Sesi', e(p.ke) + ' &middot; ' + e(p.jenis) + ' &middot; ' + e(p.metode)],
                    ['Ruang', e(m.ruang(p)) + (url ? '<br>' + url : '')],
                    ['Status', ui.badge(p.status, kuliah.model.WARNA[p.status] || '#777')],
                    ['Dosen', e(dos.nama || '-')],
                    ['Materi', e(p.materi || '-')]
                ]));
            ui.gambar();
        }
    }
};
