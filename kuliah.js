/* Kelas Kuliah - Daftar Kelas & Jadwal Perkuliahan (meniru SEVIMA /siakad/list_kelas, peran Dosen).
   Data dari dataset.js (kelas, matakuliah, prodi, dosen, periode). Hanya memakai kelas DonatJS yang sudah ada. */
var kuliah = {
    st: { periode: 0, prodi: 0, q: '', rpp: 10, page: 1, jadwal: 0, semua: false, jf: 0 },

    model: {
        data: function() { d.service.init(); return dataset; },
        esc: function(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
        find: function(tb, id) { return kuliah.model.data()[tb].data.find(function(x) { return x.id == id; }); },
        // kolom teknis yang disembunyikan di bagian "Lanjutan" pada form drawer
        LANJUT_KELAS: ['idkelas', 'idjadwal', 'kurikulum', 'pjmk', 'jumlah_pertemuan', 'sistem_kuliah', 'tgl_mulai', 'tgl_selesai', 'kampus_berdampak', 'metode_pengajaran', 'frekuensi'],
        LANJUT_SESI: ['kelas_id', 'kelompok', 'ket_ruang', 'url_online', 'sks', 'dosen_id', 'dosen_pengganti', 'dokumen_presensi', 'dokumen_jurnal', 'presensi_dosen'],
        aktif: function() { var a = kuliah.model.data().periode.data.find(function(p) { return p.status === 'aktif'; }); return a ? a.id : 0; },
        hari: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        // YYYY-MM-DD -> dd-mm-yyyy (format SEVIMA)
        tgl: function(v) { if (!v) { return '-'; } var p = String(v).split('-'); return p[2] + '-' + p[1] + '-' + p[0]; },
        namaHari: function(v) { var t = new Date(v + 'T00:00:00'); return isNaN(t) ? '' : kuliah.model.hari[t.getDay()]; },
        sesi: function(kid) { return kuliah.model.data().pertemuan.data.filter(function(p) { return p.kelas_id == kid; }).sort(function(a, b) { return a.ke - b.ke; }); },
        rows: function() {
            var ds = kuliah.model.data(), st = kuliah.st, q = st.q.toLowerCase();
            return ds.kelas.data.map(function(k) {
                var mk = kuliah.model.find('matakuliah', k.matakuliah_id) || {};
                var pr = kuliah.model.find('prodi', mk.prodi_id) || {};
                var ds = kuliah.model.find('dosen', k.dosen_id) || {};
                var sks = Number(mk.sks || 0).toFixed(2);
                return {
                    id: k.id, kur: k.kurikulum, kodemk: mk.kode || '', mk: (mk.kode || '-') + ' - ' + (mk.nama || '-') + ' (' + sks + ' SKS)', metode: mk.metode || '',
                    prodi: (pr.jenjang || '') + ' - ' + (pr.nama || ''), kelas: k.kode, pengajar: ds.nama || '',
                    jadwal: k.hari ? k.hari + ', ' + k.jam_mulai + ' s.d ' + k.jam_selesai : '',
                    kap: k.kapasitas, pst: k.peserta, kunci: k.nilai_dikunci, pjmk: k.pjmk === 'ya', periode_id: k.periode_id, prodi_id: mk.prodi_id
                };
            }).filter(function(r) {
                if (st.periode && r.periode_id != st.periode) { return false; }
                if (st.prodi && r.prodi_id != st.prodi) { return false; }
                return !q || [r.kur, r.mk, r.prodi, r.kelas, r.pengajar, r.jadwal, r.metode].join(' ').toLowerCase().indexOf(q) >= 0;
            }).sort(function(a, b) { return (a.kodemk + a.kelas).localeCompare(b.kodemk + b.kelas); });
        }
    },

    view: {
        // bungkus kolom teknis form (yang sudah dirender DonatJS) ke <details> tertutup; kolom tetap berada di dalam <form> sehingga ikut tersimpan
        lanjut: function(ids, label) {
            var f = d.gebi('form'); if (!f) { return; }
            var box = document.createElement('details'), n = 0; box.className = 'lanjut';
            ids.forEach(function(i) { var el = f.querySelector('[name="' + i + '"]'), w = el && el.closest('.col-1-1'); if (w) { box.appendChild(w); n++; } });
            if (!n) { return; }
            var sm = document.createElement('summary'); sm.textContent = label + ' (' + n + ' kolom)'; box.insertBefore(sm, box.firstChild);
            f.appendChild(box);
        },
        table: function(rows) {
            var e = kuliah.model.esc;
            if (!rows.length) { return '<p>Data tidak tersedia.</p>'; }
            return '<table class="table"><thead><tr><th>Kur.</th><th>Mata Kuliah</th><th>Prodi Pengampu</th><th>Nama Kelas</th><th>Pengajar</th><th>Jadwal Mingguan</th><th>Kap.</th><th>Pst.</th><th>Nilai Dikunci</th><th>PJMK</th><th>Aksi</th></tr></thead><tbody>' +
            rows.map(function(r) {
                return '<tr data-id="' + r.id + '" style="cursor:pointer" onclick="kuliah.controller.edit(' + r.id + ')"><td>' + e(r.kur) + '</td>' +
                '<td>' + e(r.mk) + (r.metode ? '<br><span class="badge" style="white-space:nowrap;background:#2b9fc9">' + e(r.metode) + '</span>' : '') + '</td>' +
                '<td>' + e(r.prodi) + '</td><td>' + e(r.kelas) + '</td><td>' + e(r.pengajar) + '</td><td>' + e(r.jadwal) + '</td>' +
                '<td style="text-align:right">' + e(r.kap) + '</td><td style="text-align:right">' + e(r.pst) + '</td>' +
                '<td><span class="badge" style="white-space:nowrap;background:' + (r.kunci === 'Dikunci' ? '#2e7d32' : '#d9534f') + '">' + e(r.kunci) + '</span></td>' +
                '<td style="text-align:center">' + (r.pjmk ? '&#10004;' : '') + '</td>' +
                '<td style="white-space:nowrap"><button class="' + css.button + ' btn-mini" title="Jadwal Perkuliahan kelas ' + e(r.kelas) + '" onclick="event.stopPropagation(); navigate(\'kuliah/jadwal/' + r.id + '\')">Jadwal (' + kuliah.model.sesi(r.id).length + ')</button></td></tr>';
            }).join('') + '</tbody></table>';
        }
    },

    controller: {
        kuliah: function() {
            var ds = kuliah.model.data(), st = kuliah.st; st.jadwal = 0; st.semua = false;
            if (!st.periode) { st.periode = kuliah.model.aktif(); }
            var opt = function(arr, val, label, all) { return (all ? '<option value="0">' + all + '</option>' : '') + arr.map(function(x) { return '<option value="' + x.id + '"' + (x.id == val ? ' selected' : '') + '>' + label(x) + '</option>'; }).join(''); };
            d.gebi('content').innerHTML = `
                <div class="dash">
                    <div class="dash-head"><div><h2>Kelas Kuliah</h2><small>Daftar Kelas &amp; Jadwal Perkuliahan</small></div>${window.notif ? notif.bell() : ''}</div>
                    <div class="row"><div class="col-1-1"><div class="shadow">
                        <div style="display:flex;flex-wrap:wrap;gap:8px">
                            <select class="input" style="flex:1;min-width:160px" onchange="kuliah.controller.set('periode',this.value)">${opt(ds.periode.data.slice().reverse(), st.periode, function(p) { return p.nama; })}</select>
                            <select class="input" style="flex:1;min-width:160px" onchange="kuliah.controller.set('prodi',this.value)">${opt(ds.prodi.data, st.prodi, function(p) { return p.jenjang + ' - ' + p.nama; }, '-- Semua Program Studi --')}</select>
                            <input class="input" style="flex:2;min-width:180px" type="text" placeholder="Cari Kelas Kuliah" value="${kuliah.model.esc(st.q)}" onkeyup="kuliah.controller.set('q',this.value)">
                            <select class="input" onchange="kuliah.controller.set('rpp',this.value)">${[5, 10, 50].map(function(n) { return '<option' + (n == st.rpp ? ' selected' : '') + '>' + n + '</option>'; }).join('')}</select>
                        </div>
                        <div id="kuliah-table" style="overflow-x:auto"></div>
                        <div id="kuliah-paging" class="gpaging" style="margin-top:10px"></div>
                    </div></div></div>
                </div>`;
            kuliah.controller.draw();
        },

        // d.url(modul) memanggil view() setelah simpan/hapus: kembali ke halaman yang sedang dibuka
        view: function() { if (kuliah.st.semua) { kuliah.controller.jadwalSemua(); } else if (kuliah.st.jadwal) { kuliah.controller.jadwal(kuliah.st.jadwal); } else { kuliah.controller.kuliah(); } },

        /* klik baris -> drawer. Default: RINGKASAN padat + baris tombol aksi (tanpa form).
           Tombol "Edit" (mode 'form') menampilkan form DonatJS dengan kolom teknis di bagian "Lanjutan". */
        edit: function(id, mode) {
            var ds = kuliah.model.data(), k = kuliah.model.find('kelas', id); if (!k) { return; }
            var mk = kuliah.model.find('matakuliah', k.matakuliah_id) || {}, pr = kuliah.model.find('prodi', mk.prodi_id) || {};
            var pe = kuliah.model.find('periode', k.periode_id) || {}, ds1 = kuliah.model.find('dosen', k.dosen_id) || {}, ru = kuliah.model.find('ruangan', k.ruangan_id), e = kuliah.model.esc;
            var jml = kuliah.model.sesi(k.id).length, judul = 'Kelas ' + k.kode + ' - ' + (mk.nama || '');
            var btn = function(label, icon, act, on, extra) {
                return '<button class="' + css.button + (extra ? ' ' + extra : '') + '"' + (on ? ' onclick="' + act + '"' : ' disabled title="Belum tersedia" style="opacity:.45;cursor:not-allowed"') + '> <img data-src="?' + icon + '/32x32" alt="Donat"> ' + label + '</button>';
            };
            modul = 'kuliah';
            d.service.param.t = 'kelas';
            d.model.edit.input.tipe = ds.kelas.tipe;
            d.model.edit.input.data = k;

            if (mode === 'form') {
                d.sidePanel(judul, '<div class="aksi-bar">' + btn('Ringkasan', 'prev', 'kuliah.controller.edit(' + k.id + ')', true) + '</div>' +
                    d.view.edit(d.model.edit) +
                    '<div class="gButton kanan"><button class="' + css.button + ' red" onclick="kuliah.controller.hapus(' + k.id + ')"> <img data-src="?x/32x32" alt="Donat"> Delete</button></div>');
                kuliah.view.lanjut(kuliah.model.LANJUT_KELAS, 'Lanjutan');
            } else {
                var tgl = function(v) { if (!v) { return ''; } var p = v.split('-'), b = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']; return Number(p[2]) + ' ' + b[p[1] - 1] + ' ' + p[0]; };
                var badge = function(t, c) { return '<span class="badge" style="white-space:nowrap;background:' + c + '">' + e(t) + '</span>'; };
                var row = function(l, v) { return '<tr><th>' + l + '</th><td>' + v + '</td></tr>'; };
                var jadwal = k.hari ? e(k.hari) + ', ' + e(k.jam_mulai) + ' s.d ' + e(k.jam_selesai) + (ru ? ' &middot; Ruang ' + e(ru.kode) : '') + (k.frekuensi ? ' &middot; ' + e(k.frekuensi) : '') : '<span class="redup">Belum ada jadwal mingguan</span>';
                var dosen = e((ds1.nidn || '') + ' - ' + (ds1.nama || '')) + (k.metode_pengajaran ? ' &middot; ' + e(k.metode_pengajaran) : '');
                var rentang = k.tgl_mulai ? e(tgl(k.tgl_mulai)) + ' - ' + e(tgl(k.tgl_selesai)) + (k.jumlah_pertemuan ? ' &middot; ' + e(k.jumlah_pertemuan) + ' pertemuan' : '') + (k.sistem_kuliah ? ' &middot; ' + e(k.sistem_kuliah) : '') : '';
                var info = '<table class="table ringkas"><tbody>' +
                    row('Mata Kuliah', e((mk.kode || '') + ' - ' + (mk.nama || '') + ' (' + Number(mk.sks || 0) + ' SKS' + (mk.semester ? ', Smt ' + mk.semester : '') + ')') + (mk.metode ? ' ' + badge(mk.metode, '#2b9fc9') : '')) +
                    row('Kelas', e(k.kode) + ' &middot; ' + e((pr.jenjang || '') + ' - ' + (pr.nama || '')) + ' &middot; ' + e(pe.nama) + (k.kurikulum ? ' &middot; Kur. ' + e(k.kurikulum) : '')) +
                    row('Jadwal', jadwal) +
                    row('Peserta', e(k.peserta) + ' / ' + e(k.kapasitas) + ' ' + badge(k.nilai_dikunci, k.nilai_dikunci === 'Dikunci' ? '#2e7d32' : '#d9534f') + (k.kampus_berdampak === 'ya' ? ' ' + badge('Kampus Berdampak', '#777') : '')) +
                    row('Dosen', dosen) + (rentang ? row('Periode Kuliah', rentang) : '') +
                    '</tbody></table>';
                var st = (window.absen && absen.model && absen.model.load) ? 1 : 0;
                d.sidePanel(judul, '<div class="aksi-bar">' +
                    btn('Jadwal Perkuliahan (' + jml + ')', 'menu', "d.closePanel(); navigate('kuliah/jadwal/" + k.id + "')", true) +
                    btn('Presensi', 'check', 'kuliah.controller.presensi(' + k.id + ')', st && jml > 0) +
                    btn('Peserta', 'menu', '', false) + btn('Nilai', 'menu', '', false) +
                    btn('Edit', 'pen', 'kuliah.controller.edit(' + k.id + ', \'form\')', true) + '</div>' + info);
            }
            if (typeof d.renderImage === 'function') { d.renderImage(); }
        },

        // buka Presensi untuk kelas ini (absen.js menyimpan kelas terpilih lewat absen.model.load/store)
        presensi: function(id) {
            try { var st = absen.model.load(); st.kelas_id = id; st.ke = 1; absen.model.store(st); } catch (x) {}
            d.closePanel(); navigate('absen/absen/1');
        },

        /* Jadwal Perkuliahan per kelas (SEVIMA data_perkuliahan): daftar sesi; klik baris -> drawer form sesi */
        jadwal: function(kid) {
            if (!Number(kid)) { return kuliah.controller.jadwalSemua(); }
            var k = kuliah.model.find('kelas', kid), e = kuliah.model.esc;
            if (!k) { d.gebi('content').innerHTML = '<p>Kelas tidak ditemukan.</p>'; return; }
            kuliah.st.jadwal = k.id; kuliah.st.semua = false; modul = 'kuliah';
            var mk = kuliah.model.find('matakuliah', k.matakuliah_id) || {}, pr = kuliah.model.find('prodi', mk.prodi_id) || {}, pe = kuliah.model.find('periode', k.periode_id) || {};
            var ruang = function(id) { var r = kuliah.model.find('ruangan', id); return r ? r.kode : '-'; };
            var rows = kuliah.model.sesi(k.id);
            var ring = function(l, v) { return '<tr><th style=\"width:42%\">' + l + '</th><td>' + (v === '' || v == null ? '-' : v) + '</td></tr>'; };
            var warna = { dimulai: '#2b9fc9', berlangsung: '#f0ad4e', selesai: '#2e7d32', terjadwal: '#777' };
            var tabel = rows.length ? '<table class=\"table\"><thead><tr><th>Sesi</th><th>Tanggal</th><th>Waktu</th><th>Jenis</th><th>Metode</th><th>Ruang</th><th>Status</th><th>Rencana Materi</th><th>Realisasi</th></tr></thead><tbody>' +
                rows.map(function(p) {
                    return '<tr data-id=\"' + p.id + '\" style=\"cursor:pointer\" onclick=\"kuliah.controller.sesi(' + p.id + ')\"><td style=\"text-align:right\">' + e(p.ke) + '</td>' +
                    '<td style="white-space:nowrap">' + e(kuliah.model.namaHari(p.tanggal)) + ', ' + e(kuliah.model.tgl(p.tanggal)) + '</td><td style="white-space:nowrap">' + e(p.jam_mulai) + ' - ' + e(p.jam_selesai) + '</td>' +
                    '<td>' + e(p.jenis) + '</td><td>' + e(p.metode) + '</td><td>' + e(ruang(p.ruangan_id)) + '</td>' +
                    '<td><span class=\"badge\" style=\"white-space:nowrap;background:' + (warna[p.status] || '#777') + '\">' + e(p.status) + '</span></td>' +
                    '<td>' + e(p.materi) + '</td><td style=\"text-align:center\">' + (p.realisasi ? '&#10004;' : '') + '</td></tr>';
                }).join('') + '</tbody></table>' : '<p>Belum ada sesi perkuliahan untuk kelas ini.</p>';
            d.gebi('content').innerHTML = `
                <div class=\"dash\">
                    <div class=\"dash-head\"><div><h2>Jadwal Perkuliahan</h2><small>Data Jadwal - Kelas ${e(k.kode)}</small></div>${window.notif ? notif.bell() : ''}</div>
                    <div class=\"row\"><div class=\"col-1-1\"><div class=\"shadow\">
                        <div class=\"gButton kanan\" style=\"margin-bottom:10px\">
                            <button class=\"${css.button}\" onclick=\"navigate('kuliah/kuliah/1')\"> <img data-src=\"?prev/32x32\" alt=\"Donat\"> Kembali ke Daftar</button>
                            <button class=\"${css.button}\" onclick=\"kuliah.controller.tambahSesi(${k.id})\"> <img data-src=\"?plus/32x32\" alt=\"Donat\"> Tambah Sesi</button>
                        </div>
                        <table class=\"table\" style=\"margin:0 0 12px\"><tbody>` +
                            ring('Program Studi', e((pr.jenjang || '') + ' - ' + (pr.nama || ''))) + ring('Periode', e(pe.nama)) +
                            ring('Mata Kuliah', e((mk.kode || '') + ' - ' + (mk.nama || '') + ' - ' + Number(mk.sks || 0) + ' SKS')) + ring('Nama Kelas', e(k.kode)) +
                            ring('Kurikulum', e(k.kurikulum)) + ring('Sistem Kuliah', e(k.sistem_kuliah)) + ring('Kapasitas', e(k.kapasitas)) + ring('Peserta', e(k.peserta)) +
                        `</tbody></table>
                        <div style=\"overflow-x:auto\">${tabel}</div>
                        <p><small>${rows.length} sesi tercatat dari ${e(k.jumlah_pertemuan || 0)} pertemuan.</small></p>
                    </div></div></div>
                </div>`;
            if (typeof d.renderImage === 'function') { d.renderImage(); }
        },

        /* Jadwal Perkuliahan semua kelas (menu samping Perkuliahan > Jadwal Perkuliahan), filter per kelas */
        jadwalSemua: function() {
            var ds = kuliah.model.data(), st = kuliah.st, e = kuliah.model.esc; st.semua = true; st.jadwal = 0; modul = 'kuliah';
            if (!st.periode) { st.periode = kuliah.model.aktif(); }
            var kelas = ds.kelas.data.filter(function(k) { return k.periode_id == st.periode; });
            var nama = function(k) { var mk = kuliah.model.find('matakuliah', k.matakuliah_id) || {}; return k.kode + ' - ' + (mk.nama || ''); };
            var ada = {}; kelas.forEach(function(k) { ada[k.id] = k; });
            var rows = ds.pertemuan.data.filter(function(p) { return ada[p.kelas_id] && (!st.jf || p.kelas_id == st.jf); })
                .sort(function(a, b) { return (a.tanggal + a.jam_mulai).localeCompare(b.tanggal + b.jam_mulai); });
            var warna = { dimulai: '#2b9fc9', berlangsung: '#f0ad4e', selesai: '#2e7d32', terjadwal: '#777' };
            var ruang = function(id) { var r = kuliah.model.find('ruangan', id); return r ? r.kode : '-'; };
            var tabel = rows.length ? '<table class="table"><thead><tr><th>Kelas</th><th>Sesi</th><th>Tanggal</th><th>Waktu</th><th>Jenis</th><th>Ruang</th><th>Status</th><th>Rencana Materi</th></tr></thead><tbody>' +
                rows.map(function(p) {
                    return '<tr data-id="' + p.id + '" style="cursor:pointer" onclick="kuliah.controller.sesi(' + p.id + ')"><td style="white-space:nowrap">' + e(nama(ada[p.kelas_id])) + '</td><td style="text-align:right">' + e(p.ke) + '</td>' +
                    '<td style="white-space:nowrap">' + e(kuliah.model.namaHari(p.tanggal)) + ', ' + e(kuliah.model.tgl(p.tanggal)) + '</td><td style="white-space:nowrap">' + e(p.jam_mulai) + ' - ' + e(p.jam_selesai) + '</td>' +
                    '<td>' + e(p.jenis) + '</td><td>' + e(ruang(p.ruangan_id)) + '</td><td><span class="badge" style="white-space:nowrap;background:' + (warna[p.status] || '#777') + '">' + e(p.status) + '</span></td><td>' + e(p.materi) + '</td></tr>';
                }).join('') + '</tbody></table>' : '<p>Belum ada sesi perkuliahan.</p>';
            d.gebi('content').innerHTML = `
                <div class="dash">
                    <div class="dash-head"><div><h2>Jadwal Perkuliahan</h2><small>Semua sesi kelas pada periode terpilih</small></div>${window.notif ? notif.bell() : ''}</div>
                    <div class="row"><div class="col-1-1"><div class="shadow">
                        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
                            <select class="input" style="flex:2;min-width:220px" onchange="kuliah.controller.jf(this.value)"><option value="0">-- Semua Kelas --</option>${kelas.map(function(k) { return '<option value="' + k.id + '"' + (k.id == st.jf ? ' selected' : '') + '>' + e(nama(k)) + '</option>'; }).join('')}</select>
                            ${st.jf ? '<button class="' + css.button + '" onclick="kuliah.controller.tambahSesi(' + st.jf + ')"> <img data-src="?plus/32x32" alt="Donat"> Tambah Sesi</button>' : ''}
                        </div>
                        <div style="overflow-x:auto">${tabel}</div>
                        <p><small>${rows.length} sesi.</small></p>
                    </div></div></div>
                </div>`;
            if (typeof d.renderImage === 'function') { d.renderImage(); }
        },
        jf: function(v) { kuliah.st.jf = Number(v); kuliah.controller.jadwalSemua(); },

        // klik baris sesi -> drawer form (urutan field mengikuti form SEVIMA)
        sesi: function(id) {
            var ds = kuliah.model.data(), p = kuliah.model.find('pertemuan', id); if (!p) { return; }
            modul = 'kuliah'; if (!kuliah.st.semua) { kuliah.st.jadwal = p.kelas_id; }
            d.service.param.t = 'pertemuan';
            d.model.edit.input.tipe = ds.pertemuan.tipe;
            d.model.edit.input.data = p;
            d.sidePanel('Sesi ' + p.ke + ' - ' + kuliah.model.tgl(p.tanggal), d.view.edit(d.model.edit) +
                '<div class=\"gButton kanan\"><button class=\"' + css.button + ' red\" onclick=\"kuliah.controller.hapusSesi(' + p.id + ')\"> <img data-src=\"?x/32x32\" alt=\"Donat\"> Delete</button></div>');
            kuliah.view.lanjut(kuliah.model.LANJUT_SESI, 'Lanjutan');
            if (typeof d.renderImage === 'function') { d.renderImage(); }
        },
        tambahSesi: function(kid) {
            var ds = kuliah.model.data(), k = kuliah.model.find('kelas', kid), rows = kuliah.model.sesi(kid), last = rows[rows.length - 1];
            var baru = {}; ds.pertemuan.tipe.forEach(function(t) { baru[t.id] = ''; });
            // isian awal: lanjutan sesi terakhir (jadwal mingguan kelas, 7 hari setelahnya)
            var tg = last ? new Date(last.tanggal + 'T00:00:00') : null; if (tg) { tg.setDate(tg.getDate() + 7); }
            Object.assign(baru, { kelas_id: k.id, ke: last ? last.ke + 1 : 1, tanggal: tg ? tg.toISOString().slice(0, 10) : '', jam_mulai: k.jam_mulai || '', jam_selesai: k.jam_selesai || '',
                jenis: 'Kuliah', status: 'terjadwal', metode: 'Offline', ruangan_id: k.ruangan_id || 0, sks: (kuliah.model.find('matakuliah', k.matakuliah_id) || {}).sks || '', dosen_id: k.dosen_id, dosen_pengganti: 'tidak', presensi_dosen: 0 });
            modul = 'kuliah'; if (!kuliah.st.semua) { kuliah.st.jadwal = k.id; }
            d.service.param.t = 'pertemuan';
            d.model.add.input.tipe = ds.pertemuan.tipe;
            d.model.add.input.data = baru;
            d.sidePanel('Tambah Sesi - Kelas ' + k.kode, d.view.edit(d.model.add));
            kuliah.view.lanjut(kuliah.model.LANJUT_SESI, 'Lanjutan');
            if (typeof d.renderImage === 'function') { d.renderImage(); }
        },
        hapusSesi: function(id) {
            if (!confirm('Hapus sesi ini?')) { return; }
            d.model.id = String(id);
            d.service.param.mod = 'delete';
            d.service.param.t = 'pertemuan';
            d.service.get(function() { d.closePanel(); d.info('Terhapus'); kuliah.controller.view(); });
        },
        hapus: function(id) {
            if (!confirm('Hapus kelas ini?')) { return; }
            d.model.id = String(id);
            d.service.param.mod = 'delete';
            d.service.param.t = 'kelas';
            d.service.get(function() { d.closePanel(); d.info('Terhapus'); kuliah.controller.kuliah(); });
        },
        set: function(k, v) {
            var st = kuliah.st;
            st[k] = (k === 'q') ? v : Number(v);
            st.page = 1;
            kuliah.controller.draw();
        },
        go: function(n) { kuliah.st.page = n; kuliah.controller.draw(); },
        draw: function() {
            var st = kuliah.st, rows = kuliah.model.rows(), np = Math.max(1, Math.ceil(rows.length / st.rpp));
            if (st.page > np) { st.page = np; }
            d.gebi('kuliah-table').innerHTML = kuliah.view.table(rows.slice((st.page - 1) * st.rpp, st.page * st.rpp));
            var p = st.page === 1 ? 'hide' : 'show', n = st.page === np ? 'hide' : 'show';
            if (rows.length < st.rpp) { p = 'hide'; n = 'hide'; }
            d.gebi('kuliah-paging').innerHTML = '<div class="gPaging">' +
                '<button class="button ' + p + '" onclick="kuliah.controller.go(' + (st.page - 1) + ')"><img data-src="?prev/32x32"> Prev </button>' +
                '<button class="button ' + n + '" onclick="kuliah.controller.go(' + (st.page + 1) + ')"> <img data-src="?next/32x32"> Next </button>' +
                '<span>page: ' + st.page + '/' + np + ' data:' + rows.length + ' row(s) </span></div>';
            if (typeof d.renderImage === 'function') { d.renderImage(); }
        }
    }
};
