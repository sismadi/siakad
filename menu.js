/* Menu & submenu sidebar dari menu.data.js (menuData; struktur SIM Akademik SEVIMA, peran Dosen).
   Halaman yang sudah ada diarahkan ke modulnya; sisanya ke halaman "halaman" (menunggu data SEVIMA). */
var menu = {
    RUTE: menuData.rute,   // rute Sevima -> rute DonatJS (lihat menu.data.js)

    nav: function() { return menuData.nav; },
    anak: function(id) { return menu.nav().filter(function(n) { return n.parent_id == id; }); },
    path: function(n) { return menu.RUTE[n.url] || (n.url ? 'halaman/halaman/' + n.url : ''); },

    item: function(n) {
        var kids = menu.anak(n.id);
        if (kids.length) {
            return '<li class="grp" data-grp="' + n.id + '"><div class="grp-t" onclick="menu.toggle(' + n.id + ')"><span>' + ui.esc(n.nama) + '</span><i></i></div><ul class="sub">' + kids.map(menu.item).join('') + '</ul></li>';
        }
        var p = menu.path(n);
        return '<li data-path="' + ui.esc(p) + '" title="' + ui.esc(n.deskripsi) + '" onclick="navigate(\'' + ui.esc(p) + '\')">' + ui.esc(n.nama) + '</li>';
    },

    build: function() {
        var ul = document.getElementById('leftmenu'); if (!ul || ul.querySelector('li.grp')) { return; }
        // Beranda sudah ada sebagai "Home"; grup lain dari menuData
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

    // buka semua grup induk dari item li
    buka: function(li) {
        for (var p = li.parentNode; p && p.id !== 'leftmenu'; p = p.parentNode) { if (p.classList && p.classList.contains('grp')) { p.classList.add('open', 'has-active'); } }
    },

    // tandai item aktif sesuai alamat sekarang dan buka grup induknya
    sync: function() {
        var cur = (window.location.search || '').replace('?', '').toLowerCase(), hit = null;
        document.querySelectorAll('#leftmenu li.active').forEach(function(x) { x.classList.remove('active'); });
        document.querySelectorAll('#leftmenu li.grp').forEach(function(g) { g.classList.remove('has-active'); });
        document.querySelectorAll('#leftmenu li[data-path]').forEach(function(li) { if (li.getAttribute('data-path').toLowerCase() === cur) { hit = li; } });
        // jadwal satu kelas dan halaman detail kelas (dkelas): tandai "Kelas Kuliah"; halaman lain tanpa item menu: tandai menu utama modulnya
        if (!hit && /^(kuliah\/jadwal\/[1-9]|dkelas\/)/.test(cur)) { hit = document.querySelector('#leftmenu li[data-path="kuliah/kuliah/1"]'); }
        if (!hit) { hit = document.querySelector('#leftmenu li[data-info="' + cur.split('/')[0] + '"]'); }
        if (hit) { hit.classList.add('active'); menu.buka(hit); }
    }
};

// halaman bagi menu SEVIMA yang belum memiliki data: tampil judul + keterangan menu dari menuData
var halaman = {
    controller: {
        halaman: function(url) {
            var n = menu.nav().find(function(x) { return String(x.url).toLowerCase() === String(url).toLowerCase(); }) || { nama: 'Halaman', deskripsi: '' };
            var induk = menu.nav().find(function(x) { return x.id == n.parent_id; });
            var e = ui.esc;
            d.gebi('content').innerHTML = ui.panel(ui.head(e(n.nama), e(n.deskripsi || (induk ? induk.nama : ''))),
                '<h3>' + e(n.nama) + '</h3>' +
                '<p>Menu ini sudah tersedia di SIM Akademik SEVIMA (<code>/siakad/' + e(url) + '</code>), tetapi isi halamannya belum dimasukkan ke aplikasi ini.</p>' +
                '<p>Kirim HTML halaman tersebut agar kontennya diisi sesuai data SEVIMA.</p>');
        }
    }
};

(function() {
    var asli = window.navigate;
    window.navigate = function(path) { asli(path); menu.sync(); };
    window.addEventListener('popstate', function() { menu.sync(); });
    document.addEventListener('DOMContentLoaded', function() { menu.build(); });
})();
