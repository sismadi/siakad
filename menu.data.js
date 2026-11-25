/* Data menu sidebar SIM Akademik SEVIMA (peran Dosen). Dibaca oleh menu.js.
   parent_id 0 = menu utama; menu tingkat 3 memakai parent_id menu tingkat 2 (mis. E-learning).
   url = rute Sevima; rute yang sudah punya halaman DonatJS dipetakan di "rute", sisanya ke halaman "halaman".
   "kelas" = menu kiri halaman Detail Kelas (SEVIMA /siakad/data_kelas/detail/{idkelas}), dibaca dkelas.js:
   url = rute Sevima (diikuti idkelas), rute = rute DonatJS (diikuti id kelas), status = tersedia | belum (isi halaman belum dimasukkan). */
var menuData = {
  // rute Sevima -> rute DonatJS yang sudah tersedia
  rute: { home: 'home/home/1', list_kelas: 'kuliah/kuliah/1', list_matakuliah: 'mkuliah/mkuliah/1' },
  nav: [
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
  ],
  // menu kiri Detail Kelas (urutan sama dengan SEVIMA)
  kelas: [
    { id: 1, parent_id: 0, nama: 'Detail Kelas', status: 'tersedia', keterangan: 'Data kelas, dosen pengajar, jadwal mingguan', url: 'data_kelas/detail', rute: 'dkelas/detail' },
    { id: 2, parent_id: 0, nama: 'Dosen Pengajar', status: 'tersedia', keterangan: 'Dosen dan data pengajaran', url: 'data_pengajar/detail', rute: 'dkelas/pengajar' },
    { id: 3, parent_id: 0, nama: 'Peserta Kelas', status: 'tersedia', keterangan: 'Mahasiswa peserta (KRS)', url: 'list_peserta', rute: 'dkelas/peserta' },
    { id: 4, parent_id: 0, nama: 'Kontrak Kuliah', status: 'belum', keterangan: 'Kontrak perkuliahan kelas', url: 'data_kontrakkul/detail', rute: 'dkelas/kontrak' },
    { id: 5, parent_id: 0, nama: 'Jadwal Perkuliahan', status: 'tersedia', keterangan: 'Sesi perkuliahan kelas', url: 'list_perkuliahan', rute: 'kuliah/jadwal' },
    { id: 6, parent_id: 0, nama: 'Presensi Kelas', status: 'tersedia', keterangan: 'Rekap presensi per sesi', url: 'list_absensi', rute: 'dkelas/presensi' },
    { id: 7, parent_id: 0, nama: 'Kesan Perkuliahan', status: 'belum', keterangan: 'Kesan mahasiswa', url: 'list_kesanmhs', rute: 'dkelas/kesan' },
    { id: 8, parent_id: 0, nama: 'Jadwal Ujian', status: 'belum', keterangan: 'Jadwal ujian kelas', url: 'list_jadwalujian', rute: 'dkelas/ujian' },
    { id: 9, parent_id: 0, nama: 'Nilai Perkuliahan', status: 'belum', keterangan: 'Pengisian dan penguncian nilai', url: 'set_nilai', rute: 'dkelas/nilai' },
    { id: 10, parent_id: 0, nama: 'Rekap Kuesioner', status: 'belum', keterangan: 'Hasil angket kelas', url: 'list_angketkelas', rute: 'dkelas/kuesioner' },
    { id: 11, parent_id: 0, nama: 'RPS', status: 'belum', keterangan: 'Rencana pembelajaran semester', url: 'view_rps', rute: 'dkelas/rps' },
    { id: 12, parent_id: 0, nama: 'Tugas Kuliah', status: 'belum', keterangan: 'Forum dan tugas kelas', url: 'list_forumkelas', rute: 'dkelas/tugas' }
  ]
};
