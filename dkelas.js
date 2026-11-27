/* Detail Kelas (meniru SEVIMA /siakad/data_kelas/detail/{idkelas}, peran Dosen).
   Menu kiri (Detail Kelas ... Tugas Kuliah) dibaca dari menuData.kelas (menu.data.js) dan digambar komponen bersama ui.subnav (app.js).
   Rute: dkelas/<halaman>/<id kelas>. Nama modul "dkelas" karena "kelas" sudah dipakai tabel dataset (Master).
   Semua 12 menu kiri sudah punya halaman (menuData.kelas, status tersedia).
   Jadwal Perkuliahan memakai halaman kuliah.js (kuliah/jadwal/<id>) yang juga memuat menu kiri yang sama.
   Nilai Perkuliahan (SEVIMA /siakad/set_nilai): tabel nilai peserta, hanya baca; data dari dataset.js (nilai, skor, krs, mahasiswa, presensi).
   RPS (SEVIMA /siakad/view_rps): ringkasan kelas + rincian RPS mata kuliah, hanya baca; data dari dataset.js (rps, matakuliah, kelas).
   Tugas Kuliah (SEVIMA /siakad/list_forumkelas): daftar tugas kelas, hanya baca; data dari dataset.js (tugas, kelas).
   Kontrak Kuliah (SEVIMA /siakad/data_kontrakkul/detail): isi kontrak + dokumen per kelas; Edit/Isi lewat form DonatJS di drawer; data dari dataset.js (kontrak, kelas).
   Kesan Perkuliahan (SEVIMA /siakad/list_kesanmhs): sesi berstatus selesai + jumlah kesan, hanya baca; klik baris -> panel samping isi kesan (anonim); data dari dataset.js (pertemuan, kesan, ruangan, dosen).
   Jadwal Ujian (SEVIMA /siakad/list_jadwalujian): daftar jadwal ujian kelas + Tambah/Edit/Delete lewat form DonatJS; dosen pengawas = tabel pengawas (ditambah/dihapus dari drawer); data dari dataset.js (ujian, pengawas, ruangan, dosen).
   Rekap Kuesioner (SEVIMA /siakad/list_angketkelas): pertanyaan periode kelas (utama + Open Question) dan jumlah responden, hanya baca; data dari dataset.js (kuesioner, responden, krs).
   Dosen Pengajar (SEVIMA /siakad/data_pengajar/detail): tim pengajar kelas (tabel pengajar) + Tambah/Edit/Delete lewat form DonatJS di drawer; data dari dataset.js (pengajar, dosen, prodi, kelas). */
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
        // kolom teknis form pengajar yang disembunyikan di "Lanjutan"
        LANJUT_PENGAJAR: ['nama', 'kelas_id', 'status', 'keterangan'],
        // tim pengajar satu kelas; hari dan jam jadwal diambil dari kelas
        pengajar: function(k) {
            var m = kuliah.model, no = 0;
            return m.data().pengajar.data.filter(function(x) { return x.kelas_id == k.id; }).map(function(x) {
                var dos = m.find('dosen', x.dosen_id) || {}, seluruh = x.sesi_awal == 1 && x.sesi_akhir == k.jumlah_pertemuan;
                return { id: x.id, no: ++no, dosen: (dos.nidn || '-') + ' - ' + (dos.nama || '-'), sks: x.sks, pjmk: x.pjmk, kuesioner: x.kuesioner,
                    jadwal: x.jadwal_aktif === 'ya' && k.hari ? k.hari + ', ' + k.jam_mulai + ' - ' + k.jam_selesai : '-',
                    sesi: x.sesi_awal ? (seluruh ? 'Seluruh Sesi' : 'Sesi') + ' (' + x.sesi_awal + '-' + x.sesi_akhir + ')' : '-' };
            });
        },
        // anggota kelas = baris krs + mahasiswanya (semua status krs)
        anggota: function(id) {
            var ds = kuliah.model.data(), out = [];
            ds.krs.data.forEach(function(r) {
                var m = r.kelas_id == id ? ds.mahasiswa.data.find(function(x) { return x.id == r.mahasiswa_id; }) : null;
                if (m) { out.push({ krs: r, mhs: m }); }
            });
            return out;
        },
        peserta: function(id) {
            var q = dkelas.st.peserta.q.toLowerCase();
            return dkelas.model.anggota(id).map(function(a) {
                return { id: a.mhs.id, nim: a.mhs.nim, nama: a.mhs.nama, program: a.mhs.program, krs: a.krs.status };
            }).filter(function(r) { return !q || [r.nim, r.nama, r.program, r.krs].join(' ').toLowerCase().indexOf(q) >= 0; })
                .sort(function(a, b) { return a.nim.localeCompare(b.nim); });
        },

        // ---- Nilai Perkuliahan ----
        URUT: ['Tugas', 'UTS', 'UAS', 'Kehadiran'],
        PENGISIAN: { 'belum dibuka': '#8a8f98', 'belum dikunci': '#f0ad4e', dikunci: '#2e7d32' },
        // skala grade: [{min, grade, lulus}] urut menurun; kosong = belum ditetapkan (Grade dan Lulus tampil "-")
        SKALA: [],
        // komponen penilaian satu kelas, urut Tugas, UTS, UAS, Kehadiran
        komponen: function(kid) {
            var u = dkelas.model.URUT;
            return kuliah.model.data().nilai.data.filter(function(c) { return c.kelas_id == kid; })
                .sort(function(a, b) { return u.indexOf(a.komponen) - u.indexOf(b.komponen); });
        },
        // status pengisian kelas dari status komponen: semua sama = status itu; campur = belum dikunci
        pengisian: function(komp) {
            if (!komp.length) { return 'belum dibuka'; }
            var s = komp.map(function(c) { return c.status; });
            return s.every(function(x) { return x === s[0]; }) ? s[0] : 'belum dikunci';
        },
        // skor satu peserta pada satu komponen; null = belum ada
        skor: function(krsId, komId) {
            var r = kuliah.model.data().skor.data.find(function(x) { return x.krs_id == krsId && x.komponen_id == komId; });
            return (r && r.nilai !== '' && r.nilai != null) ? Number(r.nilai) : null;
        },
        // Hadir % = sesi hadir (H) dibagi sesi berstatus selesai atau dimulai; null = belum ada sesi
        hadir: function(kid, mid) {
            var s = kuliah.model.sesi(kid).filter(function(p) { return p.status === 'selesai' || p.status === 'dimulai'; });
            if (!s.length || !window.absen) { return null; }
            var h = s.filter(function(p) { return absen.model.status(p.id, mid) === 'H'; }).length;
            return Math.round(h / s.length * 100);
        },
        // grade menurut SKALA; tanpa skala atau tanpa nilai = null
        grade: function(n) {
            var g = n == null ? null : dkelas.model.SKALA.find(function(x) { return n >= x.min; });
            return g || null;
        },
        // baris tabel nilai: peserta krs disetujui; nilai akhir hanya bila semua komponen terisi
        nilai: function(k) {
            var m = dkelas.model, komp = m.komponen(k.id), no = 0;
            var rows = m.anggota(k.id).filter(function(a) { return a.krs.status === 'disetujui'; }).map(function(a) {
                var sk = {}, total = 0, lengkap = komp.length > 0;
                komp.forEach(function(c) {
                    var v = m.skor(a.krs.id, c.id); sk[c.komponen] = v;
                    if (v == null) { lengkap = false; } else { total += v * c.bobot / 100; }
                });
                var nilai = lengkap ? Math.round(total * 100) / 100 : null, g = m.grade(nilai);
                return { id: a.mhs.id, nim: a.mhs.nim, nama: a.mhs.nama, hadir: m.hadir(k.id, a.mhs.id), skor: sk, nilai: nilai,
                    grade: g ? g.grade : '-', lulus: g ? (g.lulus ? 'Ya' : 'Tidak') : '-',
                    ket: (sk.UAS === null) ? 'Belum mengikuti UAS' : '' };
            }).sort(function(a, b) { return a.nim.localeCompare(b.nim); });
            rows.forEach(function(r) { r.no = ++no; });
            return { komp: komp, rows: rows };
        },
        // pertanyaan kuesioner satu periode: {utama: [...], open: [...]} urut menurut kolom urut; no = nomor tampil
        kuesioner: function(periodeId) {
            var all = kuliah.model.data().kuesioner.data.filter(function(x) { return x.periode_id == periodeId && x.status === 'aktif'; })
                .sort(function(a, b) { return Number(a.urut) - Number(b.urut); });
            var bagi = function(bentuk) {
                var no = 0;
                return all.filter(function(x) { return x.bentuk === bentuk; }).map(function(x) { return { id: x.id, no: ++no, nama: x.nama, jenis: x.jenis }; });
            };
            return { utama: bagi('Utama'), open: bagi('Open Question') };
        },
        // responden kelas: selesai = jumlah yang sudah mengisi; total = peserta berstatus krs disetujui
        responden: function(kid) {
            var ds = kuliah.model.data();
            return {
                selesai: ds.responden.data.filter(function(x) { return x.kelas_id == kid && x.status === 'selesai'; }).length,
                total: dkelas.model.anggota(kid).filter(function(a) { return a.krs.status === 'disetujui'; }).length
            };
        },
        // kolom teknis form ujian yang disembunyikan di "Lanjutan"
        LANJUT_UJIAN: ['nama', 'kelas_id', 'keterangan'],
        // dosen pengawas satu jadwal ujian: [{id, nama}]
        pengawas: function(uid) {
            var m = kuliah.model;
            return m.data().pengawas.data.filter(function(x) { return x.ujian_id == uid; }).map(function(x) {
                return { id: x.id, nama: (m.find('dosen', x.dosen_id) || {}).nama || '-' };
            });
        },
        // baris Jadwal Ujian satu kelas, urut tanggal dan jam
        ujian: function(kid) {
            var m = kuliah.model, no = 0;
            return m.data().ujian.data.filter(function(u) { return u.kelas_id == kid; })
                .sort(function(a, b) { return (a.tanggal + a.jam_mulai).localeCompare(b.tanggal + b.jam_mulai); })
                .map(function(u) {
                    var p = dkelas.model.pengawas(u.id).map(function(x) { return x.nama; }).join(', ');
                    return { id: u.id, no: ++no, jenis: u.jenis, kelompok: u.kelompok, ruang: m.ruang(u.ruangan_id), tanggal: m.tgl(u.tanggal),
                        waktu: u.jam_mulai + ' - ' + u.jam_selesai, pengawas: p || '-' };
                });
        },
        // baris Kesan Perkuliahan: sesi berstatus selesai; jumlah = banyaknya kesan pada sesi (dihitung dari tabel kesan)
        kesan: function(kid) {
            var m = kuliah.model, ds = m.data(), no = 0;
            return m.sesi(kid).filter(function(p) { return p.status === 'selesai'; }).map(function(p) {
                var dos = m.find('dosen', p.dosen_id) || {};
                return { id: p.id, no: ++no, hari: m.namaHari(p.tanggal), waktu: p.jam_mulai + ' - ' + p.jam_selesai, ruang: m.ruang(p.ruangan_id),
                    pengajar: dos.nama || '-', kelompok: p.kelompok || '-', materi: p.materi, realisasi: p.realisasi,
                    jumlah: ds.kesan.data.filter(function(x) { return x.pertemuan_id == p.id; }).length };
            });
        },
        // record kontrak kuliah satu kelas; undefined = belum ada
        kontrak: function(kid) {
            return kuliah.model.data().kontrak.data.find(function(x) { return x.kelas_id == kid; });
        },
        // tugas satu kelas, urut waktu; nomor urut ditambahkan
        tugas: function(kid) {
            var rows = kuliah.model.data().tugas.data.filter(function(x) { return x.kelas_id == kid; })
                .sort(function(a, b) { return String(a.waktu).localeCompare(String(b.waktu)); }), no = 0;
            return rows.map(function(x) { return Object.assign({}, x, { no: ++no }); });
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
        pengajarCols: [
            { t: 'No', k: 'no' }, { t: 'Dosen Pengajar', k: 'dosen' }, { t: 'SKS', k: 'sks' },
            { t: 'Status', v: function(r) {
                return (r.pjmk === 'ya' ? ui.badge('Penanggung Jawab', '#777') + ' ' : '') + (r.kuesioner === 'ya' ? ui.badge('Isi Kuesioner', '#2b9fc9') : '') || '-';
            } },
            { t: 'Jadwal', k: 'jadwal', s: 'white-space:nowrap' }, { t: 'Sesi', k: 'sesi' }
        ],
        pesertaCols: [
            { t: 'NIM', k: 'nim' }, { t: 'Nama', k: 'nama' }, { t: 'Program', k: 'program' },
            { t: 'KRS', v: function(r) { return ui.badge(r.krs, dkelas.model.KRS[r.krs] || '#777'); } }
        ],
        // kolom tabel nilai: komponen dan bobotnya dari tabel nilai kelas
        nilaiCols: function(komp) {
            var teks = function(v) { return ui.esc(v == null ? '' : v); };
            return [
                { t: 'No', k: 'no' }, { t: 'NIM', k: 'nim', s: 'white-space:nowrap' }, { t: 'Nama', k: 'nama' },
                { t: 'Hadir', v: function(r) { return r.hadir == null ? '-' : ui.badge(r.hadir + '%', '#2b9fc9'); } }
            ].concat(komp.map(function(c) {
                return { t: c.komponen.toUpperCase() + ' (' + c.bobot + '%)', v: function(r) { return teks(r.skor[c.komponen]); } };
            })).concat([
                { t: 'Nilai', v: function(r) { return r.nilai == null ? '-' : teks(r.nilai); } },
                { t: 'Grade', k: 'grade' }, { t: 'Lulus', k: 'lulus' }, { t: 'Keterangan', k: 'ket' }
            ]);
        },
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
        kesanCols: [
            { t: 'No', k: 'no' }, { t: 'Hari', k: 'hari' }, { t: 'Waktu', k: 'waktu', s: 'white-space:nowrap' }, { t: 'Ruang', k: 'ruang' },
            { t: 'Pengajar', k: 'pengajar' }, { t: 'Kelompok', k: 'kelompok' }, { t: 'Materi', k: 'materi' }, { t: 'Realisasi', k: 'realisasi' },
            { t: 'Kesan', v: function(r) { return r.jumlah ? ui.esc(r.jumlah) + ' kesan' : '-'; } }
        ],
        kuesionerCols: [{ t: 'No', k: 'no' }, { t: 'Pertanyaan', k: 'nama' }],
        ujianCols: [
            { t: 'No', k: 'no' }, { t: 'Jenis', k: 'jenis' }, { t: 'Kelompok', k: 'kelompok' }, { t: 'Ruang', k: 'ruang' },
            { t: 'Tanggal', k: 'tanggal', s: 'white-space:nowrap' }, { t: 'Waktu', k: 'waktu', s: 'white-space:nowrap' }, { t: 'Pengawas', k: 'pengawas' }
        ],
        tugasCols: [
            { t: 'No', k: 'no' }, { t: 'Waktu', k: 'waktu', s: 'white-space:nowrap' }, { t: 'Judul', k: 'nama' }, { t: 'Keterangan', k: 'keterangan' },
            { t: 'Tugas Pertemuan Ke', k: 'pertemuan_ke' }, { t: 'Awal Pengumpulan', k: 'awal', s: 'white-space:nowrap' },
            { t: 'Akhir Pengumpulan', k: 'akhir', s: 'white-space:nowrap' }, { t: 'Jumlah Pengumpul', k: 'pengumpul' }
        ],
        // ringkasan kelas (8 baris, urutan SEVIMA) untuk halaman Nilai, RPS, Tugas; peserta = jumlah peserta (bawaan k.peserta); tambah = baris tambahan [[label, html], ...]
        ringkas: function(k, peserta, tambah) {
            var m = kuliah.model, e = ui.esc, mk = m.find('matakuliah', k.matakuliah_id) || {}, pr = m.find('prodi', mk.prodi_id) || {}, pe = m.find('periode', k.periode_id) || {};
            return ui.detail([
                ['Program Studi', e(ui.prodi(pr) || '-')],
                ['Mata Kuliah', e((mk.kode || '-') + ' - ' + (mk.nama || '-') + ' - ' + Number(mk.sks || 0) + ' SKS')],
                ['Kurikulum', e(k.kurikulum || '-')], ['Kapasitas', e(k.kapasitas)], ['Periode', e(pe.nama || '-')],
                ['Nama Kelas', e(k.kode)], ['Sistem Kuliah', e(k.sistem_kuliah || '-')], ['Peserta', e(peserta == null ? k.peserta : peserta)]
            ].concat(tambah || []));
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
                ['Kelas Mahasiswa', e(k.kelas_mahasiswa || '-')],
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

        // Dosen Pengajar: ringkasan kelas + tim pengajar; klik baris -> drawer (ringkasan, Edit, Delete); Tambah -> form di panel samping
        pengajar: function(id) {
            var k = dkelas.enter(id, 'pengajar'); if (!k) { return; }
            var body = '<div class="aksi-bar">' + ui.btn('Kembali ke Daftar', 'prev', "navigate('kuliah/kuliah/1')", true) +
                ui.btn('Tambah Dosen Pengajar', 'plus', 'dkelas.controller.tambahPengajar(' + k.id + ')', true) +
                ui.btn('Ubah lewat Jadwal Perkuliahan', 'menu', "navigate('kuliah/jadwal/" + k.id + "')", true) + '</div>' +
                dkelas.view.ringkas(k) +
                '<div id="table" class="gTable">' + ui.table(dkelas.view.pengajarCols, dkelas.model.pengajar(k), 'dkelas.controller.pengajarDetail') + '</div>';
            d.gebi('content').innerHTML = dkelas.view.page(k, 'pengajar', 'Dosen Pengajar', body);
            ui.gambar();
        },
        tambahPengajar: function(kid) {
            var m = kuliah.model, ds = m.data(), k = m.find('kelas', kid); if (!k) { return; }
            var mk = m.find('matakuliah', k.matakuliah_id) || {}, baru = {}; ds.pengajar.tipe.forEach(function(t) { baru[t.id] = ''; });
            Object.assign(baru, { nama: 'Pengajar ' + k.kode, kelas_id: k.id, sks: (Number(mk.sks) || 0).toFixed(2).replace('.', ','), pjmk: 'tidak', kuesioner: 'ya', jadwal_aktif: 'ya',
                sesi_awal: 1, sesi_akhir: k.jumlah_pertemuan || '', pengganti_id: 0, status: 'aktif' });
            modul = 'dkelas';
            d.service.param.t = 'pengajar';
            d.model.add.input.tipe = ds.pengajar.tipe;
            d.model.add.input.data = baru;
            d.sidePanel('Tambah Dosen Pengajar - Kelas ' + k.kode, d.view.edit(d.model.add));
            ui.lanjut(dkelas.model.LANJUT_PENGAJAR, 'Lanjutan');
            ui.gambar();
        },
        pengajarDetail: function(id, mode) {
            var m = kuliah.model, p = m.find('pengajar', id); if (!p) { return; }
            var k = m.find('kelas', p.kelas_id) || {}, dos = m.find('dosen', p.dosen_id) || {}, pr = m.find('prodi', dos.prodi_id) || {}, pg = m.find('dosen', p.pengganti_id), e = ui.esc;
            var r = dkelas.model.pengajar(k).find(function(x) { return x.id == p.id; }) || {}, ya = function(v) { return v === 'ya' ? 'Ya' : 'Tidak'; };
            ui.drawer({
                judul: dos.nama || 'Dosen Pengajar', tb: 'pengajar', modul: 'dkelas', row: p, mode: mode, lanjut: dkelas.model.LANJUT_PENGAJAR,
                back: 'dkelas.controller.pengajarDetail(' + p.id + ')', edit: 'dkelas.controller.pengajarDetail(' + p.id + ", 'form')", hapus: 'dkelas.controller.hapusPengajar(' + p.id + ')',
                ringkas: ui.detail([
                    ['Dosen Pengajar', e((dos.nidn || '-') + ' - ' + (dos.nama || '-'))],
                    ['Program Studi', e(ui.prodi(pr) || '-')],
                    ['Jabatan', e(dos.jabatan || '-')],
                    ['Email', e(dos.email || '-')],
                    ['Telepon', e(dos.telepon || '-')],
                    ['Status Dosen', ui.badge(dos.status || '-', dos.status === 'aktif' ? '#2e7d32' : '#777')],
                    ['SKS', e(p.sks || '-')],
                    ['Penanggung Jawab', ya(p.pjmk)],
                    ['Isi Kuesioner', ya(p.kuesioner)],
                    ['Jadwal', e(r.jadwal || '-')],
                    ['Sesi', e(r.sesi || '-')],
                    ['Dosen Pengganti Pelaporan', e(pg ? (pg.nidn || '-') + ' - ' + pg.nama : '-')],
                    ['Status', ui.badge(p.status, p.status === 'aktif' ? '#2e7d32' : '#777')]
                ])
            });
        },
        hapusPengajar: function(id) {
            var p = kuliah.model.find('pengajar', id); if (!p) { return; }
            var dos = kuliah.model.find('dosen', p.dosen_id) || {};
            ui.hapusRow('pengajar', id, 'Hapus Dosen Pengajar', 'Yakin menghapus pengajar <b>' + ui.esc(dos.nama || '-') + '</b> dari kelas ini?', dkelas.controller.view);
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

        // Nilai Perkuliahan: ringkasan kelas + tabel nilai peserta (hanya baca); klik baris -> drawer mahasiswa
        nilai: function(id) {
            var k = dkelas.enter(id, 'nilai'); if (!k) { return; }
            var h = dkelas.model.nilai(k), st = dkelas.model.pengisian(h.komp);
            var aksi = '<div class="aksi-bar">' +
                ui.btn('Kembali ke Daftar', 'prev', "navigate('kuliah/kuliah/1')", true) +
                ui.btn('Upload Excel', 'upload', '', false) +
                ui.btn('Masukkan Nilai', 'pen', '', false) +
                ui.btn('Kunci Nilai', 'lock', '', false) +
                ui.btn('Riwayat Nilai', 'file', '', false) +
                ui.btn('Komposisi Nilai', 'chart', 'dkelas.controller.komposisi(' + k.id + ')', true) + '</div>';
            var body = aksi + dkelas.view.ringkas(k, h.rows.length, [['Status Pengisian Nilai', ui.badge(st, dkelas.model.PENGISIAN[st] || '#777')]]) + '<h3>Daftar Nilai</h3><div id="table" class="gTable">' + ui.table(dkelas.view.nilaiCols(h.komp), h.rows, 'dkelas.controller.mhs') + '</div>';
            d.gebi('content').innerHTML = dkelas.view.page(k, 'nilai', 'Nilai Perkuliahan', body);
            ui.gambar();
        },
        // Komposisi Nilai: bobot komponen kelas (hanya baca)
        komposisi: function(id) {
            var k = kuliah.model.find('kelas', id); if (!k) { return; }
            var komp = dkelas.model.komponen(k.id), total = komp.reduce(function(a, c) { return a + Number(c.bobot || 0); }, 0);
            d.sidePanel('Komposisi Nilai ' + k.kode, ui.detail(komp.map(function(c) {
                return [ui.esc(c.komponen), ui.esc(c.bobot) + '% ' + ui.badge(c.status, dkelas.model.PENGISIAN[c.status] || '#777')];
            }).concat([['Total', ui.badge(total + '%', total === 100 ? '#2e7d32' : '#d9534f')]])));
            ui.gambar();
        },

        // RPS (hanya baca): ringkasan kelas + Tujuan Instruksional Umum, Bahan Ajar, Dokumen RPS dari tabel rps (per mata kuliah)
        rps: function(id) {
            var k = dkelas.enter(id, 'rps'); if (!k) { return; }
            var e = ui.esc, r = kuliah.model.data().rps.data.find(function(x) { return x.matakuliah_id == k.matakuliah_id; }) || {};
            var kosong = '<span class="redup">-</span>';
            var body = '<div class="aksi-bar">' + ui.btn('Kembali ke Daftar', 'prev', "navigate('kuliah/kuliah/1')", true) + ui.btn('RPS', 'file', '', false) + '</div>' +
                dkelas.view.ringkas(k) +
                ui.detail([
                    ['Tujuan Instruksional Umum', r.tujuan ? e(r.tujuan) : kosong],
                    ['Bahan Ajar', r.bahan_ajar ? e(r.bahan_ajar) : kosong],
                    ['Dokumen RPS', r.dokumen ? e(r.dokumen) : kosong]
                ]);
            d.gebi('content').innerHTML = dkelas.view.page(k, 'rps', 'RPS', body);
            ui.gambar();
        },

        // Tugas Kuliah (hanya baca): ringkasan kelas + daftar tugas kelas
        tugas: function(id) {
            var k = dkelas.enter(id, 'tugas'); if (!k) { return; }
            var body = '<div class="aksi-bar">' + ui.btn('Kembali ke Daftar', 'prev', "navigate('kuliah/kuliah/1')", true) + '</div>' +
                dkelas.view.ringkas(k) +
                '<div id="table" class="gTable">' + ui.table(dkelas.view.tugasCols, dkelas.model.tugas(k.id)) + '</div>';
            d.gebi('content').innerHTML = dkelas.view.page(k, 'tugas', 'Tugas Kuliah', body);
            ui.gambar();
        },

        // Rekap Kuesioner (hanya baca): ringkasan kelas, dosen, jenis, jumlah responden, pertanyaan utama dan Open Question
        kuesioner: function(id) {
            var k = dkelas.enter(id, 'kuesioner'); if (!k) { return; }
            var m = dkelas.model, e = ui.esc, dos = kuliah.model.find('dosen', k.dosen_id) || {}, q = m.kuesioner(k.periode_id), r = m.responden(k.id);
            var jenis = [], kosong = '<p class="redup">Pertanyaan kuesioner pada periode ini belum dimasukkan.</p>';
            q.utama.concat(q.open).forEach(function(x) { if (x.jenis && jenis.indexOf(x.jenis) < 0) { jenis.push(x.jenis); } });
            var tabel = function(rows) { return rows.length ? '<div class="gTable">' + ui.table(dkelas.view.kuesionerCols, rows) + '</div>' : kosong; };
            var body = '<div class="aksi-bar">' + ui.btn('Kembali ke Daftar', 'prev', "navigate('kuliah/kuliah/1')", true) + '</div>' +
                dkelas.view.ringkas(k) +
                ui.detail([['Dosen Pengajar', e(dos.nama || '-')], ['Jenis Kuesioner', jenis.length ? e(jenis.join(', ')) : '-']]) +
                '<p><strong>Jumlah Responden : ' + e(r.selesai) + ' / ' + e(r.total) + '</strong></p>' +
                tabel(q.utama) + '<h3>Open Question</h3>' + tabel(q.open);
            d.gebi('content').innerHTML = dkelas.view.page(k, 'kuesioner', 'Rekap Kuesioner', body);
            ui.gambar();
        },

        // Jadwal Ujian: ringkasan kelas + daftar jadwal; klik baris -> drawer (ringkasan, pengawas, Edit, Delete)
        ujian: function(id) {
            var k = dkelas.enter(id, 'ujian'); if (!k) { return; }
            var body = '<div class="aksi-bar">' + ui.btn('Kembali ke Daftar', 'prev', "navigate('kuliah/kuliah/1')", true) +
                ui.btn('Tambah', 'plus', 'dkelas.controller.tambahUjian(' + k.id + ')', true) + '</div>' +
                dkelas.view.ringkas(k) +
                '<div id="table" class="gTable">' + ui.table(dkelas.view.ujianCols, dkelas.model.ujian(k.id), 'dkelas.controller.ujianDetail') + '</div>';
            d.gebi('content').innerHTML = dkelas.view.page(k, 'ujian', 'Jadwal Ujian', body);
            ui.gambar();
        },
        tambahUjian: function(kid) {
            var m = kuliah.model, ds = m.data(), k = m.find('kelas', kid); if (!k) { return; }
            var baru = {}; ds.ujian.tipe.forEach(function(t) { baru[t.id] = ''; });
            Object.assign(baru, { nama: 'UTS ' + k.kode, kelas_id: k.id, jenis: 'UTS', kelompok: '1', ruangan_id: k.ruangan_id || 0, jam_mulai: '07:00', jam_selesai: '07:00', status: 'terjadwal' });
            modul = 'dkelas';
            d.service.param.t = 'ujian';
            d.model.add.input.tipe = ds.ujian.tipe;
            d.model.add.input.data = baru;
            d.sidePanel('Tambah Jadwal Ujian - Kelas ' + k.kode, d.view.edit(d.model.add));
            ui.lanjut(dkelas.model.LANJUT_UJIAN, 'Lanjutan');
            ui.gambar();
        },
        ujianDetail: function(id, mode) {
            var m = kuliah.model, u = m.find('ujian', id); if (!u) { return; }
            var k = m.find('kelas', u.kelas_id) || {}, e = ui.esc, ps = dkelas.model.pengawas(u.id);
            var daftar = ps.length ? ps.map(function(x) {
                return e(x.nama) + ' ' + ui.btn('Hapus', 'trush', 'dkelas.controller.hapusPengawas(' + x.id + ')', true);
            }).join('<br>') : '<span class="redup">-</span>';
            ui.drawer({
                judul: u.jenis + ' - ' + m.tgl(u.tanggal), tb: 'ujian', modul: 'dkelas', row: u, mode: mode, lanjut: dkelas.model.LANJUT_UJIAN,
                back: 'dkelas.controller.ujianDetail(' + u.id + ')', edit: 'dkelas.controller.ujianDetail(' + u.id + ", 'form')", hapus: 'dkelas.controller.hapusUjian(' + u.id + ')',
                aksi: ui.btn('Tambah Pengawas', 'plus', 'dkelas.controller.tambahPengawas(' + u.id + ')', true),
                ringkas: ui.detail([
                    ['Kelas', e(m.namaKelas(k))],
                    ['Jenis Ujian', e(u.jenis)],
                    ['Kelompok', e(u.kelompok || '-')],
                    ['Ruang', e(m.ruang(u.ruangan_id))],
                    ['Tanggal', e(m.namaHari(u.tanggal)) + ', ' + e(m.tgl(u.tanggal))],
                    ['Waktu', e(u.jam_mulai) + ' - ' + e(u.jam_selesai)],
                    ['Status', ui.badge(u.status, m.WARNA[u.status] || '#777')],
                    ['Dosen Pengawas', daftar]
                ])
            });
        },
        tambahPengawas: function(uid) {
            var m = kuliah.model, ds = m.data(), u = m.find('ujian', uid); if (!u) { return; }
            var baru = {}; ds.pengawas.tipe.forEach(function(t) { baru[t.id] = ''; });
            Object.assign(baru, { nama: 'Pengawas ' + u.nama, ujian_id: u.id, status: 'bertugas' });
            modul = 'dkelas';
            d.service.param.t = 'pengawas';
            d.model.add.input.tipe = ds.pengawas.tipe;
            d.model.add.input.data = baru;
            d.sidePanel('Tambah Dosen Pengawas - ' + u.jenis, d.view.edit(d.model.add));
            ui.lanjut(['nama', 'ujian_id', 'status', 'keterangan'], 'Lanjutan');
            ui.gambar();
        },
        hapusPengawas: function(id) {
            var p = kuliah.model.find('pengawas', id); if (!p) { return; }
            var dos = kuliah.model.find('dosen', p.dosen_id) || {};
            ui.hapusRow('pengawas', id, 'Hapus Dosen Pengawas', 'Yakin menghapus pengawas <b>' + ui.esc(dos.nama || '-') + '</b>?', function() { dkelas.controller.ujianDetail(p.ujian_id); });
        },
        hapusUjian: function(id) {
            var u = kuliah.model.find('ujian', id); if (!u) { return; }
            ui.hapusRow('ujian', id, 'Hapus Jadwal Ujian', 'Yakin menghapus jadwal <b>' + ui.esc(u.jenis) + '</b> (' + ui.esc(kuliah.model.tgl(u.tanggal)) + ')? Tindakan ini tidak dapat dibatalkan.', dkelas.controller.view);
        },

        // Kesan Perkuliahan (hanya baca): ringkasan kelas + sesi selesai; klik baris -> panel samping isi kesan
        kesan: function(id) {
            var k = dkelas.enter(id, 'kesan'); if (!k) { return; }
            var body = '<div class="aksi-bar">' + ui.btn('Kembali ke Daftar', 'prev', "navigate('kuliah/kuliah/1')", true) + '</div>' +
                dkelas.view.ringkas(k) +
                '<div id="table" class="gTable">' + ui.table(dkelas.view.kesanCols, dkelas.model.kesan(k.id), 'dkelas.controller.kesanSesi') + '</div>';
            d.gebi('content').innerHTML = dkelas.view.page(k, 'kesan', 'Kesan Mahasiswa', body);
            ui.gambar();
        },
        // isi kesan satu sesi (tanpa nama mahasiswa)
        kesanSesi: function(pid) {
            var m = kuliah.model, p = m.find('pertemuan', pid); if (!p) { return; }
            var rows = m.data().kesan.data.filter(function(x) { return x.pertemuan_id == pid; });
            d.sidePanel('Kesan Sesi ' + p.ke + ' - ' + m.tgl(p.tanggal), rows.length ? ui.detail(rows.map(function(x, i) { return ['Kesan ' + (i + 1), ui.esc(x.kesan)]; })) : '<p>Belum ada kesan.</p>');
            ui.gambar();
        },

        // Kontrak Kuliah: ringkasan kelas + isi kontrak + dokumen; Edit = form tabel kontrak (kelas tanpa record: form tambah)
        kontrak: function(id) {
            var k = dkelas.enter(id, 'kontrak'); if (!k) { return; }
            var e = ui.esc, r = dkelas.model.kontrak(k.id), kosong = '<span class="redup">-</span>';
            var body = '<div class="aksi-bar">' + ui.btn('Kembali ke Daftar', 'prev', "navigate('kuliah/kuliah/1')", true) +
                ui.btn(r ? 'Edit' : 'Isi Kontrak', 'pen', 'dkelas.controller.ubahKontrak(' + k.id + ')', true) + '</div>' +
                dkelas.view.ringkas(k) +
                ui.detail([
                    ['Isi Kontrak Kuliah', r && r.isi ? '<div style="white-space:pre-wrap">' + e(r.isi) + '</div>' : kosong],
                    ['Dokumen Kontrak Kuliah', r && r.dokumen ? e(r.dokumen) : kosong]
                ]);
            d.gebi('content').innerHTML = dkelas.view.page(k, 'kontrak', 'Kontrak Kuliah', body);
            ui.gambar();
        },
        ubahKontrak: function(kid) {
            var k = kuliah.model.find('kelas', kid); if (!k) { return; }
            var r = dkelas.model.kontrak(k.id);
            if (r) {
                ui.drawer({ judul: 'Kontrak Kuliah ' + k.kode, tb: 'kontrak', modul: 'dkelas', row: r, mode: 'form', kembali: 'Tutup', back: 'd.closePanel()' });
                return;
            }
            var ds = kuliah.model.data(), baru = {};
            ds.kontrak.tipe.forEach(function(t) { baru[t.id] = ''; });
            Object.assign(baru, { nama: 'Kontrak Kuliah ' + k.kode, kelas_id: k.id, status: 'belum diisi' });
            modul = 'dkelas';
            d.service.param.t = 'kontrak';
            d.model.add.input.tipe = ds.kontrak.tipe;
            d.model.add.input.data = baru;
            d.sidePanel('Isi Kontrak Kuliah ' + k.kode, d.view.edit(d.model.add));
            ui.gambar();
        }
    }
};
