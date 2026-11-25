// dataset.js - SIAKAD (meniru SIM Akademik Sevima, Universitas IPWIJA, peran Dosen)
// MODE DEVELOP: tiap tabel hanya 2 record (instansi = 1 record konfigurasi).
// Format DonatJS: tiap tabel = { tipe: [definisi form], data: [isi] }
// Tipe field: hidden | text | textarea | option (arr = daftar pilihan dipisah koma)
// Tanggal memakai format YYYY-MM-DD, jam HH:MM.
//
// Relasi:
//   prodi <- dosen, mahasiswa, matakuliah
//   periode, matakuliah, dosen, ruangan <- kelas
//   mahasiswa + kelas <- krs (peserta kelas)
//   kelas <- pertemuan <- presensi (<- mahasiswa)
//   kelas <- nilai (komponen penilaian)
//   mahasiswa + dosen <- bimbingan (proposal TA), konsultasi
//   dosen <- notifikasi

// ---------- pembantu kecil (hanya untuk menyusun data, bukan logika aplikasi) ----------
var _ids = function (n, from) { var a = []; for (var i = from || 1; i < (from || 1) + n; i++) { a.push(i); } return a.join(','); };
var _tipe = function (id, nama, arr, info, perlu) { return { id: id, nama: nama, arr: arr || '', info: info || '', perlu: perlu || '0' }; };
var _ID = _tipe('id', 'hidden', '', 'otomatis', '0');

var _TGL = ['2026-10-01'];                                                   // sesi 1 (Kamis)
var _MATERI = {
  1: ['Kontrak Kuliah dan Pengantar Robotika'],
  2: ['Kontrak Kuliah dan Pengantar Simulasi & Pemodelan']
};
var _JAM = { 1: '08:00', 2: '10:30' };
var _SELESAI = { 1: '10:30', 2: '13:00' };   // jam selesai kelas (sama dengan jadwal mingguan)
var _RUANG = { 1: 1, 2: 2 };                 // ruangan_id per kelas: 3G, 3H
var _pertemuan = function () {
  var out = [], id = 1;
  [1, 2].forEach(function (k) {
    _TGL.forEach(function (t, i) {
      out.push({ id: id++, kelas_id: k, ke: i + 1, tanggal: t, jam_mulai: _JAM[k], jam_selesai: _SELESAI[k], jenis: 'Kuliah', kelompok: '', status: 'selesai', metode: 'Offline', ruangan_id: _RUANG[k], ket_ruang: '', url_online: '', sks: 3, dosen_id: 1, dosen_pengganti: 'tidak', materi: 'Pertemuan ' + (i + 1) + ': ' + _MATERI[k][i], realisasi: '', dokumen_presensi: '', dokumen_jurnal: '', presensi_dosen: 0 });
    });
  });
  // Data asli SEVIMA (kelas IP231 / 6760): Sesi 1 berstatus Dimulai dan realisasi materi sudah terisi.
  var s1 = out.find(function (p) { return p.kelas_id === 2 && p.ke === 1; });
  s1.status = 'dimulai'; s1.realisasi = s1.materi;
  return out;
};

var _mhs = function (id, nim, nama, angkatan, program, pa) {
  return { id: id, nim: nim, nama: nama, angkatan: angkatan, prodi_id: 1, program: program, status: 'aktif', dosen_pa_id: pa, email: nim + '@mhs.ipwija.ac.id', telepon: '0812-2000-' + ('0000' + id).slice(-4) };
};

// ---------- dataset ----------
var dataset = {

instansi: {
tipe: [_ID,
_tipe('aplikasi', 'text', '', 'nama aplikasi', '1'),
_tipe('universitas', 'text', '', 'nama perguruan tinggi', '1'),
_tipe('kode_klien', 'text', '', 'kode klien', '0'),
_tipe('domain', 'text', '', '', '0'),
_tipe('penyedia', 'text', '', 'vendor sistem', '0'),
_tipe('tahun', 'text', '', 'tahun hak cipta', '0'),
_tipe('bahasa', 'option', 'id,en', 'bahasa aplikasi', '0'),
_tipe('zona_waktu', 'text', '', '', '0')],
data: [
{ id: 1, aplikasi: 'SIM Akademik', universitas: 'Universitas IPWIJA', kode_klien: '041145', domain: 'siakad.ipwija.ac.id', penyedia: 'SEVIMA', tahun: 2026, bahasa: 'id', zona_waktu: 'Asia/Jakarta' }
]},

periode: {
tipe: [_ID,
_tipe('kode', 'text', '', 'mis. 20261 (tahun + 1 ganjil / 2 genap)', '1'),
_tipe('nama', 'text', '', 'mis. 2026 Ganjil', '1'),
_tipe('tahun_akademik', 'text', '', 'mis. 2026/2027', '1'),
_tipe('semester', 'option', 'Ganjil,Genap', '', '1'),
_tipe('tgl_mulai', 'text', '', 'YYYY-MM-DD', '0'),
_tipe('tgl_selesai', 'text', '', 'YYYY-MM-DD', '0'),
_tipe('status', 'option', 'aktif,selesai', '', '1')],
data: [
{ id: 1, kode: '20252', nama: '2025 Genap', tahun_akademik: '2025/2026', semester: 'Genap', tgl_mulai: '2026-03-02', tgl_selesai: '2026-08-14', status: 'selesai' },
{ id: 2, kode: '20261', nama: '2026 Ganjil', tahun_akademik: '2026/2027', semester: 'Ganjil', tgl_mulai: '2026-09-01', tgl_selesai: '2027-02-26', status: 'aktif' }
]},

prodi: {
tipe: [_ID,
_tipe('kode', 'text', '', 'kode program studi', '1'),
_tipe('nama', 'text', '', 'nama program studi', '1'),
_tipe('jenjang', 'option', 'D3,S1,S2', '', '1'),
_tipe('fakultas', 'text', '', '', '0')],
data: [
{ id: 1, kode: 'IF', nama: 'Informatika', jenjang: 'S1', fakultas: 'Fakultas Teknologi Informasi' },
{ id: 2, kode: 'SI', nama: 'Sistem Informasi', jenjang: 'S1', fakultas: 'Fakultas Teknologi Informasi' }
]},

dosen: {
tipe: [_ID,
_tipe('nidn', 'text', '', 'NIDN / kode referensi', '1'),
_tipe('nama', 'text', '', 'nama lengkap', '1'),
_tipe('email', 'text', '', 'email institusi', '1'),
_tipe('prodi_id', 'option', _ids(2), '1 IF, 2 SI', '1'),
_tipe('jabatan', 'option', 'Asisten Ahli,Lektor,Lektor Kepala,Dosen Tetap', '', '0'),
_tipe('telepon', 'text', '', '', '0'),
_tipe('status', 'option', 'aktif,nonaktif', '', '0')],
data: [
{ id: 1, nidn: '0316087708', nama: 'WAWAN SISMADI', email: 'wawansismadi@ipwija.ac.id', prodi_id: 1, jabatan: 'Dosen Tetap', telepon: '0812-1000-0001', status: 'aktif' },
{ id: 2, nidn: '0305058201', nama: 'Dr. Rahmat Hidayat, M.Kom.', email: 'rahmat.hidayat@ipwija.ac.id', prodi_id: 1, jabatan: 'Lektor Kepala', telepon: '0812-1000-0002', status: 'aktif' }
]},

mahasiswa: {
tipe: [_ID,
_tipe('nim', 'text', '', 'nomor induk mahasiswa', '1'),
_tipe('nama', 'text', '', 'nama lengkap', '1'),
_tipe('angkatan', 'text', '', 'mis. 2024', '1'),
_tipe('prodi_id', 'option', _ids(2), '1 IF, 2 SI', '1'),
_tipe('program', 'option', 'Reguler Pagi,Reguler Malam', '', '1'),
_tipe('status', 'option', 'aktif,cuti,lulus,berhenti', '', '1'),
_tipe('dosen_pa_id', 'option', _ids(2), 'dosen pembimbing akademik', '0'),
_tipe('email', 'text', '', '', '0'),
_tipe('telepon', 'text', '', '', '0')],
data: [
_mhs(1, '24101001', 'Ahmad Fauzi', 2024, 'Reguler Pagi', 1),
_mhs(2, '24101002', 'Bagus Setiawan', 2024, 'Reguler Pagi', 2)
]},

matakuliah: {
tipe: [_ID,
_tipe('kode', 'text', '', 'kode mata kuliah', '1'),
_tipe('nama', 'text', '', '', '1'),
_tipe('sks', 'text', '', 'jumlah SKS', '1'),
_tipe('semester', 'text', '', 'semester kurikulum', '0'),
_tipe('prodi_id', 'option', _ids(2), '1 IF, 2 SI', '1'),
_tipe('jenis', 'option', ',wajib,pilihan', '', '0'),
_tipe('metode', 'text', '', 'metode pembelajaran, mis. Case Method', '0')],
data: [
{ id: 1, kode: 'IMP403', nama: 'Robotika', sks: 3, semester: 5, prodi_id: 1, jenis: 'pilihan', metode: 'Case Method' },
{ id: 2, kode: 'IMC806', nama: 'Simulasi & Pemodelan', sks: 3, semester: 7, prodi_id: 1, jenis: 'wajib', metode: 'Case Method' }
]},

ruangan: {
tipe: [_ID,
_tipe('kode', 'text', '', 'kode ruang', '1'),
_tipe('nama', 'text', '', '', '1'),
_tipe('gedung', 'text', '', '', '0'),
_tipe('kapasitas', 'text', '', 'jumlah kursi', '0'),
_tipe('jenis', 'option', 'Kelas,Laboratorium,Aula', '', '0')],
data: [
{ id: 1, kode: '3G', nama: 'Ruang 3G', gedung: 'Gedung 3', kapasitas: 40, jenis: 'Kelas' },
{ id: 2, kode: '3H', nama: 'Ruang 3H', gedung: 'Gedung 3', kapasitas: 40, jenis: 'Kelas' }
]},

// Kelas kuliah periode 2026 Ganjil (Prodi Pengampu S1 - Informatika, Kurikulum 2022).
// "idkelas" = ID asli di Sevima. "kode" = Nama Kelas di Sevima. IP = Reguler Pagi.
// Detail lengkap (sistem kuliah, tanggal, metode pengajaran, frekuensi) hanya diketahui untuk kelas 6760 (IP231).
// peserta = jumlah baris krs untuk kelas tersebut.
kelas: {
tipe: [_ID,
_tipe('idkelas', 'text', '', 'ID kelas Sevima', '1'),
_tipe('idjadwal', 'text', '', 'ID jadwal Sevima (kosong = belum dijadwalkan)', '0'),
_tipe('kurikulum', 'text', '', 'tahun kurikulum, mis. 2022', '0'),
_tipe('kode', 'text', '', 'nama kelas, mis. IP241', '1'),
_tipe('matakuliah_id', 'option', _ids(2), 'id mata kuliah (lihat tabel matakuliah)', '1'),
_tipe('periode_id', 'option', _ids(2), '2 = 2026 Ganjil', '1'),
_tipe('dosen_id', 'option', _ids(2), 'dosen pengajar', '1'),
_tipe('ruangan_id', 'option', '0,' + _ids(2), '0 belum ditentukan, 1 3G, 2 3H', '0'),
_tipe('hari', 'option', ',Senin,Selasa,Rabu,Kamis,Jumat,Sabtu', '', '0'),
_tipe('jam_mulai', 'text', '', 'HH:MM', '0'),
_tipe('jam_selesai', 'text', '', 'HH:MM', '0'),
_tipe('program', 'option', 'Reguler Pagi,Reguler Malam,Kelas Karyawan,Lainnya', '', '1'),
_tipe('kapasitas', 'text', '', 'daya tampung', '0'),
_tipe('peserta', 'text', '', 'jumlah peserta kelas', '0'),
_tipe('nilai_dikunci', 'option', 'Tidak Dikunci,Dikunci', '', '0'),
_tipe('pjmk', 'option', 'ya,tidak', 'penanggung jawab mata kuliah', '0'),
_tipe('jumlah_pertemuan', 'text', '', '', '0'),
_tipe('sistem_kuliah', 'option', 'KELAS REGULER,KELAS KARYAWAN A,KELAS KARYAWAN B,KELAS A,KELAS B', '', '0'),
_tipe('tgl_mulai', 'text', '', 'YYYY-MM-DD', '0'),
_tipe('tgl_selesai', 'text', '', 'YYYY-MM-DD', '0'),
_tipe('kampus_berdampak', 'option', 'ya,tidak', '', '0'),
_tipe('metode_pengajaran', 'option', 'Dosen Tunggal,Team Teaching', '', '0'),
_tipe('frekuensi', 'text', '', 'frekuensi jadwal, mis. Setiap Minggu', '0')],
data: [
{ id: 1, idkelas: '6548', idjadwal: '53882', kurikulum: 2022, kode: 'IP241', matakuliah_id: 1, periode_id: 2, dosen_id: 1, ruangan_id: 1, hari: 'Kamis', jam_mulai: '08:00', jam_selesai: '10:30', program: 'Reguler Pagi', kapasitas: 50, peserta: 2, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 8, sistem_kuliah: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', metode_pengajaran: '', frekuensi: '' },
{ id: 2, idkelas: '6760', idjadwal: '53925', kurikulum: 2022, kode: 'IP231', matakuliah_id: 2, periode_id: 2, dosen_id: 1, ruangan_id: 2, hari: 'Kamis', jam_mulai: '10:30', jam_selesai: '13:00', program: 'Reguler Pagi', kapasitas: 50, peserta: 0, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 16, sistem_kuliah: 'KELAS REGULER', tgl_mulai: '2026-09-14', tgl_selesai: '2027-02-27', kampus_berdampak: 'tidak', metode_pengajaran: 'Dosen Tunggal', frekuensi: 'Setiap Minggu' }
]},

// KRS = peserta kelas (mahasiswa yang mengambil kelas pada periode)
krs: {
tipe: [_ID,
_tipe('periode_id', 'option', _ids(2), '', '1'),
_tipe('mahasiswa_id', 'option', _ids(2), 'mahasiswa', '1'),
_tipe('kelas_id', 'option', _ids(2), 'kelas kuliah', '1'),
_tipe('status', 'option', 'diajukan,disetujui,ditolak', '', '1')],
data: [
{ id: 1, periode_id: 2, mahasiswa_id: 1, kelas_id: 1, status: 'disetujui' },
{ id: 2, periode_id: 2, mahasiswa_id: 2, kelas_id: 1, status: 'disetujui' }
]},

// Satu sesi per kelas (Kamis, 1 Okt 2026). presensi_dosen: 0 = belum, 1 = sudah dipresensi.
pertemuan: {
tipe: [_ID,
_tipe('kelas_id', 'option', _ids(2), 'kelas (id kelas di tabel kelas)', '1'),
_tipe('ke', 'text', '', 'Sesi (pertemuan ke-)', '1'),
_tipe('tanggal', 'text', '', 'Tanggal Jadwal, YYYY-MM-DD', '1'),
_tipe('jam_mulai', 'text', '', 'Waktu Mulai, HH:MM', '1'),
_tipe('jam_selesai', 'text', '', 'Waktu Selesai, HH:MM', '1'),
_tipe('jenis', 'option', 'Kuliah,Praktikum', 'Jenis Pertemuan', '0'),
_tipe('kelompok', 'text', '', 'Kelompok (kosong = semua)', '0'),
_tipe('status', 'option', 'terjadwal,dimulai,berlangsung,selesai', 'Status sesi', '0'),
_tipe('metode', 'option', 'Offline,Online', 'Metode Pembelajaran', '0'),
_tipe('ruangan_id', 'option', '0,' + _ids(2), 'Ruang Kuliah: 0 belum ditentukan, 1 3G, 2 3H', '1'),
_tipe('ket_ruang', 'text', '', 'Keterangan Ruang Kuliah', '0'),
_tipe('url_online', 'text', '', 'URL Kuliah Online', '0'),
_tipe('sks', 'text', '', 'SKS', '0'),
_tipe('dosen_id', 'option', _ids(2), 'Dosen Pengajar (1 = WAWAN SISMADI)', '0'),
_tipe('dosen_pengganti', 'option', 'tidak,ya', 'Dosen Pengganti', '0'),
_tipe('materi', 'textarea', '', 'Rencana Materi (1000 karakter pertama dilaporkan ke Neofeeder)', '0'),
_tipe('realisasi', 'textarea', '', 'Realisasi Materi (diisi dosen)', '0'),
_tipe('dokumen_presensi', 'text', '', 'Dokumen Presensi (nama berkas pdf/jpg, maks 2 MB)', '0'),
_tipe('dokumen_jurnal', 'text', '', 'Dokumen Jurnal (nama berkas pdf/jpg, maks 2 MB)', '0'),
_tipe('presensi_dosen', 'option', '0,1', '0 belum, 1 sudah', '0')],
data: _pertemuan()},

// Presensi mahasiswa: H hadir, I izin, S sakit, A alpha.
presensi: {
tipe: [_ID,
_tipe('pertemuan_id', 'option', _ids(2), 'pertemuan (1 Robotika sesi 1, 2 Simulasi sesi 1)', '1'),
_tipe('mahasiswa_id', 'option', _ids(2), '', '1'),
_tipe('status', 'option', 'H,I,S,A', 'H hadir, I izin, S sakit, A alpha', '1')],
data: [
{ id: 1, pertemuan_id: 1, mahasiswa_id: 1, status: 'H' },
{ id: 2, pertemuan_id: 1, mahasiswa_id: 2, status: 'I' }
]},

// Komponen penilaian per kelas.
nilai: {
tipe: [_ID,
_tipe('kelas_id', 'option', _ids(2), '', '1'),
_tipe('komponen', 'option', 'Tugas,UTS,UAS,Kehadiran', '', '1'),
_tipe('bobot', 'text', '', 'persen', '1'),
_tipe('status', 'option', 'belum dibuka,belum dikunci,dikunci', '', '1')],
data: [
{ id: 1, kelas_id: 1, komponen: 'Tugas', bobot: 30, status: 'belum dikunci' },
{ id: 2, kelas_id: 1, komponen: 'UTS', bobot: 30, status: 'belum dikunci' }
]},

// Pengajuan proposal Tugas Akhir mahasiswa bimbingan
bimbingan: {
tipe: [_ID,
_tipe('mahasiswa_id', 'option', _ids(2), 'mahasiswa', '1'),
_tipe('judul', 'textarea', '', 'judul proposal', '1'),
_tipe('dosen_id', 'option', _ids(2), 'pembimbing', '1'),
_tipe('tahap', 'option', 'Proposal,Tugas Akhir', '', '1'),
_tipe('status', 'option', 'diajukan,revisi,disetujui,ditolak', '', '1'),
_tipe('tanggal', 'text', '', 'YYYY-MM-DD', '0')],
data: [
{ id: 1, mahasiswa_id: 1, judul: 'Sistem Deteksi Objek Real-Time pada Robot Mobile Menggunakan YOLO', dosen_id: 1, tahap: 'Proposal', status: 'diajukan', tanggal: '2026-09-21' },
{ id: 2, mahasiswa_id: 2, judul: 'Rancang Bangun Sistem Presensi Berbasis Pengenalan Wajah', dosen_id: 1, tahap: 'Proposal', status: 'revisi', tanggal: '2026-09-22' }
]},

konsultasi: {
tipe: [_ID,
_tipe('mahasiswa_id', 'option', _ids(2), '', '1'),
_tipe('dosen_id', 'option', _ids(2), '', '1'),
_tipe('tanggal', 'text', '', 'YYYY-MM-DD', '1'),
_tipe('topik', 'text', '', '', '1'),
_tipe('catatan', 'textarea', '', 'ringkasan hasil konsultasi', '0'),
_tipe('status', 'option', 'menunggu,dibalas,selesai', '', '1')],
data: [
{ id: 1, mahasiswa_id: 1, dosen_id: 1, tanggal: '2026-10-28', topik: 'Latar belakang dan rumusan masalah proposal', catatan: 'Rumusan masalah dipersempit pada deteksi objek bergerak.', status: 'selesai' },
{ id: 2, mahasiswa_id: 2, dosen_id: 2, tanggal: '2026-11-09', topik: 'Konsultasi KRS semester genap', catatan: '', status: 'menunggu' }
]},

// Informasi Terbaru (id mengikuti ID berita di Sevima)
berita: {
tipe: [_ID,
_tipe('judul', 'text', '', '', '1'),
_tipe('penulis', 'text', '', '', '1'),
_tipe('waktu', 'text', '', 'YYYY-MM-DD HH:MM:SS', '1'),
_tipe('isi', 'textarea', '', 'isi pengumuman', '0'),
_tipe('lampiran', 'text', '', 'nama berkas pendukung (opsional)', '0')],
data: [
{ id: 21, judul: 'PENGUMUMAN UTS D3, S1 dan S2 SEMESTER GANJIL TAHUN AKADEMIK 2026_2027', penulis: 'FITRIA', waktu: '2026-11-13 14:25:15', isi: 'Ujian Tengah Semester (UTS) program D3, S1 dan S2 Semester Ganjil Tahun Akademik 2026/2027 dilaksanakan pada 23 November - 4 Desember 2026. Dosen diharapkan mengunggah soal dan mengunci nilai tugas sebelum pelaksanaan ujian.', lampiran: 'jadwal-uts-ganjil-2026.pdf' },
{ id: 17, judul: 'KALENDER AKADEMIK SEMESTER GANJIL 2026', penulis: 'FITRIA', waktu: '2026-09-04 15:36:09', isi: 'Kalender akademik Semester Ganjil 2026/2027 telah ditetapkan. Silakan unduh lampiran dan perhatikan tanggal penting perkuliahan, ujian, serta batas pengisian nilai.', lampiran: 'kalender-akademik-ganjil-2026.pdf' }
]},

kalender: {
tipe: [_ID,
_tipe('periode_id', 'option', _ids(2), '', '1'),
_tipe('kegiatan', 'text', '', '', '1'),
_tipe('tgl_mulai', 'text', '', 'YYYY-MM-DD', '1'),
_tipe('tgl_selesai', 'text', '', 'YYYY-MM-DD', '1'),
_tipe('kategori', 'option', 'administrasi,akademik,ujian,libur', '', '1')],
data: [
{ id: 1, periode_id: 2, kegiatan: 'Pengisian KRS', tgl_mulai: '2026-08-24', tgl_selesai: '2026-09-18', kategori: 'administrasi' },
{ id: 2, periode_id: 2, kegiatan: 'Ujian Tengah Semester (UTS)', tgl_mulai: '2026-11-23', tgl_selesai: '2026-12-04', kategori: 'ujian' }
]},

notifikasi: {
tipe: [_ID,
_tipe('dosen_id', 'option', _ids(2), 'penerima', '1'),
_tipe('tipe', 'option', 'info,sukses,peringatan', '', '1'),
_tipe('judul', 'text', '', '', '1'),
_tipe('isi', 'textarea', '', '', '0'),
_tipe('waktu', 'text', '', 'YYYY-MM-DD HH:MM', '1'),
_tipe('dibaca', 'option', '0,1', '0 belum, 1 sudah', '0')],
data: [
{ id: 1, dosen_id: 1, tipe: 'peringatan', judul: 'Presensi mahasiswa belum dilakukan', isi: 'Terdapat pertemuan pada 2 kelas yang belum dilakukan presensi.', waktu: '2026-11-24 07:30', dibaca: 0 },
{ id: 2, dosen_id: 1, tipe: 'info', judul: 'Pengumuman baru dari Akademik', isi: 'PENGUMUMAN UTS D3, S1 dan S2 Semester Ganjil Tahun Akademik 2026_2027.', waktu: '2026-11-13 14:25', dibaca: 1 }
]}

};

// modul per tabel agar bisa dirouting: ?mahasiswa/view/1, ?kelas/view/1, dst.
Object.keys(dataset).forEach(function(k){
window[k]={controller:{view:function(){
modul=k;
if(typeof activeTab!=='undefined'){activeTab=k.charAt(0).toUpperCase()+k.slice(1);}
d.service.menu(k);
}}};
});

// Versi data. Bila berubah, salinan lama di localStorage ('dataset') dibuang agar data baru terbaca (perubahan manual di Master ikut hilang).
(function () {
  var V = '2026-11-25.1';
  try { if (window.localStorage.getItem('dataset_ver') !== V) { window.localStorage.removeItem('dataset'); window.localStorage.setItem('dataset_ver', V); } } catch (e) {}
})();
