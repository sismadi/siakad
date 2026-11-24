/* Menu & submenu sidebar dari dataset.navigasi (struktur SIM Akademik SEVIMA, peran Dosen).
   Halaman yang sudah ada diarahkan ke modulnya; sisanya ke halaman "halaman" (menunggu data SEVIMA). */
var menu = {
    // rute Sevima -> rute DonatJS yang sudah tersedia
    RUTE: { home: 'home/home/1', list_kelas: 'kuliah/kuliah/1' },

    nav: function() { d.service.init(); return dataset.navigasi.data; },
    anak: function(id) { return menu.nav().filter(function(n) { return n.parent_id == id; }); },
    esc: function(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
    path: function(n) { return menu.RUTE[n.url] || (n.url ? 'halaman/halaman/' + n.url : ''); },

    item: function(n) {
        var kids = menu.anak(n.id);
        if (kids.length) {
            return '<li class="grp" data-grp="' + n.id + '"><div class="grp-t" onclick="menu.toggle(' + n.id + ')"><span>' + menu.esc(n.nama) + '</span><i></i></div><ul class="sub">' + kids.map(menu.item).join('') + '</ul></li>';
        }
        var p = menu.path(n);
        return '<li data-path="' + menu.esc(p) + '" title="' + menu.esc(n.deskripsi) + '" onclick="navigate(\'' + menu.esc(p) + '\')">' + menu.esc(n.nama) + '</li>';
    },

    build: function() {
        var ul = document.getElementById('leftmenu'); if (!ul || ul.querySelector('li.grp')) { return; }
        // Beranda sudah ada sebagai "Home"; grup lain dari navigasi
        var html = menu.anak(0).filter(function(n) { return n.url !== 'home'; }).map(menu.item).join('');
        var kons = ul.querySelector('li[data-info="dashboard"]');
        if (kons) { kons.insertAdjacentHTML('beforebegin', html); } else { ul.insertAdjacentHTML('beforeend', html); }
        menu.tambah();
        menu.sync();
    },

    // menu tambahan (bukan dari SEVIMA): Perkuliahan > Jadwal Perkuliahan = semua sesi semua kelas
    tambah: function() {
        var kls = document.querySelector('#leftmenu li[data-path="kuliah/kuliah/1"]');
        if (!kls || document.querySelector('#leftmenu li[data-path="kuliah/jadwal/0"]')) { return; }
        kls.insertAdjacentHTML('afterend', '<li data-path="kuliah/jadwal/0" title="Jadwal semua sesi perkuliahan" onclick="navigate(\'kuliah/jadwal/0\')">Jadwal Perkuliahan</li>');
    },

    toggle: function(id) {
        var g = document.querySelector('#leftmenu li.grp[data-grp="' + id + '"]'); if (g) { g.classList.toggle('open'); }
    },

    // tandai item aktif sesuai alamat sekarang dan buka grup induknya
    sync: function() {
        var cur = (window.location.search || '').replace('?', '').toLowerCase();
        var all = document.querySelectorAll('#leftmenu li.active'); all.forEach(function(x) { x.classList.remove('active'); });
        document.querySelectorAll('#leftmenu li.grp').forEach(function(g) { g.classList.remove('has-active'); });
        var hit = null;
        document.querySelectorAll('#leftmenu li[data-path]').forEach(function(li) { if (li.getAttribute('data-path').toLowerCase() === cur) { hit = li; } });
        if (hit) {
            hit.classList.add('active');
            var p = hit.parentNode;
            while (p && p.id !== 'leftmenu') { if (p.classList && p.classList.contains('grp')) { p.classList.add('open', 'has-active'); } p = p.parentNode; }
        } else if (/^kuliah\/jadwal\/[1-9]/.test(cur)) {
            // jadwal satu kelas: tandai "Kelas Kuliah" dan buka grupnya
            var kk = document.querySelector('#leftmenu li[data-path="kuliah/kuliah/1"]');
            if (kk) { kk.classList.add('active'); var q = kk.parentNode; while (q && q.id !== 'leftmenu') { if (q.classList && q.classList.contains('grp')) { q.classList.add('open', 'has-active'); } q = q.parentNode; } }
        } else {
            var app = cur.split('/')[0], top = document.querySelector('#leftmenu li[data-info="' + app + '"]'); if (top) { top.classList.add('active'); }
        }
    }
};

// halaman bagi menu SEVIMA yang belum memiliki data: tampil judul + keterangan menu dari navigasi
var halaman = {
    controller: {
        halaman: function(url) {
            var n = menu.nav().find(function(x) { return String(x.url).toLowerCase() === String(url).toLowerCase(); }) || { nama: 'Halaman', deskripsi: '' };
            var induk = menu.nav().find(function(x) { return x.id == n.parent_id; });
            var e = menu.esc;
            d.gebi('content').innerHTML = `
                <div class="dash">
                    <div class="dash-head"><div><h2>${e(n.nama)}</h2><small>${e(n.deskripsi || (induk ? induk.nama : ''))}</small></div>${window.notif ? notif.bell() : ''}</div>
                    <div class="row"><div class="col-1-1"><div class="shadow">
                        <h3>${e(n.nama)}</h3>
                        <p>Menu ini sudah tersedia di SIM Akademik SEVIMA (<code>/siakad/${e(url)}</code>), tetapi isi halamannya belum dimasukkan ke aplikasi ini.</p>
                        <p>Kirim HTML halaman tersebut agar kontennya diisi sesuai data SEVIMA.</p>
                    </div></div></div>
                </div>`;
        }
    }
};

(function() {
    var asli = window.navigate;
    window.navigate = function(path) { asli(path); menu.sync(); };
    window.addEventListener('popstate', function() { menu.sync(); });
    document.addEventListener('DOMContentLoaded', function() { menu.build(); });
})();
