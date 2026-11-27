/* Forum Kelas (Lama) (meniru SEVIMA /siakad/list_forum, peran Dosen).
   Data dari dataset.js (forum, periode). Pola sama dengan Berhenti Studi (bstudi.js): filter periode, tabel kolom inti, detail di drawer (ringkasan, Edit -> form, Delete).
   Kode, mata kuliah, kelas disimpan sebagai teks (arsip periode lama, bukan kunci asing). Format tanggal memakai kuliah.model.tglPanjang (kuliah.js).
   Komponen daftar, drawer, badge, paging, konfirmasi: lihat ui di app.js. Nama modul "flama" karena "forum" dapat bentrok dengan nama tabel. */
var flama = {
    // periode (id); l = {q, rpp, page}
    st: { periode: 0, l: { q: '', rpp: 10, page: 1 } },

    model: {
        data: function() { d.service.init(); return dataset; },
        find: function(tb, id) { return flama.model.data()[tb].data.find(function(x) { return x.id == id; }); },
        WARNA: { arsip: '#777', aktif: '#2e7d32' },
        // forum lama = periode berstatus selesai, terbaru di atas
        periode: function() { return flama.model.data().periode.data.filter(function(p) { return p.status === 'selesai'; }).reverse(); },
        // 'YYYY-MM-DD HH:MM:SS' -> '1 Agu 2026, 01:35:18'
        waktu: function(v) { if (!v) { return '-'; } var p = String(v).split(' '); return kuliah.model.tglPanjang(p[0]) + (p[1] ? ', ' + p[1] : ''); },
        rows: function() {
            var m = flama.model, st = flama.st, q = st.l.q.toLowerCase();
            return m.data().forum.data.filter(function(f) { return !st.periode || f.periode_id == st.periode; }).map(function(f) {
                return { id: f.id, kode: f.kode, mk: f.mk, kelas: f.kelas, post: f.jumlah_post, terakhir: m.waktu(f.post_terakhir) };
            }).filter(function(r) {
                return !q || [r.kode, r.mk, r.kelas, r.post, r.terakhir].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return (a.kode + a.kelas).localeCompare(b.kode + b.kelas); });
        }
    },

    view: {
        cols: [
            { t: 'Kode', k: 'kode' },
            { t: 'Mata Kuliah', k: 'mk' },
            { t: 'Kelas', k: 'kelas' },
            { t: 'Post', k: 'post' },
            { t: 'Post Terakhir', k: 'terakhir', s: 'white-space:nowrap' }
        ]
    },

    controller: {
        flama: function() {
            var m = flama.model, st = flama.st, ps = m.periode();
            if (!st.periode && ps.length) { st.periode = ps[0].id; }
            d.gebi('content').innerHTML = ui.listPage(ui.head('Forum Kelas (Lama)', 'Daftar Forum Diskusi Kelas. Forum kelas dialihkan ke Edlink mulai periode 2026/2027 Ganjil.'),
                ui.btn('Buka Kelas EdLink', 'menu', "navigate('halaman/halaman/list_forumedlink')", true) +
                ui.sel('flama.controller.filter', 'periode', ui.opt(ps, st.periode, function(p) { return p.nama; })) +
                ui.search('flama.controller.kset', st.l, 'Cari Forum Kelas (Lama)'));
            flama.controller.draw();
        },

        // d.url(modul) memanggil view() setelah simpan/hapus
        view: function() { flama.controller.flama(); },

        filter: function(k, v) { flama.st[k] = Number(v); flama.st.l.page = 1; flama.controller.flama(); },
        kset: function(k, v) { ui.query(flama.st.l, k, v); flama.controller.draw(); },
        go: function(n) { flama.st.l.page = n; flama.controller.draw(); },
        draw: function() { ui.list({ rows: flama.model.rows(), l: flama.st.l, cols: flama.view.cols, click: 'flama.controller.edit', go: 'flama.controller.go' }); },

        // klik baris -> drawer: ringkasan; "Edit" menampilkan form DonatJS
        edit: function(id, mode) {
            var m = flama.model, f = m.find('forum', id); if (!f) { return; }
            var pe = m.find('periode', f.periode_id) || {}, e = ui.esc;
            ui.drawer({
                judul: f.kode + ' - ' + f.kelas, tb: 'forum', modul: 'flama', row: f, mode: mode,
                back: 'flama.controller.edit(' + f.id + ')', edit: 'flama.controller.edit(' + f.id + ", 'form')", hapus: 'flama.controller.hapus(' + f.id + ')',
                ringkas: ui.detail([
                    ['Kode', e(f.kode)],
                    ['Mata Kuliah', e(f.mk)],
                    ['Kelas', e(f.kelas)],
                    ['Periode', e(pe.nama || '-')],
                    ['Jumlah Post', e(f.jumlah_post)],
                    ['Post Terakhir', e(m.waktu(f.post_terakhir))],
                    ['Status', ui.badge(f.status, m.WARNA[f.status] || '#777')],
                    ['Keterangan', f.keterangan ? e(f.keterangan) : '<span class="redup">-</span>']
                ])
            });
        },
        hapus: function(id) {
            var f = flama.model.find('forum', id); if (!f) { return; }
            ui.hapusRow('forum', id, 'Hapus Forum', 'Yakin menghapus forum <b>' + ui.esc(f.kode) + ' - ' + ui.esc(f.kelas) + '</b>? Tindakan ini tidak dapat dibatalkan.', flama.controller.flama);
        }
    }
};
