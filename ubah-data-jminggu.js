#!/usr/bin/env node
/* ubah-data-jminggu.js - sekali jalan: data contoh Jadwal Minggu Ini di dataset.js.
   Pakai (di folder proyek):  node ubah-data-jminggu.js dataset.js
   Cadangan dibuat di dataset.js.bak. Bila satu penanda tidak ditemukan, tidak ada yang diubah. */
var fs = require('fs');
var berkas = process.argv[2] || 'dataset.js';
var asli = fs.readFileSync(berkas, 'utf8'), h = asli;
var nl = h.indexOf('\r\n') >= 0 ? '\r\n' : '\n';

function ganti(cari, jadi, nama) {
    var n = (h.match(new RegExp(cari.source, 'g')) || []).length;
    if (n !== 1) { console.error('Batal: penanda "' + nama + '" ditemukan ' + n + ' kali.'); process.exit(1); }
    h = h.replace(cari, jadi);
}

if (h.indexOf('data contoh Jadwal Minggu Ini') >= 0) { console.log('Sudah pernah diubah.'); process.exit(0); }

ganti(/'Kuliah,Praktikum'/, function() { return "'Kuliah,Praktikum,UTS,UAS'"; }, 'pilihan jenis pertemuan');

ganti(/return out;/, function() {
    return [
        "// data contoh Jadwal Minggu Ini (UTS daring, 26 dan 28 Nov 2026)",
        "  var uts = function (i, tanggal, mulai, selesai, status) {",
        "    Object.assign(out[i], { tanggal: tanggal, jam_mulai: mulai, jam_selesai: selesai, jenis: 'UTS', status: status, metode: 'Online', url_online: 'https://meet.google.com/tnh-ktww-vmh' });",
        "  };",
        "  uts(0, '2026-11-26', '08:00', '10:00', 'dimulai');",
        "  uts(1, '2026-11-28', '10:00', '12:00', 'terjadwal');",
        "  return out;"
    ].join(nl);
}, 'return out pada _pertemuan');

ganti(/var V = '[^']*';/, function(s) { return s.slice(0, -2) + "-jm';"; }, 'versi data');

fs.writeFileSync(berkas + '.bak', asli);
fs.writeFileSync(berkas, h);
console.log('Selesai: ' + berkas + ' diubah, cadangan ' + berkas + '.bak');
