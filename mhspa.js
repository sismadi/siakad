/* Pembimbing Akademik - Daftar Mahasiswa Bimbingan (meniru SEVIMA /siakad/list_mhspa, peran Dosen).
   Data dari dataset.js (perwalian, mahasiswa, prodi, periode, krs, kelas, matakuliah). Pola sama dengan Berhenti Studi (bstudi.js): filter periode + status KRS (chip berhitung) + cari, tabel kolom inti; detail di drawer (ringkasan, Edit -> form, Delete).
   SKS, Total SKS, KRS Diajukan?, KRS Disetujui? dihitung dari krs pada periode itu, tidak disimpan. Tanggal memakai kuliah.model.tgl (kuliah.js).
   Cetak (SEVIMA /siakad/rep_mhspa): controller.laporan = halaman laporan (kop surat dari tabel instansi, 13 kolom, semua perwalian dosen pada periode terpilih); tombol Cetak memanggil window.print(), aturan @media print ada di style.css.
   Kotak centang: pilihan berlaku untuk baris yang lolos filter; Cetak memuat baris terpilih (tanpa pilihan = semua). Ajukan KRS: KRS 'ditolak' -> 'diajukan'; Setujui KRS: 'diajukan' -> 'disetujui' (hanya mahasiswa terpilih, periode terpilih).
   Komponen daftar, drawer, badge, paging, konfirmasi: lihat ui di app.js. Nama modul "mhspa" karena "bimbingan" sudah dipakai tabel dataset. */
var mhspa = {
    // filter: periode (id), krs (belum | diajukan | disetujui, '' = semua); l = {q, rpp, page}; kategori lain (angkatan, status semester, sistem kuliah) dicari lewat kolom cari
    st: { periode: 0, krs: '', pilih: {}, l: { q: '', rpp: 10, page: 1 } },   // pilih = {id perwalian: true} (kotak centang tabel)

    model: {
        DOSEN: 1,   // dosen yang sedang masuk (sama seperti kuliah.js: WAWAN SISMADI)
        STATUS_KRS: [{ id: 'belum', nama: 'Belum Mengajukan' }, { id: 'diajukan', nama: 'Diajukan' }, { id: 'disetujui', nama: 'Disetujui' }],
        WARNA: { belum: '#8a8f98', diajukan: '#f0ad4e', disetujui: '#2e7d32' },
        data: function() { d.service.init(); return dataset; },
        find: function(tb, id) { return mhspa.model.data()[tb].data.find(function(x) { return x.id == id; }); },
        aktif: function() { var a = mhspa.model.data().periode.data.find(function(p) { return p.status === 'aktif'; }); return a ? a.id : 0; },
        // KRS mahasiswa pada periode: sks (semua), total (hanya disetujui), status = belum | diajukan | disetujui (KRS ditolak diabaikan)
        krs: function(p) {
            var m = mhspa.model, ds = m.data(), sks = 0, total = 0;
            var rs = ds.krs.data.filter(function(k) { return k.mahasiswa_id == p.mahasiswa_id && k.periode_id == p.periode_id && k.status !== 'ditolak'; });
            rs.forEach(function(k) {
                var kl = m.find('kelas', k.kelas_id) || {}, mk = m.find('matakuliah', kl.matakuliah_id) || {}, n = Number(mk.sks) || 0;
                sks += n; if (k.status === 'disetujui') { total += n; }
            });
            var st = !rs.length ? 'belum' : (rs.every(function(k) { return k.status === 'disetujui'; }) ? 'disetujui' : 'diajukan');
            return { sks: sks, total: total, status: st };
        },
        // semua perwalian dosen pada periode terpilih (belum disaring status KRS dan kata cari)
        base: function() {
            var m = mhspa.model, st = mhspa.st;
            return m.data().perwalian.data.filter(function(p) { return p.dosen_id == m.DOSEN && (!st.periode || p.periode_id == st.periode); }).map(function(p) {
                var mh = m.find('mahasiswa', p.mahasiswa_id) || {}, pr = m.find('prodi', mh.prodi_id) || {}, k = m.krs(p);
                return { id: p.id, mhs: (mh.nim || '-') + ' - ' + (mh.nama || '-'), prodi: ui.prodi(pr), angkatan: String(mh.angkatan || ''), smt: p.smt, status_smt: p.status_smt,
                    sks: k.sks, batas: p.batas_sks, ipk: p.ipk, krs: k.status, sistem: p.sistem_kuliah };
            });
        },
        // jumlah mahasiswa per status KRS pada periode terpilih (untuk chip)
        hitung: function() {
            var h = { semua: 0, belum: 0, diajukan: 0, disetujui: 0 };
            mhspa.model.base().forEach(function(r) { h.semua++; h[r.krs]++; });
            return h;
        },
        rows: function() {
            var st = mhspa.st, q = st.l.q.toLowerCase();
            return mhspa.model.base().filter(function(r) {
                if (st.krs && r.krs !== st.krs) { return false; }
                return !q || [r.mhs, r.prodi, r.angkatan, r.status_smt, 'smt ' + r.smt, r.sistem, r.krs].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return a.mhs.localeCompare(b.mhs); });
        },
        // true bila semua baris terfilter terpilih
        semua: function() { var r = mhspa.model.rows(); return r.length > 0 && r.every(function(x) { return mhspa.st.pilih[x.id]; }); },
        // id perwalian terpilih yang masih lolos filter daftar
        pilih: function() {
            return mhspa.model.rows().filter(function(r) { return mhspa.st.pilih[r.id]; }).map(function(r) { return r.id; });
        },
        // ubah status KRS mahasiswa terpilih (jenis: ajukan | setuju); mengembalikan jumlah baris krs yang berubah
        ubahKrs: function(ids, jenis) {
            var m = mhspa.model, dari = { ajukan: 'ditolak', setuju: 'diajukan' }[jenis], ke = { ajukan: 'diajukan', setuju: 'disetujui' }[jenis], n = 0;
            var pw = ids.map(function(id) { return m.find('perwalian', id); }).filter(Boolean);
            m.data().krs.data.forEach(function(k) {
                if (k.status === dari && pw.some(function(p) { return p.mahasiswa_id == k.mahasiswa_id && p.periode_id == k.periode_id; })) { k.status = ke; n++; }
            });
            if (n) { m.simpan(); }
            return n;
        },
        // simpan dataset ke salinan lokal (mode offline); BELUM lewat d.service, lihat catatan serah terima
        simpan: function() { try { window.localStorage.setItem('dataset', JSON.stringify(dataset)); } catch (x) {} },
        // baris laporan cetak: perwalian dosen pada periode (filter daftar lain tidak berlaku); ids kosong = semua
        laporan: function(periodeId, ids) {
            var m = mhspa.model, no = 0;
            return m.data().perwalian.data.filter(function(p) { return p.dosen_id == m.DOSEN && p.periode_id == periodeId && (!ids || !ids.length || ids.some(function(i) { return i == p.id; })); }).map(function(p) {
                var mh = m.find('mahasiswa', p.mahasiswa_id) || {}, pr = m.find('prodi', mh.prodi_id) || {}, k = m.krs(p);
                return { id: p.id, nim: mh.nim || '-', nama: mh.nama || '-', prodi: ui.prodi(pr), angkatan: mh.angkatan || '', status_smt: p.status_smt, smt: p.smt,
                    sks: k.sks, batas: p.batas_sks, total: k.total, ips: p.ips, ipk: p.ipk, disetujui: k.status === 'disetujui' ? 'Ya' : 'Tidak' };
            }).sort(function(a, b) { return a.nim.localeCompare(b.nim); }).map(function(r) { r.no = ++no; return r; });
        },
        // waktu cetak: 27 November 2026 09:02:06 WIB
        waktu: function() {
            var t = new Date(), z = function(n) { return ('0' + n).slice(-2); };
            return t.getDate() + ' ' + kuliah.model.bulanPanjang[t.getMonth()] + ' ' + t.getFullYear() + ' ' + z(t.getHours()) + ':' + z(t.getMinutes()) + ':' + z(t.getSeconds()) + ' WIB';
        }
    },

    view: {
        // kolom inti; selebihnya di drawer
        // judul kolom (t) masuk ke atribut data-title oleh ui.table, jadi harus teks polos; "pilih semua" ada di toolbar
        cols: function() {
            var st = mhspa.st;
            return [
            { t: '', s: 'width:1%', v: function(r) { return '<input type="checkbox" aria-label="Pilih"' + (st.pilih[r.id] ? ' checked' : '') + ' onclick="event.stopPropagation()" onchange="mhspa.controller.pilih(' + r.id + ', this.checked)">'; } },
            { t: 'Mahasiswa', v: function(r) { return ui.esc(r.mhs) + '<br><small class="redup">Angkatan ' + ui.esc(r.angkatan) + '</small>'; } },
            { t: 'Semester', v: function(r) { return 'Smt ' + ui.esc(r.smt) + ' &middot; ' + ui.esc(r.status_smt); } },
            { t: 'SKS / Batas', v: function(r) { return ui.esc(r.sks) + ' / ' + ui.esc(r.batas || '-'); } },
            { t: 'IPK', k: 'ipk' },
            { t: 'KRS', v: function(r) { return ui.badge(r.krs, mhspa.model.WARNA[r.krs] || '#777'); } }
            ];
        },
        // kolom laporan cetak (13 kolom SEVIMA rep_mhspa)
        laporanCols: [
            { t: 'No', k: 'no' }, { t: 'NIM', k: 'nim' }, { t: 'Nama', k: 'nama' }, { t: 'Program Studi', k: 'prodi' }, { t: 'Angkatan', k: 'angkatan' },
            { t: 'Status Smt.', k: 'status_smt' }, { t: 'Smt.', k: 'smt' }, { t: 'SKS', k: 'sks' }, { t: 'Batas SKS', k: 'batas' }, { t: 'Total SKS', k: 'total' },
            { t: 'IPS', k: 'ips' }, { t: 'IPK', k: 'ipk' }, { t: 'KRS Disetujui?', k: 'disetujui' }
        ],
        // kop surat dari tabel instansi (baris kosong dilewati); kandidat dipindah ke ui bila dipakai laporan lain
        kop: function(i) {
            var e = ui.esc, baris = function(a) { return a.filter(Boolean).map(e).join(' | '); };
            return '<div style="text-align:center;border-bottom:3px double #333;padding-bottom:8px;margin:10px 0 14px"><strong style="font-size:1.3rem">' + e(String(i.universitas || '').toUpperCase()) + '</strong><br>' +
                (i.no_sk ? e(i.no_sk) + '<br>' : '') + baris([i.alamat, i.telepon ? 'Telp. ' + i.telepon : '']) + '<br>' + baris([i.email, i.website]) + '</div>';
        }
    },

    controller: {
        mhspa: function() {
            var m = mhspa.model, ds = m.data(), st = mhspa.st, h = m.hitung(), n = m.pilih().length;
            if (!st.periode) { st.periode = m.aktif(); }
            var chip = function(id, label) { return ui.chip(label + ' (' + (id ? h[id] : h.semua) + ')', st.krs === id, "mhspa.controller.filter('krs','" + id + "')"); };
            d.gebi('content').innerHTML = ui.listPage(ui.head('Pembimbing Akademik', 'Pantau KRS mahasiswa bimbingan. Centang mahasiswa, lalu Ajukan KRS, Setujui KRS, atau Cetak.'),
                ui.sel('mhspa.controller.filter', 'periode', ui.opt(ds.periode.data.slice().reverse(), st.periode, function(p) { return p.nama; }), 150) +
                ui.search('mhspa.controller.kset', st.l, 'Cari nama, NIM, angkatan, atau semester') +
                chip('', 'Semua') + chip('belum', 'Belum Mengajukan') + chip('diajukan', 'Diajukan') + chip('disetujui', 'Disetujui') +
                ui.chip(m.semua() ? 'Batal Pilih' : 'Pilih Semua', m.semua(), 'mhspa.controller.pilihSemua(' + !m.semua() + ')') +
                ui.btn('Ajukan KRS', 'check', "mhspa.controller.aksi('ajukan')", true) + ui.btn('Setujui KRS', 'check', "mhspa.controller.aksi('setuju')", true) +
                ui.btn('Cetak' + (n ? ' (' + n + ')' : ''), 'file', 'mhspa.controller.laporan()', true));
            mhspa.controller.draw();
        },

        // d.url(modul) memanggil view() setelah simpan/hapus
        view: function() { mhspa.controller.mhspa(); },

        // periode angka, selebihnya teks; halaman dibangun ulang agar pilihan terpilih ikut
        filter: function(k, v) {
            var st = mhspa.st; st[k] = (k === 'periode') ? Number(v) : v; st.l.page = 1;
            mhspa.controller.mhspa();
        },
        kset: function(k, v) { ui.query(mhspa.st.l, k, v); mhspa.controller.draw(); },
        go: function(n) { mhspa.st.l.page = n; mhspa.controller.draw(); },
        draw: function() { ui.list({ rows: mhspa.model.rows(), l: mhspa.st.l, cols: mhspa.view.cols(), click: 'mhspa.controller.edit', go: 'mhspa.controller.go' }); },

        // kotak centang: satu baris / semua baris terfilter (semua halaman); halaman dibangun ulang agar jumlah di tombol Cetak ikut
        pilih: function(id, on) { if (on) { mhspa.st.pilih[id] = true; } else { delete mhspa.st.pilih[id]; } mhspa.controller.mhspa(); },
        pilihSemua: function(on) {
            mhspa.model.rows().forEach(function(r) { if (on) { mhspa.st.pilih[r.id] = true; } else { delete mhspa.st.pilih[r.id]; } });
            mhspa.controller.mhspa();
        },
        // Ajukan KRS / Setujui KRS untuk mahasiswa terpilih
        aksi: function(jenis) {
            var m = mhspa.model, ids = m.pilih(), nama = { ajukan: 'diajukan', setuju: 'disetujui' }[jenis];
            if (!ids.length) { d.info('Pilih mahasiswa terlebih dahulu'); return; }
            var n = m.ubahKrs(ids, jenis);
            d.info(n ? n + ' KRS ' + nama : 'Tidak ada KRS yang dapat diproses');
            mhspa.controller.mhspa();
        },

        // klik baris -> drawer: ringkasan; "Edit" menampilkan form DonatJS (tabel perwalian)
        edit: function(id, mode) {
            var m = mhspa.model, p = m.find('perwalian', id); if (!p) { return; }
            var mh = m.find('mahasiswa', p.mahasiswa_id) || {}, pr = m.find('prodi', mh.prodi_id) || {}, pe = m.find('periode', p.periode_id) || {}, k = m.krs(p), e = ui.esc;
            var ya = function(b) { return ui.badge(b ? 'Ya' : 'Tidak', b ? '#2e7d32' : '#d9534f'); };
            ui.drawer({
                judul: (mh.nim || '-') + ' - ' + (mh.nama || '-'), tb: 'perwalian', modul: 'mhspa', row: p, mode: mode, lanjut: ['nama', 'periode_id', 'mahasiswa_id', 'dosen_id', 'keterangan'],
                back: 'mhspa.controller.edit(' + p.id + ')', edit: 'mhspa.controller.edit(' + p.id + ", 'form')", hapus: 'mhspa.controller.hapus(' + p.id + ')',
                ringkas: ui.detail([
                    ['Mahasiswa', e((mh.nim || '-') + ' - ' + (mh.nama || '-'))],
                    ['Program Studi', e(ui.prodi(pr) || '-')],
                    ['Angkatan', e(mh.angkatan || '-')],
                    ['Periode', e(pe.nama || '-')],
                    ['Sistem Kuliah', e(p.sistem_kuliah || '-')],
                    ['Status Semester', e(p.status_smt) + ' &middot; Smt ' + e(p.smt || '-')],
                    ['SKS', e(k.sks) + ' / batas ' + e(p.batas_sks || '-') + ' &middot; Total ' + e(k.total)],
                    ['IPS / IPK', e(p.ips || '-') + ' / ' + e(p.ipk || '-')],
                    ['KRS Diajukan?', ya(k.status !== 'belum')],
                    ['KRS Disetujui?', ya(k.status === 'disetujui')],
                    ['Point Kmhs.', e(p.point || '-')],
                    ['SK', p.no_sk ? e(p.no_sk) + ' &middot; ' + e(kuliah.model.tgl(p.tgl_sk)) : '<span class="redup">-</span>'],
                    ['Status Data', ui.badge(p.status, p.status === 'aktif' ? '#2e7d32' : '#777')]
                ])
            });
        },
        // laporan cetak (SEVIMA rep_mhspa): kop + identitas dosen + tabel; Cetak = window.print()
        laporan: function() {
            var m = mhspa.model, st = mhspa.st, ds = m.data(), e = ui.esc, ids = m.pilih();
            if (!st.periode) { st.periode = m.aktif(); }
            var pe = m.find('periode', st.periode) || {}, dos = m.find('dosen', m.DOSEN) || {}, i = ds.instansi.data[0] || {};
            var body = '<div class="aksi-bar">' + ui.btn('Kembali ke Daftar', 'prev', 'mhspa.controller.mhspa()', true) + ui.btn('Cetak', 'file', 'window.print()', true) + '</div>' +
                mhspa.view.kop(i) +
                '<h3 style="text-align:center">DAFTAR MAHASISWA BIMBINGAN PERIODE ' + e(String(pe.nama || '-').toUpperCase()) + '</h3>' +
                ui.detail([['NIP Dosen', e(dos.nidn || '-')], ['Nama Dosen', e(dos.nama || '-')]]) +
                '<div class="gTable">' + ui.table(mhspa.view.laporanCols, m.laporan(st.periode, ids)) + '</div>' +
                '<p><small>Dicetak pada ' + e(m.waktu()) + '</small></p>';
            modul = 'mhspa';
            d.gebi('content').innerHTML = ui.panel(ui.head('Daftar Mahasiswa Bimbingan', 'Periode ' + e(pe.nama || '-')), body);
            ui.gambar();
        },
        hapus: function(id) {
            var m = mhspa.model, p = m.find('perwalian', id); if (!p) { return; }
            var mh = m.find('mahasiswa', p.mahasiswa_id) || {};
            ui.hapusRow('perwalian', id, 'Hapus Data Perwalian', 'Yakin menghapus data perwalian <b>' + ui.esc(mh.nama || '-') + '</b>? Tindakan ini tidak dapat dibatalkan.', mhspa.controller.mhspa);
        }
    }
};
