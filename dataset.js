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
//   kelas <- nilai (komponen penilaian) <- skor (skor per peserta; krs + komponen)
//   matakuliah <- rps (rencana pembelajaran semester)
//   kelas <- tugas (tugas kuliah; jumlah pengumpul tersimpan)
//   kelas <- kontrak (kontrak kuliah, satu per kelas)
//   pertemuan + mahasiswa <- kesan (kesan perkuliahan per sesi)
//   kelas + ruangan <- ujian <- pengawas (<- dosen)
//   kelas + dosen <- pengajar (tim pengajar kelas; kelas.dosen_id dan kelas.pjmk masih dipakai halaman lain = sumber ganda)
//   periode <- forum (arsip forum kelas lama; kode, mata kuliah, kelas berupa teks)
//   mahasiswa + periode <- berhenti (pengajuan berhenti studi; prodi dan status akademik dibaca dari mahasiswa)
//   periode <- kuesioner (pertanyaan); kelas + mahasiswa <- responden (pengisi kuesioner)
//   mahasiswa + dosen <- bimbingan (proposal TA; jenis_ta, topik; status diajukan tampil "Aktif" di halaman pta.js)
//   mahasiswa + periode + dosen (pembimbing, penguji) <- tugasakhir (daftar tugas akhir; bimbingan_id = proposal asal, 0 = tidak ada)
//   periode <- kegiatan (kegiatan pendukung: KKN, PKL, PKM, dst.; unit dan instansi berupa teks, bukan kunci asing)
//   periode + mahasiswa + dosen <- perwalian (pembimbing akademik per periode; SKS, Total SKS, status KRS dihitung dari krs)
//   periode + mahasiswa + dosen <- konsultasi <- percakapan (pesan)
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
_tipe('zona_waktu', 'text', '', '', '0'),
_tipe('no_sk', 'text', '', 'No. SK izin perguruan tinggi (kop surat)', '0'),
_tipe('alamat', 'text', '', 'alamat kop surat', '0'),
_tipe('telepon', 'text', '', '', '0'),
_tipe('email', 'text', '', '', '0'),
_tipe('website', 'text', '', '', '0')],
data: [
{ id: 1, aplikasi: 'SIM Akademik', universitas: 'Universitas IPWIJA', kode_klien: '041145', domain: 'siakad.ipwija.ac.id', penyedia: 'SEVIMA', tahun: 2026, bahasa: 'id', zona_waktu: 'Asia/Jakarta', no_sk: 'SK Kemendikbudristek RI No. 627/E/O/2022', alamat: 'Gunung Putri, Bogor', telepon: '', email: 'contact@ipwija.ac.id', website: 'https://ipwija.ac.id' }
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
_tipe('kelas_mahasiswa', 'option', ',Kelas A,Kelas B,Kelas C,Kelas D,Kelas E,Kelas F,Kelas G', 'kelompok kelas mahasiswa', '0'),
_tipe('tgl_mulai', 'text', '', 'YYYY-MM-DD', '0'),
_tipe('tgl_selesai', 'text', '', 'YYYY-MM-DD', '0'),
_tipe('kampus_berdampak', 'option', 'ya,tidak', '', '0'),
_tipe('tgl_tutup', 'text', '', 'Tgl. Tutup Pendaftaran (Kampus Berdampak), YYYY-MM-DD', '0'),
_tipe('metode_pengajaran', 'option', 'Dosen Tunggal,Team Teaching', '', '0'),
_tipe('frekuensi', 'text', '', 'frekuensi jadwal, mis. Setiap Minggu', '0')],
data: [
{ id: 1, idkelas: '6548', idjadwal: '53882', kurikulum: 2022, kode: 'IP241', matakuliah_id: 1, periode_id: 2, dosen_id: 1, ruangan_id: 1, hari: 'Kamis', jam_mulai: '08:00', jam_selesai: '10:30', program: 'Reguler Pagi', kapasitas: 50, peserta: 2, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 8, sistem_kuliah: '', kelas_mahasiswa: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', tgl_tutup: '', metode_pengajaran: '', frekuensi: '' },
{ id: 2, idkelas: '6760', idjadwal: '53925', kurikulum: 2022, kode: 'IP231', matakuliah_id: 2, periode_id: 2, dosen_id: 1, ruangan_id: 2, hari: 'Kamis', jam_mulai: '10:30', jam_selesai: '13:00', program: 'Reguler Pagi', kapasitas: 50, peserta: 0, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 16, sistem_kuliah: 'KELAS REGULER', kelas_mahasiswa: '', tgl_mulai: '2026-09-14', tgl_selesai: '2027-02-27', kampus_berdampak: 'tidak', tgl_tutup: '', metode_pengajaran: 'Dosen Tunggal', frekuensi: 'Setiap Minggu' }
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

// Komponen penilaian per kelas (komposisi nilai; bobot kelas IP231 di SEVIMA 35/20/35/10).
// Pengecualian aturan 2 record: 4 record = satu kelas dengan 4 komponen.
nilai: {
tipe: [_ID,
_tipe('kelas_id', 'option', _ids(2), '', '1'),
_tipe('komponen', 'option', 'Tugas,UTS,UAS,Kehadiran', '', '1'),
_tipe('bobot', 'text', '', 'persen', '1'),
_tipe('status', 'option', 'belum dibuka,belum dikunci,dikunci', '', '1')],
data: [
{ id: 1, kelas_id: 1, komponen: 'Tugas', bobot: 35, status: 'belum dikunci' },
{ id: 2, kelas_id: 1, komponen: 'UTS', bobot: 20, status: 'belum dikunci' },
{ id: 3, kelas_id: 1, komponen: 'UAS', bobot: 35, status: 'belum dikunci' },
{ id: 4, kelas_id: 1, komponen: 'Kehadiran', bobot: 10, status: 'belum dikunci' }
]},

// Skor per peserta per komponen (data contoh/dummy). nilai kosong = belum ada skor.
// Hadir %, nilai akhir, grade, lulus, dan keterangan dihitung di dkelas.model, tidak disimpan.
skor: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. Tugas - 24101001', '1'),
_tipe('krs_id', 'option', _ids(2), 'krs (peserta kelas)', '1'),
_tipe('komponen_id', 'option', _ids(4), 'komponen (id di tabel nilai)', '1'),
_tipe('nilai', 'text', '', '0-100; kosong = belum ada', '0'),
_tipe('status', 'option', 'belum,terisi,dikunci', '', '1'),
_tipe('keterangan', 'text', '', '', '0')],
data: [
{ id: 1, nama: 'Tugas - 24101001', krs_id: 1, komponen_id: 1, nilai: 85, status: 'terisi', keterangan: '' },
{ id: 2, nama: 'UTS - 24101001', krs_id: 1, komponen_id: 2, nilai: 70, status: 'terisi', keterangan: '' }
]},

// RPS per mata kuliah (SEVIMA view_rps). Record 1 sengaja kosong seperti di SEVIMA (IMC806 / IP231).
rps: {
tipe: [_ID,
_tipe('nama', 'text', '', 'judul RPS', '1'),
_tipe('matakuliah_id', 'option', _ids(2), 'mata kuliah pemilik RPS', '1'),
_tipe('tujuan', 'textarea', '', 'Tujuan Instruksional Umum', '0'),
_tipe('bahan_ajar', 'textarea', '', 'Bahan Ajar', '0'),
_tipe('dokumen', 'text', '', 'Dokumen RPS (nama berkas pdf)', '0'),
_tipe('status', 'option', 'belum diisi,diisi', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'RPS Simulasi & Pemodelan', matakuliah_id: 2, tujuan: '', bahan_ajar: '', dokumen: '', status: 'belum diisi', keterangan: '' },
{ id: 2, nama: 'RPS Robotika', matakuliah_id: 1, tujuan: 'Mahasiswa mampu merancang dan mensimulasikan sistem robot sederhana.', bahan_ajar: 'Kinematika robot; sensor dan aktuator; kendali dasar.', dokumen: 'rps-robotika.pdf', status: 'diisi', keterangan: '' }
]},

// Tugas Kuliah per kelas (SEVIMA list_forumkelas). Kelas 2 (IP231) tanpa tugas, seperti di SEVIMA. pengumpul = angka tersimpan (data contoh).
tugas: {
tipe: [_ID,
_tipe('nama', 'text', '', 'judul tugas', '1'),
_tipe('kelas_id', 'option', _ids(2), 'kelas (id kelas di tabel kelas)', '1'),
_tipe('waktu', 'text', '', 'Waktu, YYYY-MM-DD HH:MM', '1'),
_tipe('keterangan', 'textarea', '', 'Keterangan tugas', '0'),
_tipe('pertemuan_ke', 'text', '', 'Tugas Pertemuan Ke', '0'),
_tipe('awal', 'text', '', 'Awal Pengumpulan, YYYY-MM-DD HH:MM', '0'),
_tipe('akhir', 'text', '', 'Akhir Pengumpulan, YYYY-MM-DD HH:MM', '0'),
_tipe('pengumpul', 'text', '', 'Jumlah Pengumpul', '0'),
_tipe('status', 'option', 'dibuka,ditutup', '', '1')],
data: [
{ id: 1, nama: 'Tugas 1: Kinematika Robot', kelas_id: 1, waktu: '2026-10-02 09:00', keterangan: 'Kerjakan soal kinematika maju lengan robot 2 sendi.', pertemuan_ke: 1, awal: '2026-10-02 09:00', akhir: '2026-10-09 23:59', pengumpul: 2, status: 'ditutup' },
{ id: 2, nama: 'Tugas 2: Sensor dan Aktuator', kelas_id: 1, waktu: '2026-10-09 09:00', keterangan: 'Buat ringkasan sensor dan aktuator pada robot mobile.', pertemuan_ke: 2, awal: '2026-10-09 09:00', akhir: '2026-10-16 23:59', pengumpul: 1, status: 'dibuka' }
]},

// Kontrak Kuliah per kelas (SEVIMA data_kontrakkul). Kelas 2 (IP231) kosong seperti di SEVIMA. dokumen = nama berkas pdf (maks 2 MB), belum ada unggah nyata.
kontrak: {
tipe: [_ID,
_tipe('nama', 'text', '', 'judul kontrak', '1'),
_tipe('kelas_id', 'option', _ids(2), 'kelas (id kelas di tabel kelas)', '1'),
_tipe('isi', 'textarea', '', 'Isi Kontrak Kuliah', '0'),
_tipe('dokumen', 'text', '', 'Dokumen Kontrak Kuliah (nama berkas pdf, maks 2 MB)', '0'),
_tipe('status', 'option', 'belum diisi,diisi', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Kontrak Kuliah IP241', kelas_id: 1, isi: 'Kehadiran minimal 75%.\nTugas dikumpulkan sesuai batas waktu.\nKomposisi nilai: Tugas, UTS, UAS, Kehadiran.', dokumen: 'kontrak-ip241.pdf', status: 'diisi', keterangan: '' },
{ id: 2, nama: 'Kontrak Kuliah IP231', kelas_id: 2, isi: '', dokumen: '', status: 'belum diisi', keterangan: '' }
]},

// Kesan perkuliahan dari mahasiswa per sesi (SEVIMA list_kesanmhs); ditampilkan tanpa nama. Data contoh/dummy.
kesan: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. Kesan sesi 1 - 24101001', '1'),
_tipe('pertemuan_id', 'option', _ids(2), 'pertemuan (id di tabel pertemuan)', '1'),
_tipe('mahasiswa_id', 'option', _ids(2), 'mahasiswa', '1'),
_tipe('kesan', 'textarea', '', 'isi kesan mahasiswa', '0'),
_tipe('status', 'option', 'baru,dibaca', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Kesan sesi 1 - 24101001', pertemuan_id: 1, mahasiswa_id: 1, kesan: 'Materi pengantar jelas dan contoh robotnya menarik.', status: 'baru', keterangan: '' },
{ id: 2, nama: 'Kesan sesi 1 - 24101002', pertemuan_id: 1, mahasiswa_id: 2, kesan: 'Kontrak kuliah dijelaskan dengan baik.', status: 'baru', keterangan: '' }
]},

// Jadwal ujian per kelas (SEVIMA list_jadwalujian; jenis di SEVIMA baru terlihat UTS, UAS asumsi). ruangan_id: 0 belum ditentukan, 1 3G, 2 3H.
ujian: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. UTS IP241', '1'),
_tipe('kelas_id', 'option', _ids(2), 'kelas (id kelas di tabel kelas)', '1'),
_tipe('jenis', 'option', 'UTS,UAS', 'Jenis Ujian', '1'),
_tipe('kelompok', 'text', '', 'Kelompok', '1'),
_tipe('ruangan_id', 'option', '0,' + _ids(2), 'Ruang: 0 belum ditentukan, 1 3G, 2 3H', '1'),
_tipe('tanggal', 'text', '', 'Tanggal Ujian, YYYY-MM-DD', '1'),
_tipe('jam_mulai', 'text', '', 'Waktu Mulai, HH:MM', '1'),
_tipe('jam_selesai', 'text', '', 'Waktu Selesai, HH:MM', '1'),
_tipe('status', 'option', 'terjadwal,selesai', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'UTS IP241', kelas_id: 1, jenis: 'UTS', kelompok: '1', ruangan_id: 1, tanggal: '2026-11-30', jam_mulai: '07:00', jam_selesai: '08:30', status: 'terjadwal', keterangan: '' },
{ id: 2, nama: 'UTS IP231', kelas_id: 2, jenis: 'UTS', kelompok: '1', ruangan_id: 2, tanggal: '2026-12-01', jam_mulai: '10:00', jam_selesai: '11:30', status: 'terjadwal', keterangan: '' }
]},

// Dosen pengawas ujian (banyak per jadwal ujian).
pengawas: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. Pengawas UTS IP241', '1'),
_tipe('ujian_id', 'option', _ids(2), 'jadwal ujian (id di tabel ujian)', '1'),
_tipe('dosen_id', 'option', _ids(2), 'Dosen Pengawas', '1'),
_tipe('status', 'option', 'bertugas,selesai', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Pengawas UTS IP241', ujian_id: 1, dosen_id: 1, status: 'bertugas', keterangan: '' },
{ id: 2, nama: 'Pengawas UTS IP231', ujian_id: 2, dosen_id: 2, status: 'bertugas', keterangan: '' }
]},

// Pertanyaan kuesioner per periode (SEVIMA list_angketkelas). bentuk: Utama atau Open Question. Record 2 (periode 2025 Genap) sengaja bukan periode aktif, agar Open Question kelas periode aktif tampil kosong.
kuesioner: {
tipe: [_ID,
_tipe('nama', 'textarea', '', 'teks pertanyaan', '1'),
_tipe('periode_id', 'option', _ids(2), '1 = 2025 Genap, 2 = 2026 Ganjil', '1'),
_tipe('bentuk', 'option', 'Utama,Open Question', '', '1'),
_tipe('jenis', 'text', '', 'Jenis Kuesioner', '0'),
_tipe('urut', 'text', '', 'nomor urut', '0'),
_tipe('status', 'option', 'aktif,nonaktif', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Dosen menjelaskan materi dengan jelas.', periode_id: 2, bentuk: 'Utama', jenis: 'Kepuasan Perkuliahan', urut: 1, status: 'aktif', keterangan: '' },
{ id: 2, nama: 'Saran untuk perbaikan perkuliahan.', periode_id: 1, bentuk: 'Open Question', jenis: 'Kepuasan Perkuliahan', urut: 1, status: 'aktif', keterangan: '' }
]},

// Pengisi kuesioner kelas (data contoh/dummy). Jumlah Responden = baris berstatus selesai.
responden: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. Kuesioner IP241 - 24101001', '1'),
_tipe('kelas_id', 'option', _ids(2), 'kelas (id kelas di tabel kelas)', '1'),
_tipe('mahasiswa_id', 'option', _ids(2), 'mahasiswa', '1'),
_tipe('status', 'option', 'selesai,belum', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Kuesioner IP241 - 24101001', kelas_id: 1, mahasiswa_id: 1, status: 'selesai', keterangan: '' },
{ id: 2, nama: 'Kuesioner IP241 - 24101002', kelas_id: 1, mahasiswa_id: 2, status: 'belum', keterangan: '' }
]},

// Tim pengajar kelas (SEVIMA data_pengajar). Jadwal hari/jam dibaca dari kelas, tidak disimpan. pengganti_id: 0 = tidak ada.
pengajar: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. Pengajar IP231', '1'),
_tipe('kelas_id', 'option', _ids(2), 'kelas (id kelas di tabel kelas)', '1'),
_tipe('dosen_id', 'option', _ids(2), 'Dosen Pengajar', '1'),
_tipe('sks', 'text', '', 'SKS, mis. 3,00', '0'),
_tipe('pjmk', 'option', 'ya,tidak', 'Penanggung Jawab', '0'),
_tipe('kuesioner', 'option', 'ya,tidak', 'Isi Kuesioner', '0'),
_tipe('jadwal_aktif', 'option', 'ya,tidak', 'ikut jadwal mingguan kelas', '0'),
_tipe('sesi_awal', 'text', '', 'sesi awal', '0'),
_tipe('sesi_akhir', 'text', '', 'sesi akhir', '0'),
_tipe('pengganti_id', 'option', '0,' + _ids(2), 'Dosen Pengganti Pelaporan: 0 tidak ada', '0'),
_tipe('status', 'option', 'aktif,nonaktif', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Pengajar IP231', kelas_id: 2, dosen_id: 1, sks: '3,00', pjmk: 'ya', kuesioner: 'ya', jadwal_aktif: 'ya', sesi_awal: 1, sesi_akhir: 16, pengganti_id: 0, status: 'aktif', keterangan: '' },
{ id: 2, nama: 'Pengajar IP241', kelas_id: 1, dosen_id: 1, sks: '3,00', pjmk: 'ya', kuesioner: 'ya', jadwal_aktif: 'ya', sesi_awal: 1, sesi_akhir: 8, pengganti_id: 0, status: 'aktif', keterangan: '' }
]},

// Pengajuan berhenti studi (SEVIMA set_berhentistudi). Status Akademik dan Program Studi dibaca dari mahasiswa. Jenis pengajuan = asumsi (tampilan SEVIMA kosong).
berhenti: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. Berhenti studi 24101001', '1'),
_tipe('mahasiswa_id', 'option', _ids(2), 'mahasiswa', '1'),
_tipe('periode_id', 'option', _ids(2), '1 = 2025 Genap, 2 = 2026 Ganjil', '1'),
_tipe('jenis', 'option', 'Mengundurkan Diri,Dikeluarkan,Pindah', 'Jenis Pengajuan', '1'),
_tipe('status', 'option', 'proses validasi,disetujui,dibatalkan', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Berhenti studi 24101002', mahasiswa_id: 2, periode_id: 2, jenis: 'Mengundurkan Diri', status: 'proses validasi', keterangan: 'Pengajuan mengundurkan diri dengan alasan pekerjaan.' },
{ id: 2, nama: 'Berhenti studi 24101001', mahasiswa_id: 1, periode_id: 1, jenis: 'Pindah', status: 'disetujui', keterangan: '' }
]},

// Forum Kelas (Lama), arsip SEVIMA list_forum (periode 2025 Genap ke bawah). Kode, mk, kelas = teks arsip (bukan kunci asing); jumlah_post angka tersimpan.
forum: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. Forum IK231 - IMC804', '1'),
_tipe('periode_id', 'option', _ids(2), '1 = 2025 Genap, 2 = 2026 Ganjil', '1'),
_tipe('kode', 'text', '', 'kode mata kuliah', '1'),
_tipe('mk', 'text', '', 'nama mata kuliah', '1'),
_tipe('kelas', 'text', '', 'nama kelas', '1'),
_tipe('jumlah_post', 'text', '', 'jumlah post', '0'),
_tipe('post_terakhir', 'text', '', 'YYYY-MM-DD HH:MM:SS', '0'),
_tipe('status', 'option', 'arsip,aktif', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Forum IK231 - IMC804', periode_id: 1, kode: 'IMC804', mk: 'Wireless & Mobile Computing', kelas: 'IK231', jumlah_post: 16, post_terakhir: '2026-08-01 01:35:18', status: 'arsip', keterangan: '' },
{ id: 2, nama: 'Forum IP241 - IMP306', periode_id: 1, kode: 'IMP306', mk: 'Pemrogaman Web', kelas: 'IP241', jumlah_post: 16, post_terakhir: '2026-07-30 08:13:17', status: 'arsip', keterangan: '' }
]},

// Perwalian / Pembimbing Akademik per periode (SEVIMA list_mhspa, tabel akademik.ak_perwalian). SKS, Total SKS, KRS Diajukan?, KRS Disetujui? dihitung dari krs, tidak disimpan. Data contoh/dummy (di SEVIMA daftar dosen ini kosong).
perwalian: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. Perwalian 24101001 - 2026 Ganjil', '1'),
_tipe('periode_id', 'option', _ids(2), '1 = 2025 Genap, 2 = 2026 Ganjil', '1'),
_tipe('mahasiswa_id', 'option', _ids(2), 'mahasiswa', '1'),
_tipe('dosen_id', 'option', _ids(2), 'Pembimbing Akademik', '1'),
_tipe('sistem_kuliah', 'option', 'KELAS REGULER,KELAS KARYAWAN A,KELAS KARYAWAN B', '', '0'),
_tipe('status_smt', 'option', 'aktif,cuti,nonaktif', 'Status Semester', '1'),
_tipe('smt', 'text', '', 'semester ke-', '0'),
_tipe('batas_sks', 'text', '', 'Batas SKS', '0'),
_tipe('ips', 'text', '', 'mis. 3,40', '0'),
_tipe('ipk', 'text', '', 'IPK LULUS, mis. 3,35', '0'),
_tipe('point', 'text', '', 'Point Kmhs.', '0'),
_tipe('no_sk', 'text', '', 'No. SK', '0'),
_tipe('tgl_sk', 'text', '', 'Tgl. SK, YYYY-MM-DD', '0'),
_tipe('status', 'option', 'aktif,nonaktif', 'Status Data', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Perwalian 24101001 - 2026 Ganjil', periode_id: 2, mahasiswa_id: 1, dosen_id: 1, sistem_kuliah: 'KELAS REGULER', status_smt: 'aktif', smt: 5, batas_sks: 24, ips: '3,40', ipk: '3,35', point: 0, no_sk: '', tgl_sk: '', status: 'aktif', keterangan: '' },
{ id: 2, nama: 'Perwalian 24101002 - 2026 Ganjil', periode_id: 2, mahasiswa_id: 2, dosen_id: 1, sistem_kuliah: 'KELAS REGULER', status_smt: 'cuti', smt: 5, batas_sks: 21, ips: '3,10', ipk: '3,05', point: 0, no_sk: 'SK/041/2026', tgl_sk: '2026-09-10', status: 'aktif', keterangan: '' }
]},

// Pengajuan proposal Tugas Akhir mahasiswa bimbingan
bimbingan: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. Proposal TA 24101001', '1'),
_tipe('mahasiswa_id', 'option', _ids(2), 'mahasiswa', '1'),
_tipe('judul', 'textarea', '', 'judul proposal', '1'),
_tipe('topik', 'text', '', 'Topik', '0'),
_tipe('jenis_ta', 'option', 'Tugas Akhir,Skripsi,Tesis', 'Jenis TA', '1'),
_tipe('dosen_id', 'option', _ids(2), 'pembimbing', '1'),
_tipe('tahap', 'option', 'Proposal,Tugas Akhir', '', '1'),
_tipe('status', 'option', 'diajukan,revisi,disetujui,ditolak', 'diajukan tampil "Aktif"', '1'),
_tipe('tanggal', 'text', '', 'Tgl. Pengajuan, YYYY-MM-DD', '0'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Proposal TA 24101001', mahasiswa_id: 1, judul: 'Sistem Deteksi Objek Real-Time pada Robot Mobile Menggunakan YOLO', topik: 'Computer Vision', jenis_ta: 'Tugas Akhir', dosen_id: 1, tahap: 'Proposal', status: 'diajukan', tanggal: '2026-09-21', keterangan: '' },
{ id: 2, nama: 'Proposal TA 24101002', mahasiswa_id: 2, judul: 'Rancang Bangun Sistem Presensi Berbasis Pengenalan Wajah', topik: 'Sistem Informasi', jenis_ta: 'Tugas Akhir', dosen_id: 1, tahap: 'Proposal', status: 'revisi', tanggal: '2026-09-22', keterangan: 'Latar belakang perlu dipertajam.' }
]},

// Daftar Tugas Akhir (SEVIMA list_ta). Program Studi dan Periode Masuk dibaca dari mahasiswa. Dosen 0 = belum ada. Isi pilihan tahap = asumsi (HTML SEVIMA belum memuatnya). Data contoh/dummy.
tugasakhir: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. TA 24101001', '1'),
_tipe('mahasiswa_id', 'option', _ids(2), 'mahasiswa', '1'),
_tipe('periode_id', 'option', _ids(2), 'Periode Mulai: 1 = 2025 Genap, 2 = 2026 Ganjil', '1'),
_tipe('bimbingan_id', 'option', '0,' + _ids(2), 'proposal asal (tabel bimbingan), 0 tidak ada', '0'),
_tipe('judul', 'textarea', '', 'Judul Tugas Akhir', '1'),
_tipe('pembimbing1_id', 'option', '0,' + _ids(2), 'Dosen Pembimbing 1, 0 belum ada', '0'),
_tipe('pembimbing2_id', 'option', '0,' + _ids(2), 'Dosen Pembimbing 2, 0 belum ada', '0'),
_tipe('penguji1_id', 'option', '0,' + _ids(2), 'Dosen Penguji 1, 0 belum ada', '0'),
_tipe('penguji2_id', 'option', '0,' + _ids(2), 'Dosen Penguji 2, 0 belum ada', '0'),
_tipe('tahap', 'option', 'Pengajuan Proposal,Seminar Proposal,Penelitian,Sidang Akhir', 'Tahap Tugas Akhir', '1'),
_tipe('tgl_sidang', 'text', '', 'Jadwal sidang, YYYY-MM-DD (kosong = belum dijadwalkan)', '0'),
_tipe('nilai', 'text', '', 'nilai akhir (kosong = belum terisi)', '0'),
_tipe('nilai_dikunci', 'option', 'tidak,ya', '', '0'),
_tipe('status', 'option', 'aktif,selesai,tidak aktif', 'Status Tugas Akhir', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'TA 24101001', mahasiswa_id: 1, periode_id: 2, bimbingan_id: 1, judul: 'Sistem Deteksi Objek Real-Time pada Robot Mobile Menggunakan YOLO', pembimbing1_id: 1, pembimbing2_id: 2, penguji1_id: 2, penguji2_id: 0, tahap: 'Penelitian', tgl_sidang: '', nilai: '', nilai_dikunci: 'tidak', status: 'aktif', keterangan: '' },
{ id: 2, nama: 'TA 24101002', mahasiswa_id: 2, periode_id: 1, bimbingan_id: 2, judul: 'Rancang Bangun Sistem Presensi Berbasis Pengenalan Wajah', pembimbing1_id: 1, pembimbing2_id: 0, penguji1_id: 2, penguji2_id: 0, tahap: 'Sidang Akhir', tgl_sidang: '2026-07-20', nilai: 85, nilai_dikunci: 'ya', status: 'selesai', keterangan: '' }
]},

// Kegiatan Pendukung (SEVIMA list_kkn / data_kkn). Unit dan instansi disimpan sebagai teks (SEVIMA menyimpan instansi baru secara bebas). Data contoh/dummy (di SEVIMA daftar dosen ini kosong).
kegiatan: {
tipe: [_ID,
_tipe('nama', 'text', '', 'Nama Kegiatan (maks. 500 karakter)', '1'),
_tipe('nama_en', 'text', '', 'Nama Kegiatan (EN)', '0'),
_tipe('periode_id', 'option', _ids(2), 'Periode Akademik: 1 = 2025 Genap, 2 = 2026 Ganjil', '1'),
_tipe('jenis', 'option', 'Kuliah Kerja Nyata,Kerja Praktek/PKL,Program kreativitas mahasiswa,Kompetisi,Aktivitas kemahasiswaan', 'Jenis Kegiatan', '1'),
_tipe('kelompok', 'text', '', 'Kelompok', '0'),
_tipe('unit', 'text', '', 'Unit', '0'),
_tipe('instansi', 'text', '', 'Nama Instansi', '1'),
_tipe('alamat_instansi', 'text', '', 'Alamat Instansi', '1'),
_tipe('tgl_mulai', 'text', '', 'Tanggal Mulai, YYYY-MM-DD', '0'),
_tipe('tgl_selesai', 'text', '', 'Tanggal Selesai, YYYY-MM-DD', '0'),
_tipe('no_sk', 'text', '', 'Nomor SK', '0'),
_tipe('tgl_sk', 'text', '', 'Tanggal SK, YYYY-MM-DD', '0'),
_tipe('status', 'option', 'aktif,selesai', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'KKN Tematik Desa Cibadak 2026', nama_en: 'Thematic Community Service Cibadak 2026', periode_id: 2, jenis: 'Kuliah Kerja Nyata', kelompok: 'Kelompok 1', unit: 'Universitas IPWIJA', instansi: 'Desa Cibadak', alamat_instansi: 'Cibadak, Sukabumi, Jawa Barat', tgl_mulai: '2026-10-05', tgl_selesai: '2026-11-20', no_sk: 'SK/KKN/041/2026', tgl_sk: '2026-09-15', status: 'aktif', keterangan: '' },
{ id: 2, nama: 'PKL Pengembangan Aplikasi Web', nama_en: 'Web Application Development Internship', periode_id: 1, jenis: 'Kerja Praktek/PKL', kelompok: 'Kelompok 2', unit: 'Universitas IPWIJA', instansi: 'PT Contoh Teknologi Nusantara', alamat_instansi: 'Jakarta Selatan', tgl_mulai: '2026-03-16', tgl_selesai: '2026-06-12', no_sk: '', tgl_sk: '', status: 'selesai', keterangan: '' }
]},

konsultasi: {
tipe: [_ID,
_tipe('periode_id', 'option', _ids(2), '1 = 2025 Genap, 2 = 2026 Ganjil', '1'),
_tipe('mahasiswa_id', 'option', _ids(2), '', '1'),
_tipe('dosen_id', 'option', _ids(2), '', '1'),
_tipe('tanggal', 'text', '', 'YYYY-MM-DD', '1'),
_tipe('topik', 'text', '', '', '1'),
_tipe('catatan', 'textarea', '', 'ringkasan hasil konsultasi', '0'),
_tipe('status', 'option', 'menunggu,dibalas,selesai', '', '1')],
data: [
{ id: 1, periode_id: 2, mahasiswa_id: 1, dosen_id: 1, tanggal: '2026-10-28', topik: 'Latar belakang dan rumusan masalah proposal', catatan: 'Rumusan masalah dipersempit pada deteksi objek bergerak.', status: 'selesai' },
{ id: 2, periode_id: 2, mahasiswa_id: 2, dosen_id: 2, tanggal: '2026-11-09', topik: 'Konsultasi KRS semester genap', catatan: '', status: 'menunggu' }
]},

// Percakapan konsultasi pembimbing (SEVIMA data_konsultasi: Pesan dan Cetak Percakapan). Post Terakhir di daftar dihitung dari waktu pesan terbaru.
percakapan: {
tipe: [_ID,
_tipe('nama', 'text', '', 'label, mis. Pesan konsultasi 1', '1'),
_tipe('konsultasi_id', 'option', _ids(2), 'konsultasi (id di tabel konsultasi)', '1'),
_tipe('pengirim', 'option', 'dosen,mahasiswa', '', '1'),
_tipe('isi', 'textarea', '', 'isi pesan', '1'),
_tipe('waktu', 'text', '', 'YYYY-MM-DD HH:MM:SS', '1'),
_tipe('status', 'option', 'terkirim,dibaca', '', '1'),
_tipe('keterangan', 'textarea', '', '', '0')],
data: [
{ id: 1, nama: 'Pesan konsultasi 1 - mahasiswa', konsultasi_id: 1, pengirim: 'mahasiswa', isi: 'Selamat pagi Pak, saya ingin berkonsultasi tentang latar belakang proposal.', waktu: '2026-10-28 09:00:00', status: 'dibaca', keterangan: '' },
{ id: 2, nama: 'Pesan konsultasi 1 - dosen', konsultasi_id: 1, pengirim: 'dosen', isi: 'Silakan, rumusan masalahnya dipersempit pada deteksi objek bergerak.', waktu: '2026-10-28 10:15:00', status: 'dibaca', keterangan: '' }
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
  var V = '2026-11-27.5';
  try { if (window.localStorage.getItem('dataset_ver') !== V) { window.localStorage.removeItem('dataset'); window.localStorage.setItem('dataset_ver', V); } } catch (e) {}
})();
