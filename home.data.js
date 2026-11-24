var homeData = {
  brand: "SIM Akademik",
  labels: {
    layanan: "Menu layanan dosen",
    layananSub: "Empat kelompok menu utama SIM Akademik Universitas IPWIJA untuk kegiatan mengajar dan membimbing.",
    program: "Jadwal mengajar semester ini",
    programSub: "10 kelas Anda ampu pada periode 2026 Ganjil; 5 di antaranya sudah terjadwal hari Kamis.",
    testimoni: "Informasi terbaru",
    faq: "Pertanyaan yang sering diajukan",
    tombol: "Dashboard"
  },
  nav: [
    { text: "Layanan", target: "layanan" },
    { text: "Jadwal", target: "program" },
    { text: "Informasi", target: "testimoni" },
    { text: "FAQ", target: "faq" }
  ],
  slides: [
    {
      tag: "Perkuliahan",
      title: "Kelola jadwal, presensi, dan realisasi perkuliahan dalam satu tempat",
      desc: "Pantau kelas yang Anda ampu pada semester 2026 Ganjil, isi presensi mahasiswa, dan catat realisasi materi tiap pertemuan.",
      cta: { text: "Lihat jadwal", target: "program" },
      art: "code"
    },
    {
      tag: "Bimbingan",
      title: "Dampingi mahasiswa dari konsultasi sampai proposal tugas akhir",
      desc: "Monitoring KRS mahasiswa bimbingan akademik, konsultasi, dan pengajuan proposal tugas akhir.",
      cta: { text: "Lihat layanan", target: "layanan" },
      art: "chart"
    },
    {
      tag: "Penilaian",
      title: "Isi dan kunci nilai mahasiswa sebelum batas akhir",
      desc: "Tanggungan dosen tampil di dashboard: presensi yang belum diisi, penilaian yang belum dikunci, dan KRS yang perlu divalidasi.",
      cta: { text: "Buka dashboard", target: "kontak" },
      art: "mobile"
    }
  ],
  stats: [
    { value: "15,00", label: "SKS beban mengajar" },
    { value: "10", label: "Kelas semester ini" },
    { value: "12", label: "Proposal mahasiswa bimbingan" },
    { value: "8", label: "Pertemuan per kelas" }
  ],
  services: [
    { title: "Bimbingan", desc: "Konsultasi dengan mahasiswa, pembimbing akademik, proposal dan progres tugas akhir, serta kegiatan pendukung.", icon: "?person/48x48/white" },
    { title: "Jadwal", desc: "Kalender akademik, jadwal minggu ini, jadwal semester ini, dan jadwal kepaniteraan klinik.", icon: "?calendar/48x48/white" },
    { title: "Perkuliahan", desc: "E-learning (Kelas Edlink), mata kuliah, kelas kuliah, dan monitoring berhenti studi.", icon: "?buku/48x48/white" },
    { title: "Laporan", desc: "Presentase kehadiran, mahasiswa tercekal ujian, berita acara ujian, dan rekap nilai mahasiswa.", icon: "?chart/48x48/white" }
  ],
  about: {
    title: "Satu pintu untuk kegiatan akademik dosen",
    text: "SIM Akademik Universitas IPWIJA menyatukan jadwal mengajar, presensi mahasiswa, realisasi perkuliahan, penilaian, dan bimbingan. Seluruh tanggungan dosen terlihat di satu dashboard.",
    points: [
      "Presensi mahasiswa H, I, S, A per pertemuan",
      "Realisasi materi diisi dosen di setiap sesi",
      "Penilaian dikunci sebelum batas akhir pengisian nilai",
      "Validasi KRS dan monitoring mahasiswa bimbingan"
    ]
  },
  programs: [
    { level: "Kamis", title: "Robotika (IP241)", meta: "08:00 - 10:30 • Ruang 3G", price: "3 SKS", go: "absen/absen/1" },
    { level: "Kamis", title: "Simulasi & Pemodelan (IP231)", meta: "10:30 - 13:00 • Ruang 3H", price: "3 SKS", go: "absen/absen/1" },
    { level: "Kamis", title: "Computer Vision (IP241)", meta: "13:30 - 16:00 • Ruang 3B", price: "3 SKS", go: "absen/absen/1" },
    { level: "Kamis", title: "Pemrograman Berorientasi Objek (IM251)", meta: "17:00 - 19:30 • Ruang 3I", price: "3 SKS", go: "absen/absen/1" },
    { level: "Kamis", title: "Computer Vision (IM241)", meta: "19:30 - 22:00 • Ruang belum ditentukan", price: "3 SKS", go: "kuliah/kuliah/1" }
  ],
  testimonials: [
    { name: "FITRIA", role: "13 Nov 2026, 14:25", text: "PENGUMUMAN UTS D3, S1 dan S2 Semester Ganjil Tahun Akademik 2026_2027." },
    { name: "FITRIA", role: "4 Sep 2026, 15:36", text: "KALENDER AKADEMIK SEMESTER GANJIL 2026." },
    { name: "Wiyanto", role: "18 Sep 2025, 11:36", text: "PENGISIAN SESI PERKULIAHAN GANJIL 2025/2026." }
  ],
  faq: [
    { q: "Bagaimana cara mengisi presensi mahasiswa?", a: "Buka menu Presensi, pilih kelas dan pertemuan, lalu tandai tiap mahasiswa H, I, S, atau A. Lengkapi setidaknya 50% mahasiswa terdaftar." },
    { q: "Di mana saya mengisi realisasi perkuliahan?", a: "Pada Perkuliahan > Mata Kuliah > Daftar Sesi, lalu pilih pertemuan dan isi realisasi materinya." },
    { q: "Kapan nilai harus dikunci?", a: "Nilai dikunci sebelum batas akhir pengisian nilai pada kalender akademik, yaitu 8–19 Februari 2027 untuk Semester Ganjil 2026/2027." },
    { q: "Ke mana saya meminta bantuan?", a: "Buka pusat bantuan SEVIMA melalui tombol di bagian bawah halaman ini." }
  ],
  cta: {
    title: "Ada pertemuan yang belum dipresensi?",
    desc: "Buka dashboard untuk melihat seluruh tanggungan dosen pada periode 2026 Ganjil.",
    primary: "Buka dashboard",
    secondary: "Pusat bantuan",
    link: "https://knowledge.sevima.com/"
  }
};
