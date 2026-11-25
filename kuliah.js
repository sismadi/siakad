/* Kelas Kuliah - Daftar Kelas & Jadwal Perkuliahan (meniru SEVIMA /siakad/list_kelas, peran Dosen).
   Data dari dataset.js (kelas, matakuliah, prodi, dosen, periode, pertemuan).
   Tabel hanya memuat kolom inti; informasi lengkap ada di drawer (ringkasan, tombol Edit -> form).
   Komponen daftar, drawer, badge, paging, konfirmasi, menu samping: lihat ui di app.js (dipakai juga oleh mkuliah.js dan dkelas.js).
   Detail kelas + menu kiri (Detail Kelas, Dosen Pengajar, dst.): dkelas.js. */
var kuliah = {
    // state per daftar: kelas = tabel Kelas Kuliah, sesi = tabel Jadwal Perkuliahan ({q, rpp, page})
    st: { periode: 0, prodi: 0, jadwal: 0, semua: false, jf: 0, kelas: { q: '', rpp: 10, page: 1 }, sesi: { q: '', rpp: 10, page: 1 } },

    model: {
        data: function() { d.service.init(); return dataset; },
        find: function(tb, id) { return kuliah.model.data()[tb].data.find(function(x) { return x.id == id; }); },
        // kolom teknis yang disembunyikan di bagian "Lanjutan" pada form drawer
        LANJUT_KELAS: ['idkelas', 'idjadwal', 'kurikulum', 'pjmk', 'jumlah_pertemuan', 'sistem_kuliah', 'tgl_mulai', 'tgl_selesai', 'kampus_berdampak', 'metode_pengajaran', 'frekuensi'],
        LANJUT_SESI: ['kelas_id', 'kelompok', 'ket_ruang', 'url_online', 'sks', 'dosen_id', 'dosen_pengganti', 'dokumen_presensi', 'dokumen_jurnal', 'presensi_dosen'],
        WARNA: { dimulai: '#2b9fc9', berlangsung: '#f0ad4e', selesai: '#2e7d32', terjadwal: '#777' },   // badge status sesi
        aktif: function() { var a = kuliah.model.data().periode.data.find(function(p) { return p.status === 'aktif'; }); return a ? a.id : 0; },
        hari: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        bulan: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        // YYYY-MM-DD -> dd-mm-yyyy (format SEVIMA)
        tgl: function(v) { if (!v) { return '-'; } var p = String(v).split('-'); return p[2] + '-' + p[1] + '-' + p[0]; },
        // YYYY-MM-DD -> 1 Okt 2026
        tglPanjang: function(v) { if (!v) { return ''; } var p = v.split('-'); return Number(p[2]) + ' ' + kuliah.model.bulan[p[1] - 1] + ' ' + p[0]; },
        bulanPanjang: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
        // YYYY-MM-DD -> 14 September 2026
        tglLengkap: function(v) { if (!v) { return ''; } var p = v.split('-'); return Number(p[2]) + ' ' + kuliah.model.bulanPanjang[p[1] - 1] + ' ' + p[0]; },
        // subjudul halaman kelas: "Kelas IP231 - Simulasi & Pemodelan | 2026 Ganjil" (sudah di-escape)
        judulKelas: function(k) { var pe = kuliah.model.find('periode', k.periode_id) || {}; return 'Kelas ' + ui.esc(kuliah.model.namaKelas(k)) + ' | ' + ui.esc(pe.nama); },
        namaHari: function(v) { var t = new Date(v + 'T00:00:00'); return isNaN(t) ? '' : kuliah.model.hari[t.getDay()]; },
        ruang: function(id) { var r = kuliah.model.find('ruangan', id); return r ? r.kode : '-'; },
        namaKelas: function(k) { var mk = kuliah.model.find('matakuliah', k.matakuliah_id) || {}; return (k.kode || '-') + ' - ' + (mk.nama || ''); },
        sesi: function(kid) { return kuliah.model.data().pertemuan.data.filter(function(p) { return p.kelas_id == kid; }).sort(function(a, b) { return a.ke - b.ke; }); },
        rows: function() {
            var m = kuliah.model, ds = m.data(), st = kuliah.st, q = st.kelas.q.toLowerCase();
            return ds.kelas.data.map(function(k) {
                var mk = m.find('matakuliah', k.matakuliah_id) || {}, pr = m.find('prodi', mk.prodi_id) || {}, dos = m.find('dosen', k.dosen_id) || {};
                return {
                    id: k.id, kodemk: mk.kode || '', mk: (mk.kode || '-') + ' - ' + (mk.nama || '-'), metode: mk.metode || '',
                    prodi: ui.prodi(pr), kelas: k.kode, pengajar: dos.nama || '',
                    jadwal: k.hari ? k.hari + ', ' + k.jam_mulai + ' s.d ' + k.jam_selesai : '',
                    kap: k.kapasitas, pst: k.peserta, kunci: k.nilai_dikunci, periode_id: k.periode_id, prodi_id: mk.prodi_id
                };
            }).filter(function(r) {
                if (st.periode && r.periode_id != st.periode) { return false; }
                if (st.prodi && r.prodi_id != st.prodi) { return false; }
                return !q || [r.mk, r.prodi, r.kelas, r.pengajar, r.jadwal, r.metode].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return (a.kodemk + a.kelas).localeCompare(b.kodemk + b.kelas); });
        },
        // baris Jadwal Perkuliahan: satu kelas (st.jadwal) atau semua kelas pada periode terpilih (st.semua, difilter st.jf), plus kata cari
        sesiRows: function() {
            var m = kuliah.model, st = kuliah.st, q = st.sesi.q.toLowerCase(), ada = {};
            m.data().kelas.data.forEach(function(k) { if (st.semua ? k.periode_id == st.periode : k.id == st.jadwal) { ada[k.id] = k; } });
            return m.data().pertemuan.data.filter(function(p) {
                if (!ada[p.kelas_id] || (st.semua && st.jf && p.kelas_id != st.jf)) { return false; }
                return !q || [m.namaKelas(ada[p.kelas_id]), p.ke, m.tgl(p.tanggal), m.namaHari(p.tanggal), p.jam_mulai, p.jam_selesai, p.jenis, p.metode, m.ruang(p.ruangan_id), p.status, p.materi].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return st.semua ? (a.tanggal + a.jam_mulai).localeCompare(b.tanggal + b.jam_mulai) : a.ke - b.ke; });
        }
    },

    // definisi kolom tabel (untuk ui.table)
    view: {
        cols: [
            { t: 'Kelas', k: 'kelas' },
            { t: 'Mata Kuliah', k: 'mk' },
            { t: 'Jadwal', k: 'jadwal' },
            { t: 'Peserta', v: function(r) { return ui.esc(r.pst) + ' / ' + ui.esc(r.kap); } },
            { t: 'Nilai', v: function(r) { return ui.badge(r.kunci, r.kunci === 'Dikunci' ? '#2e7d32' : '#d9534f'); } }
        ],
        // pilihan periode (terbaru di atas): dipakai Kelas Kuliah dan Jadwal Perkuliahan semua kelas
        periode: function() {
            return ui.sel('kuliah.controller.filter', 'periode', ui.opt(kuliah.model.data().periode.data.slice().reverse(), kuliah.st.periode, function(p) { return p.nama; }));
        },
        sesiCols: function(semua) {
            var m = kuliah.model;
            return (semua ? [{ t: 'Kelas', s: 'white-space:nowrap', v: function(p) { return ui.esc(m.namaKelas(m.find('kelas', p.kelas_id) || {})); } }] : []).concat([
                { t: 'Sesi', k: 'ke' },
                { t: 'Tanggal', s: 'white-space:nowrap', v: function(p) { return ui.esc(m.namaHari(p.tanggal) + ', ' + m.tgl(p.tanggal)); } },
                { t: 'Waktu', s: 'white-space:nowrap', v: function(p) { return ui.esc(p.jam_mulai + ' - ' + p.jam_selesai); } },
                { t: 'Status', v: function(p) { return ui.badge(p.status, m.WARNA[p.status] || '#777'); } }
            ]);
        }
    },

    controller: {
        kuliah: function() {
            var ds = kuliah.model.data(), st = kuliah.st; st.jadwal = 0; st.semua = false;
            if (!st.periode) { st.periode = kuliah.model.aktif(); }
            d.gebi('content').innerHTML = ui.listPage(ui.head('Kelas Kuliah', 'Daftar Kelas &amp; Jadwal Perkuliahan'),
                kuliah.view.periode() +
                ui.sel('kuliah.controller.filter', 'prodi', ui.opt(ds.prodi.data, st.prodi, ui.prodi, '-- Semua Program Studi --')) +
                ui.search('kuliah.controller.kset', st.kelas, 'Cari Kelas Kuliah'));
            kuliah.controller.draw();
        },

        // d.url(modul) memanggil view() setelah simpan/hapus: kembali ke halaman yang sedang dibuka
        view: function() { if (kuliah.st.semua) { kuliah.controller.jadwalSemua(); } else if (kuliah.st.jadwal) { kuliah.controller.jadwal(kuliah.st.jadwal); } else { kuliah.controller.kuliah(); } },

        // filter periode / prodi / kelas (jf): halaman dibangun ulang karena pilihan kelas mengikuti periode
        filter: function(k, v) {
            var st = kuliah.st; st[k] = Number(v);
            if (k === 'periode') { st.jf = 0; }
            st.kelas.page = 1; st.sesi.page = 1;
            kuliah.controller.view();
        },
        kset: function(k, v) { ui.query(kuliah.st.kelas, k, v); kuliah.controller.draw(); },
        go: function(n) { kuliah.st.kelas.page = n; kuliah.controller.draw(); },
        draw: function() { ui.list({ rows: kuliah.model.rows(), l: kuliah.st.kelas, cols: kuliah.view.cols, click: 'kuliah.controller.edit', go: 'kuliah.controller.go' }); },

        /* klik baris -> drawer: ringkasan + tombol aksi; "Edit" menampilkan form DonatJS (kolom teknis di "Lanjutan") */
        edit: function(id, mode) {
            var m = kuliah.model, k = m.find('kelas', id); if (!k) { return; }
            var mk = m.find('matakuliah', k.matakuliah_id) || {}, pr = m.find('prodi', mk.prodi_id) || {}, pe = m.find('periode', k.periode_id) || {};
            var dos = m.find('dosen', k.dosen_id) || {}, ru = m.find('ruangan', k.ruangan_id), e = ui.esc, jml = m.sesi(k.id).length;
            var jadwal = k.hari ? e(k.hari) + ', ' + e(k.jam_mulai) + ' s.d ' + e(k.jam_selesai) + (ru ? ' &middot; Ruang ' + e(ru.kode) : '') + (k.frekuensi ? ' &middot; ' + e(k.frekuensi) : '') : '<span class="redup">Belum ada jadwal mingguan</span>';
            var rentang = k.tgl_mulai ? e(m.tglPanjang(k.tgl_mulai)) + ' - ' + e(m.tglPanjang(k.tgl_selesai)) + (k.jumlah_pertemuan ? ' &middot; ' + e(k.jumlah_pertemuan) + ' pertemuan' : '') + (k.sistem_kuliah ? ' &middot; ' + e(k.sistem_kuliah) : '') : '';
            ui.drawer({
                judul: 'Kelas ' + k.kode + ' - ' + (mk.nama || ''), tb: 'kelas', modul: 'kuliah', row: k, mode: mode, lanjut: m.LANJUT_KELAS,
                back: 'kuliah.controller.edit(' + k.id + ')', edit: 'kuliah.controller.edit(' + k.id + ", 'form')", hapus: 'kuliah.controller.hapus(' + k.id + ')',
                aksi: ui.btn('Detail Kelas', 'file', "d.closePanel(); navigate('dkelas/detail/" + k.id + "')", true) +
                    ui.btn('Jadwal Perkuliahan (' + jml + ')', 'menu', "d.closePanel(); navigate('kuliah/jadwal/" + k.id + "')", true) +
                    ui.btn('Presensi', 'check', 'kuliah.controller.presensi(' + k.id + ')', !!window.absen && jml > 0) +
                    ui.btn('Peserta', 'menu', '', false) + ui.btn('Nilai', 'menu', '', false),
                ringkas: ui.detail([
                    ['Mata Kuliah', e((mk.kode || '') + ' - ' + (mk.nama || '') + ' (' + Number(mk.sks || 0) + ' SKS' + (mk.semester ? ', Smt ' + mk.semester : '') + ')') + (mk.metode ? ' ' + ui.badge(mk.metode, '#2b9fc9') : '')],
                    ['Kelas', e(k.kode) + ' &middot; ' + e(ui.prodi(pr)) + ' &middot; ' + e(pe.nama) + (k.kurikulum ? ' &middot; Kur. ' + e(k.kurikulum) : '')],
                    ['Jadwal', jadwal],
                    ['Peserta', e(k.peserta) + ' / ' + e(k.kapasitas) + ' ' + ui.badge(k.nilai_dikunci, k.nilai_dikunci === 'Dikunci' ? '#2e7d32' : '#d9534f') + (k.kampus_berdampak === 'ya' ? ' ' + ui.badge('Kampus Berdampak', '#777') : '')],
                    ['Dosen', e((dos.nidn || '') + ' - ' + (dos.nama || '')) + (k.metode_pengajaran ? ' &middot; ' + e(k.metode_pengajaran) : '') + (k.pjmk === 'ya' ? ' ' + ui.badge('PJMK', '#777') : '')],
                    rentang ? ['Periode Kuliah', rentang] : ['Periode Kuliah', '<span class="redup">-</span>']
                ])
            });
        },

        // buka Presensi untuk kelas (dan sesi ke-n, bila ada); absen.js menyimpan pilihan lewat absen.model.load/store
        presensi: function(id, ke) {
            try { var st = absen.model.load(); st.kelas_id = id; st.ke = ke || 1; absen.model.store(st); } catch (x) {}
            d.closePanel(); navigate('absen/absen/1');
        },

        /* Jadwal Perkuliahan per kelas (SEVIMA data_perkuliahan) */
        jadwal: function(kid) {
            if (!Number(kid)) { return kuliah.controller.jadwalSemua(); }
            var m = kuliah.model, k = m.find('kelas', kid), st = kuliah.st, e = ui.esc;
            if (!k) { d.gebi('content').innerHTML = '<p>Kelas tidak ditemukan.</p>'; return; }
            if (st.jadwal != k.id || st.semua) { st.sesi.q = ''; st.sesi.page = 1; }   // ganti kelas: cari & halaman diulang
            st.jadwal = k.id; st.semua = false; modul = 'kuliah';
            d.gebi('content').innerHTML = ui.listPage(ui.head('Jadwal Perkuliahan', m.judulKelas(k)),
                ui.btn('Kembali', 'prev', "navigate('kuliah/kuliah/1')", true) +
                ui.search('kuliah.controller.sset', st.sesi, 'Cari Jadwal Perkuliahan') +
                ui.btn('Tambah Sesi', 'plus', 'kuliah.controller.tambahSesi(' + k.id + ')', true),
                window.dkelas ? dkelas.view.nav(k.id, 'jadwal') : '');   // menu kiri detail kelas
            kuliah.controller.drawSesi();
        },

        /* Jadwal Perkuliahan semua kelas (menu Perkuliahan > Jadwal Perkuliahan): filter periode & kelas */
        jadwalSemua: function() {
            var m = kuliah.model, ds = m.data(), st = kuliah.st;
            if (!st.semua) { st.sesi.q = ''; st.sesi.page = 1; }
            st.semua = true; st.jadwal = 0; modul = 'kuliah';
            if (!st.periode) { st.periode = m.aktif(); }
            var kelas = ds.kelas.data.filter(function(k) { return k.periode_id == st.periode; });
            d.gebi('content').innerHTML = ui.listPage(ui.head('Jadwal Perkuliahan', 'Semua sesi kelas pada periode terpilih'),
                kuliah.view.periode() +
                ui.sel('kuliah.controller.filter', 'jf', ui.opt(kelas, st.jf, m.namaKelas, '-- Semua Kelas --'), 220) +
                ui.search('kuliah.controller.sset', st.sesi, 'Cari Jadwal Perkuliahan') +
                (st.jf ? ui.btn('Tambah Sesi', 'plus', 'kuliah.controller.tambahSesi(' + st.jf + ')', true) : ''));
            kuliah.controller.drawSesi();
        },
        sset: function(k, v) { ui.query(kuliah.st.sesi, k, v); kuliah.controller.drawSesi(); },
        sgo: function(n) { kuliah.st.sesi.page = n; kuliah.controller.drawSesi(); },
        drawSesi: function() { ui.list({ rows: kuliah.model.sesiRows(), l: kuliah.st.sesi, cols: kuliah.view.sesiCols(kuliah.st.semua), click: 'kuliah.controller.sesi', go: 'kuliah.controller.sgo' }); },

        // klik baris sesi -> drawer ringkasan (Presensi, Edit); Edit = form (urutan field mengikuti form SEVIMA)
        sesi: function(id, mode) {
            var m = kuliah.model, p = m.find('pertemuan', id); if (!p) { return; }
            var k = m.find('kelas', p.kelas_id) || {}, dos = m.find('dosen', p.dosen_id) || {}, e = ui.esc;
            if (!kuliah.st.semua) { kuliah.st.jadwal = p.kelas_id; }
            ui.drawer({
                judul: 'Sesi ' + p.ke + ' - ' + m.tgl(p.tanggal), tb: 'pertemuan', modul: 'kuliah', row: p, mode: mode, lanjut: m.LANJUT_SESI,
                back: 'kuliah.controller.sesi(' + p.id + ')', edit: 'kuliah.controller.sesi(' + p.id + ", 'form')", hapus: 'kuliah.controller.hapusSesi(' + p.id + ')',
                aksi: ui.btn('Presensi', 'check', 'kuliah.controller.presensi(' + p.kelas_id + ', ' + p.ke + ')', !!window.absen),
                ringkas: ui.detail([
                    ['Kelas', e(m.namaKelas(k))],
                    ['Sesi', e(p.ke) + ' &middot; ' + e(p.jenis) + ' &middot; ' + e(p.metode)],
                    ['Jadwal', e(m.namaHari(p.tanggal)) + ', ' + e(m.tgl(p.tanggal)) + ' &middot; ' + e(p.jam_mulai) + ' - ' + e(p.jam_selesai)],
                    ['Ruang', e(m.ruang(p.ruangan_id)) + (p.ket_ruang ? ' &middot; ' + e(p.ket_ruang) : '')],
                    ['Status', ui.badge(p.status, m.WARNA[p.status] || '#777') + (p.dosen_pengganti === 'ya' ? ' ' + ui.badge('Dosen pengganti', '#777') : '')],
                    ['Dosen', e(dos.nama || '-')],
                    ['Rencana Materi', e(p.materi)],
                    ['Realisasi', p.realisasi ? e(p.realisasi) : '<span class="redup">Belum diisi</span>'],
                    ['Presensi Dosen', ui.badge(p.presensi_dosen ? 'Sudah' : 'Belum', p.presensi_dosen ? '#2e7d32' : '#d9534f')]
                ])
            });
        },
        tambahSesi: function(kid) {
            var m = kuliah.model, ds = m.data(), k = m.find('kelas', kid), rows = m.sesi(kid), last = rows[rows.length - 1];
            var baru = {}; ds.pertemuan.tipe.forEach(function(t) { baru[t.id] = ''; });
            // isian awal: lanjutan sesi terakhir (jadwal mingguan kelas, 7 hari setelahnya)
            var tg = last ? new Date(last.tanggal + 'T00:00:00') : null; if (tg) { tg.setDate(tg.getDate() + 7); }
            Object.assign(baru, { kelas_id: k.id, ke: last ? last.ke + 1 : 1, tanggal: tg ? tg.toISOString().slice(0, 10) : '', jam_mulai: k.jam_mulai || '', jam_selesai: k.jam_selesai || '',
                jenis: 'Kuliah', status: 'terjadwal', metode: 'Offline', ruangan_id: k.ruangan_id || 0, sks: (m.find('matakuliah', k.matakuliah_id) || {}).sks || '', dosen_id: k.dosen_id, dosen_pengganti: 'tidak', presensi_dosen: 0 });
            modul = 'kuliah'; if (!kuliah.st.semua) { kuliah.st.jadwal = k.id; }
            d.service.param.t = 'pertemuan';
            d.model.add.input.tipe = ds.pertemuan.tipe;
            d.model.add.input.data = baru;
            d.sidePanel('Tambah Sesi - Kelas ' + k.kode, d.view.edit(d.model.add));
            ui.lanjut(m.LANJUT_SESI, 'Lanjutan');
            ui.gambar();
        },
        hapusSesi: function(id) {
            var p = kuliah.model.find('pertemuan', id); if (!p) { return; }
            ui.hapusRow('pertemuan', id, 'Hapus Sesi', 'Yakin menghapus <b>Sesi ' + ui.esc(p.ke) + '</b> (' + ui.esc(kuliah.model.tgl(p.tanggal)) + ')? Tindakan ini tidak dapat dibatalkan.', kuliah.controller.view);
        },
        hapus: function(id) {
            var k = kuliah.model.find('kelas', id); if (!k) { return; }
            ui.hapusRow('kelas', id, 'Hapus Kelas', 'Yakin menghapus kelas <b>' + ui.esc(k.kode) + '</b>? Tindakan ini tidak dapat dibatalkan.', kuliah.controller.kuliah);
        }
    }
};
