/* Konsultasi Pembimbing (meniru SEVIMA /siakad/list_konsultasi dan data_konsultasi, peran Dosen).
   Data dari dataset.js (konsultasi, percakapan, mahasiswa, dosen, periode, krs). Pola sama dengan Berhenti Studi (bstudi.js): filter periode, tabel kolom inti, detail di drawer (ringkasan, percakapan, Tambah Pesan, Edit -> form, Delete); Tambah = form di panel samping.
   Post Terakhir dan KRS Disetujui dihitung (dari percakapan dan krs), tidak disimpan. Tanggal memakai kuliah.model (kuliah.js).
   Komponen daftar, drawer, badge, paging, konfirmasi: lihat ui di app.js. Nama modul "konsul" karena "konsultasi" sudah dipakai tabel dataset. */
var konsul = {
    // periode (id); l = {q, rpp, page}
    st: { periode: 0, l: { q: '', rpp: 10, page: 1 } },

    model: {
        data: function() { d.service.init(); return dataset; },
        find: function(tb, id) { return konsul.model.data()[tb].data.find(function(x) { return x.id == id; }); },
        WARNA: { menunggu: '#f0ad4e', dibalas: '#2b9fc9', selesai: '#2e7d32' },
        // kolom form yang disembunyikan di "Lanjutan"
        LANJUT_KONSUL: ['periode_id', 'dosen_id', 'status'],
        LANJUT_PESAN: ['nama', 'konsultasi_id', 'status', 'keterangan'],
        aktif: function() { var a = konsul.model.data().periode.data.find(function(p) { return p.status === 'aktif'; }); return a ? a.id : 0; },
        // 'YYYY-MM-DD HH:MM:SS' -> '1 Agu 2026, 01:35:18'
        waktu: function(v) { if (!v) { return '-'; } var p = String(v).split(' '); return kuliah.model.tglPanjang(p[0]) + (p[1] ? ', ' + p[1] : ''); },
        // waktu lokal saat ini: tanggal 'YYYY-MM-DD' dan jam 'HH:MM:SS' (untuk isian awal form)
        sekarang: function() {
            var t = new Date(), z = function(n) { return ('0' + n).slice(-2); };
            return t.getFullYear() + '-' + z(t.getMonth() + 1) + '-' + z(t.getDate()) + ' ' + z(t.getHours()) + ':' + z(t.getMinutes()) + ':' + z(t.getSeconds());
        },
        // pesan satu konsultasi, urut waktu
        pesan: function(kid) {
            return konsul.model.data().percakapan.data.filter(function(x) { return x.konsultasi_id == kid; }).sort(function(a, b) { return String(a.waktu).localeCompare(String(b.waktu)); });
        },
        // KRS Disetujui: mahasiswa punya krs berstatus disetujui pada periode konsultasi
        krs: function(c) {
            return konsul.model.data().krs.data.some(function(x) { return x.mahasiswa_id == c.mahasiswa_id && x.periode_id == c.periode_id && x.status === 'disetujui'; });
        },
        rows: function() {
            var m = konsul.model, st = konsul.st, q = st.l.q.toLowerCase();
            return m.data().konsultasi.data.filter(function(c) { return !st.periode || c.periode_id == st.periode; }).map(function(c) {
                var mh = m.find('mahasiswa', c.mahasiswa_id) || {}, dos = m.find('dosen', c.dosen_id) || {}, ps = m.pesan(c.id);
                return { id: c.id, mhs: (mh.nim || '-') + ' - ' + (mh.nama || '-'), pembimbing: (dos.nidn || '-') + ' - ' + (dos.nama || '-'), topik: c.topik,
                    terakhir: ps.length ? m.waktu(ps[ps.length - 1].waktu) : '-', status: c.status, krs: m.krs(c) ? 'Ya' : 'Tidak' };
            }).filter(function(r) {
                return !q || [r.mhs, r.pembimbing, r.topik, r.terakhir, r.status, r.krs].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return a.mhs.localeCompare(b.mhs); });
        }
    },

    view: {
        cols: [
            { t: 'Mahasiswa', k: 'mhs' },
            { t: 'Pembimbing', k: 'pembimbing' },
            { t: 'Topik', k: 'topik' },
            { t: 'Post Terakhir', k: 'terakhir', s: 'white-space:nowrap' },
            { t: 'Status', v: function(r) { return ui.badge(r.status, konsul.model.WARNA[r.status] || '#777'); } }
        ]
    },

    controller: {
        konsul: function() {
            var m = konsul.model, st = konsul.st;
            if (!st.periode) { st.periode = m.aktif(); }
            d.gebi('content').innerHTML = ui.listPage(ui.head('Konsultasi Pembimbing', 'Daftar Konsultasi Pembimbing'),
                ui.sel('konsul.controller.filter', 'periode', ui.opt(m.data().periode.data.slice().reverse(), st.periode, function(p) { return p.nama; })) +
                ui.search('konsul.controller.kset', st.l, 'Cari Konsultasi Pembimbing') +
                ui.btn('Tambah', 'plus', 'konsul.controller.tambah()', true));
            konsul.controller.draw();
        },

        // d.url(modul) memanggil view() setelah simpan/hapus
        view: function() { konsul.controller.konsul(); },

        filter: function(k, v) { konsul.st[k] = Number(v); konsul.st.l.page = 1; konsul.controller.konsul(); },
        kset: function(k, v) { ui.query(konsul.st.l, k, v); konsul.controller.draw(); },
        go: function(n) { konsul.st.l.page = n; konsul.controller.draw(); },
        draw: function() { ui.list({ rows: konsul.model.rows(), l: konsul.st.l, cols: konsul.view.cols, click: 'konsul.controller.edit', go: 'konsul.controller.go' }); },

        // Tambah: form konsultasi di panel samping; dosen awal = dosen 1 (WAWAN SISMADI), tanggal awal = hari ini
        tambah: function() {
            var m = konsul.model, ds = m.data(), st = konsul.st, baru = {};
            ds.konsultasi.tipe.forEach(function(t) { baru[t.id] = ''; });
            Object.assign(baru, { periode_id: st.periode || m.aktif(), dosen_id: 1, tanggal: m.sekarang().slice(0, 10), status: 'menunggu' });
            modul = 'konsul';
            d.service.param.t = 'konsultasi';
            d.model.add.input.tipe = ds.konsultasi.tipe;
            d.model.add.input.data = baru;
            d.sidePanel('Tambah Konsultasi', d.view.edit(d.model.add));
            ui.lanjut(m.LANJUT_KONSUL, 'Lanjutan');
            ui.gambar();
        },

        // klik baris -> drawer: ringkasan + percakapan; "Edit" menampilkan form DonatJS
        edit: function(id, mode) {
            var m = konsul.model, c = m.find('konsultasi', id); if (!c) { return; }
            var mh = m.find('mahasiswa', c.mahasiswa_id) || {}, dos = m.find('dosen', c.dosen_id) || {}, pe = m.find('periode', c.periode_id) || {}, e = ui.esc, ps = m.pesan(c.id);
            var chat = ps.length ? ps.map(function(x) {
                return '<b>' + (x.pengirim === 'dosen' ? 'Dosen' : 'Mahasiswa') + '</b> <small>(' + e(m.waktu(x.waktu)) + ')</small><br>' + e(x.isi);
            }).join('<br><br>') : '<span class="redup">Belum ada pesan</span>';
            ui.drawer({
                judul: (mh.nim || '-') + ' - ' + (mh.nama || '-'), tb: 'konsultasi', modul: 'konsul', row: c, mode: mode, lanjut: m.LANJUT_KONSUL,
                back: 'konsul.controller.edit(' + c.id + ')', edit: 'konsul.controller.edit(' + c.id + ", 'form')", hapus: 'konsul.controller.hapus(' + c.id + ')',
                aksi: ui.btn('Tambah Pesan', 'plus', 'konsul.controller.tambahPesan(' + c.id + ')', true) + ui.btn('Cetak Percakapan', 'file', '', false),
                ringkas: ui.detail([
                    ['Periode Akademik', e(pe.nama || '-')],
                    ['Mahasiswa', e((mh.nim || '-') + ' - ' + (mh.nama || '-'))],
                    ['Pembimbing', e((dos.nidn || '-') + ' - ' + (dos.nama || '-'))],
                    ['Tanggal Konsultasi', e(kuliah.model.tgl(c.tanggal))],
                    ['Topik', e(c.topik)],
                    ['Keterangan', c.catatan ? e(c.catatan) : '<span class="redup">-</span>'],
                    ['KRS Disetujui', m.krs(c) ? 'Ya' : 'Tidak'],
                    ['Status', ui.badge(c.status, m.WARNA[c.status] || '#777')],
                    ['Percakapan', chat]
                ])
            });
        },

        // Tambah Pesan: form percakapan di panel samping; pengirim awal = dosen, waktu awal = sekarang
        tambahPesan: function(kid) {
            var m = konsul.model, ds = m.data(), c = m.find('konsultasi', kid); if (!c) { return; }
            var baru = {}; ds.percakapan.tipe.forEach(function(t) { baru[t.id] = ''; });
            Object.assign(baru, { nama: 'Pesan konsultasi ' + c.id, konsultasi_id: c.id, pengirim: 'dosen', waktu: m.sekarang(), status: 'terkirim' });
            modul = 'konsul';
            d.service.param.t = 'percakapan';
            d.model.add.input.tipe = ds.percakapan.tipe;
            d.model.add.input.data = baru;
            d.sidePanel('Tambah Pesan', d.view.edit(d.model.add));
            ui.lanjut(m.LANJUT_PESAN, 'Lanjutan');
            ui.gambar();
        },
        hapus: function(id) {
            var m = konsul.model, c = m.find('konsultasi', id); if (!c) { return; }
            ui.hapusRow('konsultasi', id, 'Hapus Konsultasi', 'Yakin menghapus konsultasi <b>' + ui.esc(c.topik) + '</b>? Tindakan ini tidak dapat dibatalkan.', konsul.controller.konsul);
        }
    }
};
