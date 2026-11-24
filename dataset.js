// dataset.js - SIAKAD (meniru SIM Akademik Sevima, Universitas IPWIJA, peran Dosen)
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

var _TGL = ['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22', '2026-10-29', '2026-11-05', '2026-11-12', '2026-11-19']; // 8 Kamis berturut-turut
var _MATERI = {
  1: ['Kontrak Kuliah dan Pengantar Robotika', 'Kinematika Robot Manipulator', 'Sensor dan Aktuator', 'Kontrol Motor DC dan Servo', 'Mikrokontroler dan Interfacing', 'Navigasi dan Pemetaan Robot Mobile', 'Review Materi dan Latihan Soal', 'Persiapan UTS dan Studi Kasus'],
  2: ['Kontrak Kuliah dan Pengantar Simulasi & Pemodelan', 'Konsep Sistem dan Model', 'Pembangkitan Bilangan Acak', 'Simulasi Monte Carlo', 'Simulasi Antrian', 'Simulasi Kejadian Diskrit', 'Validasi dan Verifikasi Model', 'Review dan Persiapan UTS'],
  3: ['Kontrak Kuliah dan Gambaran Computer Vision', 'Pembentukan dan Representasi Citra', 'Pengolahan Citra Dasar', 'Filtering dan Deteksi Tepi', 'Ekstraksi Fitur', 'Segmentasi Citra', 'Deteksi dan Klasifikasi Objek', 'Review dan Persiapan UTS'],
  4: ['Kontrak Kuliah dan Pengantar Pemrograman Berorientasi Objek', 'Class dan Object', 'Enkapsulasi', 'Inheritance', 'Polymorphism', 'Abstract Class dan Interface', 'Exception Handling', 'Review dan Persiapan UTS']
};
var _JAM = { 1: '08:00', 2: '10:30', 3: '13:30', 4: '17:00' };

var _SELESAI = { 1: '10:30', 2: '13:00', 3: '16:00', 4: '19:30' };   // jam selesai kelas (sama dengan jadwal mingguan)
var _RUANG = { 1: 2, 2: 3, 3: 1, 4: 4 };                                // ruangan_id per kelas: 3G, 3H, 3B, 3I
var _pertemuan = function () {
  var out = [], id = 1;
  [1, 2, 3, 4].forEach(function (k) {
    _TGL.forEach(function (t, i) {
      out.push({ id: id++, kelas_id: k, ke: i + 1, tanggal: t, jam_mulai: _JAM[k], jam_selesai: _SELESAI[k], jenis: 'Kuliah', kelompok: '', status: 'selesai', metode: 'Offline', ruangan_id: _RUANG[k], ket_ruang: '', url_online: '', sks: 3, dosen_id: 1, dosen_pengganti: 'tidak', materi: 'Pertemuan ' + (i + 1) + ': ' + _MATERI[k][i], realisasi: '', dokumen_presensi: '', dokumen_jurnal: '', presensi_dosen: 0 });
    });
  });
  // Data asli SEVIMA (kelas IP231 / 6760, jadwal 53925): Sesi 1 berstatus Dimulai dan realisasi materi sudah terisi; Sesi 6 berjenis Praktikum.
  var s1 = out.find(function (p) { return p.kelas_id === 2 && p.ke === 1; });
  s1.status = 'dimulai'; s1.realisasi = s1.materi;
  out.find(function (p) { return p.kelas_id === 2 && p.ke === 6; }).jenis = 'Praktikum';
  return out;
};

var _mhs = function (id, nim, nama, angkatan, program, pa) {
  return { id: id, nim: nim, nama: nama, angkatan: angkatan, prodi_id: 1, program: program, status: 'aktif', dosen_pa_id: pa, email: nim + '@mhs.ipwija.ac.id', telepon: '0812-2000-' + ('0000' + id).slice(-4) };
};

var _krs = function () {
  var peserta = { 1: [1, 8], 2: [9, 12], 3: [1, 8], 4: [13, 16], 5: [17, 20] }; // kelas_id: [mhs awal, mhs akhir]
  var out = [], id = 1;
  [1, 2, 3, 4, 5].forEach(function (k) {
    for (var m = peserta[k][0]; m <= peserta[k][1]; m++) { out.push({ id: id++, periode_id: 3, mahasiswa_id: m, kelas_id: k, status: 'disetujui' }); }
  });
  return out;
};

var _nilai = function () {
  var out = [], id = 1;
  [1, 2, 3, 4, 5].forEach(function (k) {
    out.push({ id: id++, kelas_id: k, komponen: 'Tugas', bobot: 30, status: 'belum dikunci' });
    out.push({ id: id++, kelas_id: k, komponen: 'UTS', bobot: 30, status: 'belum dikunci' });
    out.push({ id: id++, kelas_id: k, komponen: 'UAS', bobot: 30, status: 'belum dibuka' });
    out.push({ id: id++, kelas_id: k, komponen: 'Kehadiran', bobot: 10, status: 'belum dibuka' });
  });
  return out;
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
{ id: 1, kode: '20251', nama: '2025 Ganjil', tahun_akademik: '2025/2026', semester: 'Ganjil', tgl_mulai: '2025-09-01', tgl_selesai: '2026-02-27', status: 'selesai' },
{ id: 2, kode: '20252', nama: '2025 Genap', tahun_akademik: '2025/2026', semester: 'Genap', tgl_mulai: '2026-03-02', tgl_selesai: '2026-08-14', status: 'selesai' },
{ id: 3, kode: '20261', nama: '2026 Ganjil', tahun_akademik: '2026/2027', semester: 'Ganjil', tgl_mulai: '2026-09-01', tgl_selesai: '2027-02-26', status: 'aktif' }
]},

prodi: {
tipe: [_ID,
_tipe('kode', 'text', '', 'kode program studi', '1'),
_tipe('nama', 'text', '', 'nama program studi', '1'),
_tipe('jenjang', 'option', 'D3,S1,S2', '', '1'),
_tipe('fakultas', 'text', '', '', '0')],
data: [
{ id: 1, kode: 'IF', nama: 'Informatika', jenjang: 'S1', fakultas: 'Fakultas Teknologi Informasi' },
{ id: 2, kode: 'SI', nama: 'Sistem Informasi', jenjang: 'S1', fakultas: 'Fakultas Teknologi Informasi' },
{ id: 3, kode: 'MI', nama: 'Manajemen Informatika', jenjang: 'D3', fakultas: 'Fakultas Teknologi Informasi' },
{ id: 4, kode: 'MTI', nama: 'Magister Teknologi Informasi', jenjang: 'S2', fakultas: 'Pascasarjana' }
]},

dosen: {
tipe: [_ID,
_tipe('nidn', 'text', '', 'NIDN / kode referensi', '1'),
_tipe('nama', 'text', '', 'nama lengkap', '1'),
_tipe('email', 'text', '', 'email institusi', '1'),
_tipe('prodi_id', 'option', _ids(4), '1 IF, 2 SI, 3 MI, 4 MTI', '1'),
_tipe('jabatan', 'option', 'Asisten Ahli,Lektor,Lektor Kepala,Dosen Tetap', '', '0'),
_tipe('telepon', 'text', '', '', '0'),
_tipe('status', 'option', 'aktif,nonaktif', '', '0')],
data: [
{ id: 1, nidn: '0316087708', nama: 'WAWAN SISMADI', email: 'wawansismadi@ipwija.ac.id', prodi_id: 1, jabatan: 'Dosen Tetap', telepon: '0812-1000-0001', status: 'aktif' },
{ id: 2, nidn: '0305058201', nama: 'Dr. Rahmat Hidayat, M.Kom.', email: 'rahmat.hidayat@ipwija.ac.id', prodi_id: 1, jabatan: 'Lektor Kepala', telepon: '0812-1000-0002', status: 'aktif' },
{ id: 3, nidn: '0321078803', nama: 'Sari Wulandari, M.T.', email: 'sari.wulandari@ipwija.ac.id', prodi_id: 1, jabatan: 'Lektor', telepon: '0812-1000-0003', status: 'aktif' },
{ id: 4, nidn: '0312069005', nama: 'Andi Kurniawan, M.Cs.', email: 'andi.kurniawan@ipwija.ac.id', prodi_id: 2, jabatan: 'Asisten Ahli', telepon: '0812-1000-0004', status: 'aktif' }
]},

mahasiswa: {
tipe: [_ID,
_tipe('nim', 'text', '', 'nomor induk mahasiswa', '1'),
_tipe('nama', 'text', '', 'nama lengkap', '1'),
_tipe('angkatan', 'text', '', 'mis. 2024', '1'),
_tipe('prodi_id', 'option', _ids(4), '1 IF, 2 SI, 3 MI, 4 MTI', '1'),
_tipe('program', 'option', 'Reguler Pagi,Reguler Malam', '', '1'),
_tipe('status', 'option', 'aktif,cuti,lulus,berhenti', '', '1'),
_tipe('dosen_pa_id', 'option', _ids(4), 'dosen pembimbing akademik', '0'),
_tipe('email', 'text', '', '', '0'),
_tipe('telepon', 'text', '', '', '0')],
data: [
// angkatan 2024, Reguler Pagi (kelas IP241)
_mhs(1, '24101001', 'Ahmad Fauzi', 2024, 'Reguler Pagi', 1),
_mhs(2, '24101002', 'Bagus Setiawan', 2024, 'Reguler Pagi', 1),
_mhs(3, '24101003', 'Citra Maharani', 2024, 'Reguler Pagi', 2),
_mhs(4, '24101004', 'Dian Permata', 2024, 'Reguler Pagi', 2),
_mhs(5, '24101005', 'Eka Prasetyo', 2024, 'Reguler Pagi', 3),
_mhs(6, '24101006', 'Fajar Nugroho', 2024, 'Reguler Pagi', 3),
_mhs(7, '24101007', 'Gita Anjani', 2024, 'Reguler Pagi', 1),
_mhs(8, '24101008', 'Hendra Wijaya', 2024, 'Reguler Pagi', 1),
// angkatan 2023, Reguler Pagi (kelas IP231)
_mhs(9, '23101001', 'Indah Safitri', 2023, 'Reguler Pagi', 2),
_mhs(10, '23101002', 'Joko Susilo', 2023, 'Reguler Pagi', 2),
_mhs(11, '23101003', 'Kartika Dewi', 2023, 'Reguler Pagi', 3),
_mhs(12, '23101004', 'Lutfi Hakim', 2023, 'Reguler Pagi', 3),
// angkatan 2025, Reguler Malam (kelas IM251)
_mhs(13, '25102001', 'Maya Puspita', 2025, 'Reguler Malam', 3),
_mhs(14, '25102002', 'Nanda Aditya', 2025, 'Reguler Malam', 3),
_mhs(15, '25102003', 'Oki Ramadhan', 2025, 'Reguler Malam', 4),
_mhs(16, '25102004', 'Putri Handayani', 2025, 'Reguler Malam', 4),
// angkatan 2024, Reguler Malam (kelas IM241)
_mhs(17, '24102001', 'Qori Ananda', 2024, 'Reguler Malam', 4),
_mhs(18, '24102002', 'Rendi Saputra', 2024, 'Reguler Malam', 4),
_mhs(19, '24102003', 'Sinta Rahayu', 2024, 'Reguler Malam', 2),
_mhs(20, '24102004', 'Teguh Wibowo', 2024, 'Reguler Malam', 2),
// angkatan 2022 - mahasiswa bimbingan proposal TA (12 orang)
_mhs(21, '22101001', 'Umar Faruq', 2022, 'Reguler Pagi', 1),
_mhs(22, '22101002', 'Vina Oktaviani', 2022, 'Reguler Pagi', 1),
_mhs(23, '22101003', 'Wahyu Hidayat', 2022, 'Reguler Pagi', 1),
_mhs(24, '22101004', 'Yoga Pratama', 2022, 'Reguler Pagi', 1),
_mhs(25, '22101005', 'Zahra Amelia', 2022, 'Reguler Pagi', 1),
_mhs(26, '22101006', 'Arif Budiman', 2022, 'Reguler Pagi', 1),
_mhs(27, '22101007', 'Bella Safira', 2022, 'Reguler Pagi', 1),
_mhs(28, '22101008', 'Candra Kusuma', 2022, 'Reguler Pagi', 1),
_mhs(29, '22102001', 'Dwi Lestari', 2022, 'Reguler Malam', 1),
_mhs(30, '22102002', 'Edo Firmansyah', 2022, 'Reguler Malam', 1),
_mhs(31, '22102003', 'Farah Nabila', 2022, 'Reguler Malam', 1),
_mhs(32, '22102004', 'Galih Permana', 2022, 'Reguler Malam', 1)
]},

matakuliah: {
tipe: [_ID,
_tipe('kode', 'text', '', 'kode mata kuliah', '1'),
_tipe('nama', 'text', '', '', '1'),
_tipe('sks', 'text', '', 'jumlah SKS', '1'),
_tipe('semester', 'text', '', 'semester kurikulum', '0'),
_tipe('prodi_id', 'option', _ids(4), '1 IF, 2 SI, 3 MI, 4 MTI', '1'),
_tipe('jenis', 'option', ',wajib,pilihan', '', '0'),
_tipe('metode', 'text', '', 'metode pembelajaran, mis. Case Method', '0')],
data: [
{ id: 1, kode: 'IMP403', nama: 'Robotika', sks: 3, semester: 5, prodi_id: 1, jenis: 'pilihan', metode: 'Case Method' },
{ id: 2, kode: 'IMC806', nama: 'Simulasi & Pemodelan', sks: 3, semester: 7, prodi_id: 1, jenis: 'wajib', metode: 'Case Method' },
{ id: 3, kode: 'IMK103', nama: 'Computer Vision', sks: 3, semester: 5, prodi_id: 1, jenis: 'pilihan', metode: 'Case Method' },
{ id: 4, kode: 'IMP210', nama: 'Pemrograman Berorientasi Objek', sks: 3, semester: 3, prodi_id: 1, jenis: 'wajib', metode: 'Case Method' },
{ id: 5, kode: 'IMP406', nama: 'Kapita Selekta Ilmu Komputer', sks: 2, semester: '', prodi_id: 1, jenis: '', metode: '' },
{ id: 6, kode: 'IMU708', nama: 'Skripsi (Laporan Akhir)', sks: 6, semester: '', prodi_id: 1, jenis: '', metode: '' }
]},

ruangan: {
tipe: [_ID,
_tipe('kode', 'text', '', 'kode ruang', '1'),
_tipe('nama', 'text', '', '', '1'),
_tipe('gedung', 'text', '', '', '0'),
_tipe('kapasitas', 'text', '', 'jumlah kursi', '0'),
_tipe('jenis', 'option', 'Kelas,Laboratorium,Aula', '', '0')],
data: [
{ id: 1, kode: '3B', nama: 'Ruang 3B', gedung: 'Gedung 3', kapasitas: 40, jenis: 'Kelas' },
{ id: 2, kode: '3G', nama: 'Ruang 3G', gedung: 'Gedung 3', kapasitas: 40, jenis: 'Kelas' },
{ id: 3, kode: '3H', nama: 'Ruang 3H', gedung: 'Gedung 3', kapasitas: 40, jenis: 'Kelas' },
{ id: 4, kode: '3I', nama: 'Ruang 3I', gedung: 'Gedung 3', kapasitas: 40, jenis: 'Kelas' }
]},

// Kelas kuliah, periode 2026 Ganjil: 10 kelas (halaman Kelas Kuliah Sevima, Prodi Pengampu S1 - Informatika, Kurikulum 2022).
// "idkelas" = ID asli di Sevima (dipakai pada URL /list_perkuliahan/6548 dst). "idjadwal" kosong = belum dijadwalkan.
// "kode" = Nama Kelas di Sevima. IP = Reguler Pagi, IM = Reguler Malam, IK = Kelas Karyawan (dugaan dari kode); 241 = angkatan 2024, dst.
// Detail lengkap (sistem kuliah, tanggal, metode pengajaran, frekuensi) baru diketahui untuk kelas 6760 (IP231); kelas lain dikosongkan sampai ada data Sevima.
// kapasitas = Kap., peserta = Pst. (sesuai Sevima), nilai_dikunci = kolom "Nilai Dikunci", pjmk = Penanggung Jawab Mata Kuliah.
kelas: {
tipe: [_ID,
_tipe('idkelas', 'text', '', 'ID kelas Sevima', '1'),
_tipe('idjadwal', 'text', '', 'ID jadwal Sevima (kosong = belum dijadwalkan)', '0'),
_tipe('kurikulum', 'text', '', 'tahun kurikulum, mis. 2022', '0'),
_tipe('kode', 'text', '', 'nama kelas, mis. IP241', '1'),
_tipe('matakuliah_id', 'option', _ids(6), '1 Robotika, 2 Simulasi & Pemodelan, 3 Computer Vision, 4 PBO, 5 Kapita Selekta, 6 Skripsi', '1'),
_tipe('periode_id', 'option', _ids(3), '3 = 2026 Ganjil', '1'),
_tipe('dosen_id', 'option', _ids(4), 'dosen pengajar', '1'),
_tipe('ruangan_id', 'option', '0,' + _ids(4), '0 belum ditentukan, 1 3B, 2 3G, 3 3H, 4 3I', '0'),
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
{ id: 1, idkelas: '6548', idjadwal: '53882', kurikulum: 2022, kode: 'IP241', matakuliah_id: 1, periode_id: 3, dosen_id: 1, ruangan_id: 2, hari: 'Kamis', jam_mulai: '08:00', jam_selesai: '10:30', program: 'Reguler Pagi', kapasitas: 50, peserta: 29, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 8, sistem_kuliah: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', metode_pengajaran: '', frekuensi: '' },
{ id: 2, idkelas: '6760', idjadwal: '53925', kurikulum: 2022, kode: 'IP231', matakuliah_id: 2, periode_id: 3, dosen_id: 1, ruangan_id: 3, hari: 'Kamis', jam_mulai: '10:30', jam_selesai: '13:00', program: 'Reguler Pagi', kapasitas: 50, peserta: 18, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 16, sistem_kuliah: 'KELAS REGULER', tgl_mulai: '2026-09-14', tgl_selesai: '2027-02-27', kampus_berdampak: 'tidak', metode_pengajaran: 'Dosen Tunggal', frekuensi: 'Setiap Minggu' },
{ id: 3, idkelas: '6552', idjadwal: '53953', kurikulum: 2022, kode: 'IP241', matakuliah_id: 3, periode_id: 3, dosen_id: 1, ruangan_id: 1, hari: 'Kamis', jam_mulai: '13:30', jam_selesai: '16:00', program: 'Reguler Pagi', kapasitas: 50, peserta: 9, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 8, sistem_kuliah: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', metode_pengajaran: '', frekuensi: '' },
{ id: 4, idkelas: '6669', idjadwal: '53973', kurikulum: 2022, kode: 'IM251', matakuliah_id: 4, periode_id: 3, dosen_id: 1, ruangan_id: 4, hari: 'Kamis', jam_mulai: '17:00', jam_selesai: '19:30', program: 'Reguler Malam', kapasitas: 50, peserta: 19, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 8, sistem_kuliah: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', metode_pengajaran: '', frekuensi: '' },
// Computer Vision (IM241) jadwal Kamis 19:30 - 22:00 di Sevima, 0 peserta. Ruangan belum ditentukan.
{ id: 5, idkelas: '6751', idjadwal: '', kurikulum: 2022, kode: 'IM241', matakuliah_id: 3, periode_id: 3, dosen_id: 1, ruangan_id: 0, hari: 'Kamis', jam_mulai: '19:30', jam_selesai: '22:00', program: 'Reguler Malam', kapasitas: 50, peserta: 0, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 0, sistem_kuliah: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', metode_pengajaran: '', frekuensi: '' },
// Kelas berikut belum punya jadwal mingguan di Sevima.
{ id: 6, idkelas: '6630', idjadwal: '', kurikulum: 2022, kode: 'IK241', matakuliah_id: 3, periode_id: 3, dosen_id: 1, ruangan_id: 0, hari: '', jam_mulai: '', jam_selesai: '', program: 'Kelas Karyawan', kapasitas: 50, peserta: 4, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 0, sistem_kuliah: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', metode_pengajaran: '', frekuensi: '' },
{ id: 7, idkelas: '6613', idjadwal: '', kurikulum: 2022, kode: 'IK251', matakuliah_id: 4, periode_id: 3, dosen_id: 1, ruangan_id: 0, hari: '', jam_mulai: '', jam_selesai: '', program: 'Kelas Karyawan', kapasitas: 50, peserta: 8, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 0, sistem_kuliah: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', metode_pengajaran: '', frekuensi: '' },
{ id: 8, idkelas: '6621', idjadwal: '', kurikulum: 2022, kode: 'IK241', matakuliah_id: 1, periode_id: 3, dosen_id: 1, ruangan_id: 0, hari: '', jam_mulai: '', jam_selesai: '', program: 'Kelas Karyawan', kapasitas: 50, peserta: 25, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 0, sistem_kuliah: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', metode_pengajaran: '', frekuensi: '' },
{ id: 9, idkelas: '7384', idjadwal: '', kurikulum: 2022, kode: 'KPT03', matakuliah_id: 5, periode_id: 3, dosen_id: 1, ruangan_id: 0, hari: '', jam_mulai: '', jam_selesai: '', program: 'Lainnya', kapasitas: 12, peserta: 12, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 0, sistem_kuliah: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', metode_pengajaran: '', frekuensi: '' },
{ id: 10, idkelas: '7108', idjadwal: '', kurikulum: 2022, kode: 'IK221', matakuliah_id: 6, periode_id: 3, dosen_id: 1, ruangan_id: 0, hari: '', jam_mulai: '', jam_selesai: '', program: 'Kelas Karyawan', kapasitas: 10, peserta: 1, nilai_dikunci: 'Tidak Dikunci', pjmk: 'ya', jumlah_pertemuan: 0, sistem_kuliah: '', tgl_mulai: '', tgl_selesai: '', kampus_berdampak: '', metode_pengajaran: '', frekuensi: '' }
]},

// KRS = peserta kelas (mahasiswa yang mengambil kelas pada periode)
krs: {
tipe: [_ID,
_tipe('periode_id', 'option', _ids(3), '', '1'),
_tipe('mahasiswa_id', 'option', _ids(32), 'mahasiswa', '1'),
_tipe('kelas_id', 'option', _ids(10), 'kelas kuliah', '1'),
_tipe('status', 'option', 'diajukan,disetujui,ditolak', '', '1')],
data: _krs()},

// 8 pertemuan x 4 kelas (Kamis, 1 Okt - 19 Nov 2026). Kelas 5 belum punya pertemuan.
// presensi_dosen: 0 = belum, 1 = sudah dipresensi. Realisasi dikosongkan (diisi dosen).
pertemuan: {
tipe: [_ID,
_tipe('kelas_id', 'option', _ids(10), 'kelas (id kelas di tabel kelas)', '1'),
_tipe('ke', 'text', '', 'Sesi (pertemuan ke-)', '1'),
_tipe('tanggal', 'text', '', 'Tanggal Jadwal, YYYY-MM-DD', '1'),
_tipe('jam_mulai', 'text', '', 'Waktu Mulai, HH:MM', '1'),
_tipe('jam_selesai', 'text', '', 'Waktu Selesai, HH:MM', '1'),
_tipe('jenis', 'option', 'Kuliah,Praktikum', 'Jenis Pertemuan', '0'),
_tipe('kelompok', 'text', '', 'Kelompok (kosong = semua)', '0'),
_tipe('status', 'option', 'terjadwal,dimulai,berlangsung,selesai', 'Status sesi', '0'),
_tipe('metode', 'option', 'Offline,Online', 'Metode Pembelajaran', '0'),
_tipe('ruangan_id', 'option', '0,' + _ids(4), 'Ruang Kuliah: 0 belum ditentukan, 1 3B, 2 3G, 3 3H, 4 3I', '1'),
_tipe('ket_ruang', 'text', '', 'Keterangan Ruang Kuliah', '0'),
_tipe('url_online', 'text', '', 'URL Kuliah Online', '0'),
_tipe('sks', 'text', '', 'SKS', '0'),
_tipe('dosen_id', 'option', _ids(4), 'Dosen Pengajar (1 = WAWAN SISMADI)', '0'),
_tipe('dosen_pengganti', 'option', 'tidak,ya', 'Dosen Pengganti', '0'),
_tipe('materi', 'textarea', '', 'Rencana Materi (1000 karakter pertama dilaporkan ke Neofeeder)', '0'),
_tipe('realisasi', 'textarea', '', 'Realisasi Materi (diisi dosen)', '0'),
_tipe('dokumen_presensi', 'text', '', 'Dokumen Presensi (nama berkas pdf/jpg, maks 2 MB)', '0'),
_tipe('dokumen_jurnal', 'text', '', 'Dokumen Jurnal (nama berkas pdf/jpg, maks 2 MB)', '0'),
_tipe('presensi_dosen', 'option', '0,1', '0 belum, 1 sudah', '0')],
data: _pertemuan()},

// Presensi mahasiswa: H hadir, I izin, S sakit, A alpha. Baru terisi untuk Robotika pertemuan 1-2.
presensi: {
tipe: [_ID,
_tipe('pertemuan_id', 'option', _ids(32), 'pertemuan (1-8 Robotika, 9-16 Simulasi, 17-24 Computer Vision IP241, 25-32 PBO)', '1'),
_tipe('mahasiswa_id', 'option', _ids(32), '', '1'),
_tipe('status', 'option', 'H,I,S,A', 'H hadir, I izin, S sakit, A alpha', '1')],
data: [
{ id: 1, pertemuan_id: 1, mahasiswa_id: 1, status: 'H' },
{ id: 2, pertemuan_id: 1, mahasiswa_id: 2, status: 'H' },
{ id: 3, pertemuan_id: 1, mahasiswa_id: 3, status: 'H' },
{ id: 4, pertemuan_id: 1, mahasiswa_id: 4, status: 'I' },
{ id: 5, pertemuan_id: 1, mahasiswa_id: 5, status: 'H' },
{ id: 6, pertemuan_id: 1, mahasiswa_id: 6, status: 'S' },
{ id: 7, pertemuan_id: 1, mahasiswa_id: 7, status: 'H' },
{ id: 8, pertemuan_id: 1, mahasiswa_id: 8, status: 'H' },
{ id: 9, pertemuan_id: 2, mahasiswa_id: 1, status: 'H' },
{ id: 10, pertemuan_id: 2, mahasiswa_id: 2, status: 'H' },
{ id: 11, pertemuan_id: 2, mahasiswa_id: 3, status: 'A' },
{ id: 12, pertemuan_id: 2, mahasiswa_id: 4, status: 'H' },
{ id: 13, pertemuan_id: 2, mahasiswa_id: 5, status: 'H' },
{ id: 14, pertemuan_id: 2, mahasiswa_id: 6, status: 'H' },
{ id: 15, pertemuan_id: 2, mahasiswa_id: 7, status: 'I' },
{ id: 16, pertemuan_id: 2, mahasiswa_id: 8, status: 'H' }
]},

// Komponen penilaian per kelas. Tugas + UTS = 10 komponen "belum dikunci" (angka pada kartu Tanggungan Dosen).
nilai: {
tipe: [_ID,
_tipe('kelas_id', 'option', _ids(10), '', '1'),
_tipe('komponen', 'option', 'Tugas,UTS,UAS,Kehadiran', '', '1'),
_tipe('bobot', 'text', '', 'persen', '1'),
_tipe('status', 'option', 'belum dibuka,belum dikunci,dikunci', '', '1')],
data: _nilai()},

// Pengajuan proposal Tugas Akhir mahasiswa bimbingan (12 proposal pada kartu "Jumlah Mahasiswa Bimbingan")
bimbingan: {
tipe: [_ID,
_tipe('mahasiswa_id', 'option', _ids(12, 21), 'mahasiswa 21-32', '1'),
_tipe('judul', 'textarea', '', 'judul proposal', '1'),
_tipe('dosen_id', 'option', _ids(4), 'pembimbing', '1'),
_tipe('tahap', 'option', 'Proposal,Tugas Akhir', '', '1'),
_tipe('status', 'option', 'diajukan,revisi,disetujui,ditolak', '', '1'),
_tipe('tanggal', 'text', '', 'YYYY-MM-DD', '0')],
data: [
{ id: 1, mahasiswa_id: 21, judul: 'Sistem Deteksi Objek Real-Time pada Robot Mobile Menggunakan YOLO', dosen_id: 1, tahap: 'Proposal', status: 'diajukan', tanggal: '2026-09-21' },
{ id: 2, mahasiswa_id: 22, judul: 'Rancang Bangun Sistem Presensi Berbasis Pengenalan Wajah', dosen_id: 1, tahap: 'Proposal', status: 'revisi', tanggal: '2026-09-22' },
{ id: 3, mahasiswa_id: 23, judul: 'Simulasi Antrian Layanan Akademik dengan Metode Discrete Event', dosen_id: 1, tahap: 'Proposal', status: 'diajukan', tanggal: '2026-09-24' },
{ id: 4, mahasiswa_id: 24, judul: 'Klasifikasi Citra Daun Padi Menggunakan Convolutional Neural Network', dosen_id: 1, tahap: 'Proposal', status: 'revisi', tanggal: '2026-09-28' },
{ id: 5, mahasiswa_id: 25, judul: 'Perancangan Lengan Robot 4 DOF untuk Pemilah Barang', dosen_id: 1, tahap: 'Proposal', status: 'diajukan', tanggal: '2026-10-02' },
{ id: 6, mahasiswa_id: 26, judul: 'Implementasi Aplikasi Siakad Berbasis Web dengan Framework JavaScript', dosen_id: 1, tahap: 'Proposal', status: 'diajukan', tanggal: '2026-10-05' },
{ id: 7, mahasiswa_id: 27, judul: 'Analisis Sentimen Ulasan Aplikasi Kampus Menggunakan Naive Bayes', dosen_id: 1, tahap: 'Proposal', status: 'revisi', tanggal: '2026-10-07' },
{ id: 8, mahasiswa_id: 28, judul: 'Sistem Monitoring Kehadiran Kuliah Berbasis QR Code', dosen_id: 1, tahap: 'Proposal', status: 'diajukan', tanggal: '2026-10-12' },
{ id: 9, mahasiswa_id: 29, judul: 'Pemodelan Dinamika Sistem untuk Prediksi Kelulusan Tepat Waktu', dosen_id: 1, tahap: 'Proposal', status: 'diajukan', tanggal: '2026-10-14' },
{ id: 10, mahasiswa_id: 30, judul: 'Deteksi Plat Nomor Kendaraan dengan Pengolahan Citra', dosen_id: 1, tahap: 'Proposal', status: 'revisi', tanggal: '2026-10-19' },
{ id: 11, mahasiswa_id: 31, judul: 'Rancang Bangun Robot Line Follower dengan Kontrol PID', dosen_id: 1, tahap: 'Proposal', status: 'diajukan', tanggal: '2026-10-21' },
{ id: 12, mahasiswa_id: 32, judul: 'Aplikasi Mobile Pembelajaran Pemrograman Berorientasi Objek', dosen_id: 1, tahap: 'Proposal', status: 'diajukan', tanggal: '2026-10-26' }
]},

konsultasi: {
tipe: [_ID,
_tipe('mahasiswa_id', 'option', _ids(32), '', '1'),
_tipe('dosen_id', 'option', _ids(4), '', '1'),
_tipe('tanggal', 'text', '', 'YYYY-MM-DD', '1'),
_tipe('topik', 'text', '', '', '1'),
_tipe('catatan', 'textarea', '', 'ringkasan hasil konsultasi', '0'),
_tipe('status', 'option', 'menunggu,dibalas,selesai', '', '1')],
data: [
{ id: 1, mahasiswa_id: 21, dosen_id: 1, tanggal: '2026-10-28', topik: 'Latar belakang dan rumusan masalah proposal', catatan: 'Rumusan masalah dipersempit pada deteksi objek bergerak.', status: 'selesai' },
{ id: 2, mahasiswa_id: 22, dosen_id: 1, tanggal: '2026-10-30', topik: 'Revisi bab 1 dan 2', catatan: 'Tambahkan tinjauan pustaka pengenalan wajah 5 tahun terakhir.', status: 'selesai' },
{ id: 3, mahasiswa_id: 27, dosen_id: 1, tanggal: '2026-11-04', topik: 'Pengumpulan dataset ulasan', catatan: '', status: 'dibalas' },
{ id: 4, mahasiswa_id: 3, dosen_id: 2, tanggal: '2026-11-09', topik: 'Konsultasi KRS semester genap', catatan: '', status: 'menunggu' },
{ id: 5, mahasiswa_id: 30, dosen_id: 1, tanggal: '2026-11-16', topik: 'Pemilihan metode segmentasi plat nomor', catatan: '', status: 'menunggu' },
{ id: 6, mahasiswa_id: 8, dosen_id: 1, tanggal: '2026-11-18', topik: 'Tugas besar Robotika', catatan: 'Disarankan memakai sensor ultrasonik untuk menghindari halangan.', status: 'dibalas' }
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
{ id: 17, judul: 'KALENDER AKADEMIK SEMESTER GANJIL 2026', penulis: 'FITRIA', waktu: '2026-09-04 15:36:09', isi: 'Kalender akademik Semester Ganjil 2026/2027 telah ditetapkan. Silakan unduh lampiran dan perhatikan tanggal penting perkuliahan, ujian, serta batas pengisian nilai.', lampiran: 'kalender-akademik-ganjil-2026.pdf' },
{ id: 5, judul: 'PENGISIAN SESI PERKULIAHAN GANJIL 2025/2026', penulis: 'Wiyanto', waktu: '2025-09-18 11:36:10', isi: 'Dosen mohon mengisi sesi perkuliahan (rencana materi tiap pertemuan) melalui menu Perkuliahan > Mata Kuliah > Daftar Sesi paling lambat sebelum perkuliahan dimulai.', lampiran: '' }
]},

kalender: {
tipe: [_ID,
_tipe('periode_id', 'option', _ids(3), '', '1'),
_tipe('kegiatan', 'text', '', '', '1'),
_tipe('tgl_mulai', 'text', '', 'YYYY-MM-DD', '1'),
_tipe('tgl_selesai', 'text', '', 'YYYY-MM-DD', '1'),
_tipe('kategori', 'option', 'administrasi,akademik,ujian,libur', '', '1')],
data: [
{ id: 1, periode_id: 3, kegiatan: 'Pengisian KRS', tgl_mulai: '2026-08-24', tgl_selesai: '2026-09-18', kategori: 'administrasi' },
{ id: 2, periode_id: 3, kegiatan: 'Pengisian Sesi Perkuliahan oleh Dosen', tgl_mulai: '2026-09-14', tgl_selesai: '2026-09-30', kategori: 'administrasi' },
{ id: 3, periode_id: 3, kegiatan: 'Perkuliahan Pertemuan 1-8', tgl_mulai: '2026-10-01', tgl_selesai: '2026-11-19', kategori: 'akademik' },
{ id: 4, periode_id: 3, kegiatan: 'Ujian Tengah Semester (UTS)', tgl_mulai: '2026-11-23', tgl_selesai: '2026-12-04', kategori: 'ujian' },
{ id: 5, periode_id: 3, kegiatan: 'Perkuliahan Pertemuan 9-16', tgl_mulai: '2026-12-07', tgl_selesai: '2027-01-22', kategori: 'akademik' },
{ id: 6, periode_id: 3, kegiatan: 'Libur Natal dan Tahun Baru', tgl_mulai: '2026-12-24', tgl_selesai: '2027-01-01', kategori: 'libur' },
{ id: 7, periode_id: 3, kegiatan: 'Ujian Akhir Semester (UAS)', tgl_mulai: '2027-01-25', tgl_selesai: '2027-02-05', kategori: 'ujian' },
{ id: 8, periode_id: 3, kegiatan: 'Batas Pengisian dan Penguncian Nilai', tgl_mulai: '2027-02-08', tgl_selesai: '2027-02-19', kategori: 'administrasi' }
]},

notifikasi: {
tipe: [_ID,
_tipe('dosen_id', 'option', _ids(4), 'penerima', '1'),
_tipe('tipe', 'option', 'info,sukses,peringatan', '', '1'),
_tipe('judul', 'text', '', '', '1'),
_tipe('isi', 'textarea', '', '', '0'),
_tipe('waktu', 'text', '', 'YYYY-MM-DD HH:MM', '1'),
_tipe('dibaca', 'option', '0,1', '0 belum, 1 sudah', '0')],
data: [
{ id: 1, dosen_id: 1, tipe: 'peringatan', judul: 'Presensi mahasiswa belum dilakukan', isi: 'Terdapat pertemuan pada 4 kelas yang belum dilakukan presensi.', waktu: '2026-11-24 07:30', dibaca: 0 },
{ id: 2, dosen_id: 1, tipe: 'peringatan', judul: 'Penilaian belum dikunci', isi: 'Masih ada 10 komponen penilaian perkuliahan yang belum dikunci.', waktu: '2026-11-23 08:00', dibaca: 0 },
{ id: 3, dosen_id: 1, tipe: 'info', judul: 'Pengumuman baru dari Akademik', isi: 'PENGUMUMAN UTS D3, S1 dan S2 Semester Ganjil Tahun Akademik 2026_2027.', waktu: '2026-11-13 14:25', dibaca: 1 },
{ id: 4, dosen_id: 1, tipe: 'info', judul: 'Konsultasi baru dari mahasiswa', isi: 'Farah Nabila mengajukan konsultasi: Pemilihan metode segmentasi plat nomor.', waktu: '2026-11-16 10:12', dibaca: 1 }
]},

// Struktur menu (header + sidebar), persis seperti SIM Akademik peran Dosen.
// parent_id 0 = menu utama. Menu tingkat 3 memakai parent_id menu tingkat 2 (mis. E-learning).
navigasi: {
tipe: [_ID,
_tipe('parent_id', 'option', '0,' + _ids(21), '0 = menu utama', '1'),
_tipe('nama', 'text', '', '', '1'),
_tipe('deskripsi', 'text', '', 'teks kecil di bawah judul menu', '0'),
_tipe('url', 'text', '', 'rute Sevima, mis. list_konsultasi', '0'),
_tipe('ikon', 'text', '', 'nama ikon', '0'),
_tipe('peran', 'option', 'dosen,mahasiswa,admin', '', '1')],
data: [
{ id: 1, parent_id: 0, nama: 'Beranda', deskripsi: '', url: 'home', ikon: 'beranda', peran: 'dosen' },
{ id: 2, parent_id: 0, nama: 'Bimbingan', deskripsi: '', url: '', ikon: 'bimbingan', peran: 'dosen' },
{ id: 3, parent_id: 0, nama: 'Jadwal', deskripsi: '', url: '', ikon: 'jadwal', peran: 'dosen' },
{ id: 4, parent_id: 0, nama: 'Perkuliahan', deskripsi: '', url: '', ikon: 'perkuliahan', peran: 'dosen' },
{ id: 5, parent_id: 0, nama: 'Laporan', deskripsi: '', url: '', ikon: 'laporan', peran: 'dosen' },

{ id: 6, parent_id: 2, nama: 'Konsultasi', deskripsi: 'Konsultasi dengan Mahasiswa', url: 'list_konsultasi', ikon: 'konsultasi', peran: 'dosen' },
{ id: 7, parent_id: 2, nama: 'Pembimbing Akademik', deskripsi: 'Monitoring KRS Mahasiswa', url: 'list_mhspa', ikon: 'pembimbing_akademik', peran: 'dosen' },
{ id: 8, parent_id: 2, nama: 'Proposal Tugas Akhir', deskripsi: 'Pengajuan TA Mahasiswa', url: 'list_pengajuanta', ikon: 'proposal_tugas_akhir', peran: 'dosen' },
{ id: 9, parent_id: 2, nama: 'Daftar Tugas Akhir', deskripsi: 'Progres TA Mahasiswa', url: 'list_ta', ikon: 'daftar_skripsi', peran: 'dosen' },
{ id: 10, parent_id: 2, nama: 'Kegiatan Pendukung', deskripsi: 'Monitoring Kegiatan Mahasiswa', url: 'list_kkn', ikon: 'kegiatan_pendukung', peran: 'dosen' },

{ id: 11, parent_id: 3, nama: 'Kalender Akademik', deskripsi: 'Daftar Kegiatan Akademik', url: 'view_kalender', ikon: 'kalender_akademik', peran: 'dosen' },
{ id: 12, parent_id: 3, nama: 'Jadwal Minggu ini', deskripsi: 'Kegiatan dalam Seminggu', url: 'list_jadwalajar', ikon: 'jadwal_minggu_ini', peran: 'dosen' },
{ id: 13, parent_id: 3, nama: 'Jadwal Semester Ini', deskripsi: 'Kegiatan dalam Semester', url: 'list_jadwalajarsmt', ikon: 'jadwal_semester_ini', peran: 'dosen' },
{ id: 14, parent_id: 3, nama: 'Jadwal Kepaniteraan', deskripsi: 'Jadwal kepaniteraan klinik', url: 'list_jadwalstasemhs', ikon: 'jadwal_kepaniteraan', peran: 'dosen' },

{ id: 15, parent_id: 4, nama: 'E-learning', deskripsi: 'Pembelajaran Akademik', url: '', ikon: 'kelas_kuliah', peran: 'dosen' },
{ id: 16, parent_id: 4, nama: 'Mata Kuliah', deskripsi: 'Daftar Mata Kuliah Dosen', url: 'list_matakuliah', ikon: 'mata_kuliah', peran: 'dosen' },
{ id: 17, parent_id: 4, nama: 'Kelas Kuliah', deskripsi: 'Referensi SKS Mahasiswa', url: 'list_kelas', ikon: 'batas_sks', peran: 'dosen' },
{ id: 18, parent_id: 4, nama: 'Berhenti Studi', deskripsi: 'Monitoring Mahasiswa', url: 'set_berhentistudi', ikon: 'berhenti_studi', peran: 'dosen' },

{ id: 19, parent_id: 5, nama: 'Perkuliahan', deskripsi: 'Rekap Kegiatan Mahasiswa', url: '', ikon: 'perkuliahan', peran: 'dosen' },
{ id: 20, parent_id: 5, nama: 'Nilai', deskripsi: 'Rekap Nilai Mahasiswa', url: '', ikon: 'nilai', peran: 'dosen' },
{ id: 21, parent_id: 5, nama: 'Kampus Berdampak', deskripsi: 'Studi Mandiri Mahasiswa', url: '', ikon: 'kampus_berdampak', peran: 'dosen' },

{ id: 22, parent_id: 15, nama: 'Kelas Edlink', deskripsi: '', url: 'list_forumedlink', ikon: '', peran: 'dosen' },
{ id: 23, parent_id: 15, nama: 'Kelas Kampus Berdampak', deskripsi: '', url: 'list_kelaskm', ikon: '', peran: 'dosen' },
{ id: 24, parent_id: 15, nama: 'Forum Kelas (Lama)', deskripsi: '', url: 'list_forum', ikon: '', peran: 'dosen' },
{ id: 25, parent_id: 19, nama: 'Presentase Kehadiran Mahasiswa', deskripsi: '', url: 'repp_prosentaseabs', ikon: '', peran: 'dosen' },
{ id: 26, parent_id: 19, nama: 'Mahasiswa Tercekal Ujian', deskripsi: '', url: 'repp_cekalujian', ikon: '', peran: 'dosen' },
{ id: 27, parent_id: 19, nama: 'Berita Acara Ujian', deskripsi: '', url: 'repp_absensiujian', ikon: '', peran: 'dosen' },
{ id: 28, parent_id: 20, nama: 'Nilai Mahasiswa', deskripsi: '', url: 'repp_nilaimhs', ikon: '', peran: 'dosen' },
{ id: 29, parent_id: 21, nama: 'Nilai Per Mahasiswa', deskripsi: '', url: 'repp_nilaimhskm', ikon: '', peran: 'dosen' },
{ id: 30, parent_id: 21, nama: 'Nilai Per Kelas', deskripsi: '', url: 'repp_nilaikelaskm', ikon: '', peran: 'dosen' }
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
  var V = '2026-11-24.4';
  try { if (window.localStorage.getItem('dataset_ver') !== V) { window.localStorage.removeItem('dataset'); window.localStorage.setItem('dataset_ver', V); } } catch (e) {}
})();
