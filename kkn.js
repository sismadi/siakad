/* Kegiatan Pendukung (meniru SEVIMA /siakad/list_kkn dan data_kkn, peran Dosen).
   Data dari dataset.js (kegiatan, periode). Pola sama dengan Berhenti Studi (bstudi.js): filter periode dan jenis; tabel kolom inti; detail di drawer (ringkasan, Edit -> form, Delete); Tambah = form DonatJS di panel samping.
   Unit dan instansi disimpan sebagai teks. Tanggal memakai kuliah.model.tgl (kuliah.js). Import xlsx, template, dan Cetak belum ada (tombol nonaktif).
   Komponen daftar, drawer, badge, paging, konfirmasi: lihat ui di app.js. Nama modul "kkn" karena tabelnya bernama "kegiatan". */
var kkn = {
    // filter: periode (id, 0 = semua), jenis (teks, '' = semua); l = {q, rpp, page}
    st: { periode: 0, jenis: '', l: { q: '', rpp: 10, page: 1 } },

    model: {
        UNIT: 'Universitas IPWIJA',
        // kolom form yang disembunyikan di "Lanjutan"
        LANJUT: ['status', 'keterangan'],
        JENIS: ['Kuliah Kerja Nyata', 'Kerja Praktek/PKL', 'Program kreativitas mahasiswa', 'Kompetisi', 'Aktivitas kemahasiswaan'].map(function(j) { return { id: j }; }),
        WARNA: { aktif: '#2b9fc9', selesai: '#2e7d32' },
        data: function() { d.service.init(); return dataset; },
        find: function(tb, id) { return kkn.model.data()[tb].data.find(function(x) { return x.id == id; }); },
        aktif: function() { var a = kkn.model.data().periode.data.find(function(p) { return p.status === 'aktif'; }); return a ? a.id : 0; },
        rows: function() {
            var m = kkn.model, st = kkn.st, q = st.l.q.toLowerCase(), tg = kuliah.model.tgl;
            return m.data().kegiatan.data.map(function(g) {
                var pe = m.find('periode', g.periode_id) || {};
                return { id: g.id, periode: pe.nama || '-', jenis: g.jenis, nama: g.nama, unit: g.unit || '', instansi: g.instansi, mulai: g.tgl_mulai || '', selesai: g.tgl_selesai || '', periode_id: g.periode_id };
            }).filter(function(r) {
                if (st.periode && r.periode_id != st.periode) { return false; }
                if (st.jenis && r.jenis !== st.jenis) { return false; }
                return !q || [r.periode, r.jenis, r.nama, r.unit, r.instansi, tg(r.mulai), tg(r.selesai)].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return b.mulai.localeCompare(a.mulai); });
        }
    },

    view: {
        cols: [
            { t: 'Periode', k: 'periode' },
            { t: 'Jenis', k: 'jenis' },
            { t: 'Nama Kegiatan', k: 'nama' },
            { t: 'Instansi', k: 'instansi' },
            { t: 'Mulai', s: 'white-space:nowrap', v: function(r) { return ui.esc(kuliah.model.tgl(r.mulai)); } },
            { t: 'Selesai', s: 'white-space:nowrap', v: function(r) { return ui.esc(kuliah.model.tgl(r.selesai)); } }
        ]
    },

    controller: {
        kkn: function() {
            var m = kkn.model, ds = m.data(), st = kkn.st, nm = function(x) { return x.nama || x.id; };
            d.gebi('content').innerHTML = ui.listPage(ui.head('Kegiatan Pendukung', 'Monitoring Kegiatan Mahasiswa'),
                ui.sel('kkn.controller.filter', 'periode', ui.opt(ds.periode.data.slice().reverse(), st.periode, nm, '-- Semua Periode --')) +
                ui.sel('kkn.controller.filter', 'jenis', ui.opt(m.JENIS, st.jenis, nm, '-- Semua Jenis --', '')) +
                ui.search('kkn.controller.kset', st.l, 'Cari Kegiatan Pendukung') +
                ui.btn('Tambah', 'plus', 'kkn.controller.tambah()', true) + ui.btn('Import', 'upload', '', false) + ui.btn('Cetak', 'file', '', false));
            kkn.controller.draw();
        },

        // d.url(modul) memanggil view() setelah simpan/hapus
        view: function() { kkn.controller.kkn(); },

        // periode angka, jenis teks; halaman dibangun ulang agar pilihan terpilih ikut
        filter: function(k, v) {
            var st = kkn.st; st[k] = (k === 'periode') ? Number(v) : v; st.l.page = 1;
            kkn.controller.kkn();
        },
        kset: function(k, v) { ui.query(kkn.st.l, k, v); kkn.controller.draw(); },
        go: function(n) { kkn.st.l.page = n; kkn.controller.draw(); },
        draw: function() { ui.list({ rows: kkn.model.rows(), l: kkn.st.l, cols: kkn.view.cols, click: 'kkn.controller.edit', go: 'kkn.controller.go' }); },

        // Tambah (SEVIMA data_kkn): form DonatJS di panel samping; isian awal Unit, periode aktif, status aktif
        tambah: function() {
            var m = kkn.model, ds = m.data(), baru = {};
            ds.kegiatan.tipe.forEach(function(t) { baru[t.id] = ''; });
            Object.assign(baru, { unit: m.UNIT, periode_id: kkn.st.periode || m.aktif() || '', status: 'aktif' });
            modul = 'kkn';
            d.service.param.t = 'kegiatan';
            d.model.add.input.tipe = ds.kegiatan.tipe;
            d.model.add.input.data = baru;
            d.sidePanel('Tambah Kegiatan Pendukung', d.view.edit(d.model.add));
            ui.lanjut(m.LANJUT, 'Lanjutan');
            ui.gambar();
        },

        // klik baris -> drawer: ringkasan; "Edit" menampilkan form DonatJS (tabel kegiatan)
        edit: function(id, mode) {
            var m = kkn.model, g = m.find('kegiatan', id); if (!g) { return; }
            var pe = m.find('periode', g.periode_id) || {}, e = ui.esc, tg = kuliah.model.tgl, kosong = '<span class="redup">-</span>';
            ui.drawer({
                judul: g.nama, tb: 'kegiatan', modul: 'kkn', row: g, mode: mode, lanjut: m.LANJUT,
                back: 'kkn.controller.edit(' + g.id + ')', edit: 'kkn.controller.edit(' + g.id + ", 'form')", hapus: 'kkn.controller.hapus(' + g.id + ')',
                ringkas: ui.detail([
                    ['Unit', e(g.unit || '-')],
                    ['Periode Akademik', e(pe.nama || '-')],
                    ['Jenis Kegiatan', e(g.jenis)],
                    ['Nama Kegiatan', e(g.nama)],
                    ['Nama Kegiatan (EN)', g.nama_en ? e(g.nama_en) : kosong],
                    ['Kelompok', g.kelompok ? e(g.kelompok) : kosong],
                    ['Nama Instansi', e(g.instansi)],
                    ['Alamat Instansi', e(g.alamat_instansi)],
                    ['Tanggal Mulai', e(tg(g.tgl_mulai))],
                    ['Tanggal Selesai', e(tg(g.tgl_selesai))],
                    ['Nomor SK', g.no_sk ? e(g.no_sk) : kosong],
                    ['Tanggal SK', e(tg(g.tgl_sk))],
                    ['Status', ui.badge(g.status, m.WARNA[g.status] || '#777')],
                    ['Keterangan', g.keterangan ? e(g.keterangan) : kosong]
                ])
            });
        },
        hapus: function(id) {
            var g = kkn.model.find('kegiatan', id); if (!g) { return; }
            ui.hapusRow('kegiatan', id, 'Hapus Kegiatan', 'Yakin menghapus kegiatan <b>' + ui.esc(g.nama) + '</b>? Tindakan ini tidak dapat dibatalkan.', kkn.controller.kkn);
        }
    }
};
