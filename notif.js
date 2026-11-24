/* Notifikasi: lonceng + badge + panel samping (memakai d.sidePanel).
 * Data disimpan di localStorage (demo). Untuk produksi ganti load()/save() dengan API. */
var notif = {
    KEY: 'notif_items_siakad',
    COLOR: { info: '#427aa1', sukses: '#2e7d32', peringatan: '#ed8b00' },
    
    esc: function(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
    
    seed: function() {
        var m = 60000, now = Date.now();
        return [
            { id: 1, type: 'peringatan', title: 'Presensi mahasiswa belum dilakukan', text: 'Terdapat pertemuan pada 4 kelas yang belum dilakukan presensi.', t: now - 30 * m, read: false, go: 'absen/absen/1' },
            { id: 2, type: 'peringatan', title: 'Penilaian belum dikunci', text: 'Masih ada 10 komponen penilaian perkuliahan yang belum dikunci.', t: now - 3 * 60 * m, read: false, go: 'dashboard/dashboard/1' },
            { id: 3, type: 'info', title: 'Pengumuman UTS Ganjil 2026/2027', text: 'UTS D3, S1 dan S2 dilaksanakan 23 November - 4 Desember 2026.', t: now - 26 * 60 * m, read: true, go: 'home/home/1' }
        ];
    },
    load: function() {
        var v = null;
        try { v = JSON.parse(window.localStorage.getItem(notif.KEY)); } catch (e) {}
        if (!Array.isArray(v)) { v = notif.seed(); notif.save(v); }
        return v;
    },
    save: function(v) { try { window.localStorage.setItem(notif.KEY, JSON.stringify(v)); } catch (e) {} },
    unread: function() { return notif.load().filter(function(n) { return !n.read; }).length; },
    
    ago: function(t) {
        var s = Math.max(0, Math.floor((Date.now() - t) / 1000));
        if (s < 60) return 'baru saja';
        if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
        if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
        return Math.floor(s / 86400) + ' hari lalu';
    },
    
    /* tombol lonceng; letakkan di header halaman (lihat rekomendasi posisi) */
    label: function(n) { return n ? 'Notifikasi, ' + n + ' belum dibaca' : 'Notifikasi'; },
    bell: function() {
        var n = notif.unread();
        return "<button class='nf-bell' type='button' aria-label='" + notif.label(n) + "' title='Notifikasi' onclick='notif.open()'>" +
        "<img data-src='?bel/24x24' alt=''><span class='nf-badge' aria-hidden='true'" + (n ? '' : ' hidden') + ">" + (n > 9 ? '9+' : n) + "</span></button>";
    },
    refresh: function() {
        var n = notif.unread();
        document.querySelectorAll('.nf-bell').forEach(function(b) { b.setAttribute('aria-label', notif.label(n)); });
        document.querySelectorAll('.nf-badge').forEach(function(b) { b.textContent = n > 9 ? '9+' : n; b.hidden = !n; });
    },
    
    render: function() {
        var items = notif.load().sort(function(a, b) { return b.t - a.t; });
        if (!items.length) return "<p class='nf-empty'>Belum ada notifikasi.</p>";
        return "<div class='nf-tools'><button type='button' onclick='notif.readAll()'>Tandai semua dibaca</button><button type='button' onclick='notif.clear()'>Hapus semua</button></div>" +
        "<ul class='nf-list'>" + items.map(function(n) {
            return "<li class='nf-item" + (n.read ? '' : ' unread') + "' onclick='notif.tap(" + n.id + ")'>" +
            "<i style='background:" + (notif.COLOR[n.type] || notif.COLOR.info) + "'></i>" +
            "<div><b>" + notif.esc(n.title) + "</b><p>" + notif.esc(n.text) + "</p><small>" + notif.ago(n.t) + "</small></div></li>";
        }).join('') + "</ul>";
    },
    open: function() { d.sidePanel('Notifikasi', notif.render()); },
    redraw: function() { var b = d.gebi('panel-body'); if (b && d.gebi('panel-title') && d.gebi('panel-title').innerText === 'Notifikasi') b.innerHTML = notif.render(); notif.refresh(); },
    
    tap: function(id) {
        var all = notif.load(), go = '';
        all.forEach(function(n) { if (n.id === id) { n.read = true; go = n.go; } });
        notif.save(all); notif.redraw();
        if (go) { d.closePanel(); navigate(go); }
    },
    readAll: function() { var a = notif.load(); a.forEach(function(n) { n.read = true; }); notif.save(a); notif.redraw(); },
    clear: function() { notif.save([]); notif.redraw(); },
    
    /* tambah notifikasi baru dari kode lain: notif.push({title:'..', text:'..', type:'sukses', go:'pos/pos/1'}) */
    push: function(o) {
        var a = notif.load();
        a.push({ id: Date.now(), type: o.type || 'info', title: o.title || '', text: o.text || '', t: Date.now(), read: false, go: o.go || '' });
        notif.save(a); notif.refresh();
        if (typeof d.info === 'function') d.info(notif.esc(o.title || 'Notifikasi baru'));
    }
};
