/* Presensi mahasiswa (pengganti halaman Kasir). Tata letak:
   pencarian + chip + kartu + panel samping. Data dari dataset.js (kelas, pertemuan, krs, mahasiswa, presensi).
   Status: H hadir, I izin, S sakit, A alpha. Tersimpan otomatis ke localStorage ('dataset'). */
var absen = {
    q: '',
    STATUS: { H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alpha' },

    model: {
        data: function() { d.service.init(); return dataset; },
        kelas: function() {
            var ds = absen.model.data();
            return ds.kelas.data.filter(function(k) { return ds.pertemuan.data.some(function(p) { return p.kelas_id == k.id; }); });
        },
        nama: function(k) {
            var m = absen.model.data().matakuliah.data.find(function(x) { return x.id == k.matakuliah_id; });
            return (m ? m.nama : '-') + ' (' + k.kode + ')';
        },
        load: function() {
            var s = d.getls('absen'), st = {};
            try { st = s ? JSON.parse(s) : {}; } catch (e) { st = {}; }
            st = Object.assign({ kelas_id: 0, ke: 1 }, st);
            var ks = absen.model.kelas();
            if (!ks.some(function(k) { return k.id == st.kelas_id; })) { st.kelas_id = ks.length ? ks[0].id : 0; }
            return st;
        },
        store: function(st) { d.setls('absen', st); },
        pertemuan: function(st) {
            return absen.model.data().pertemuan.data.find(function(p) { return p.kelas_id == st.kelas_id && p.ke == st.ke; });
        },
        daftarPertemuan: function(st) {
            return absen.model.data().pertemuan.data.filter(function(p) { return p.kelas_id == st.kelas_id; });
        },
        peserta: function(st) {
            var ds = absen.model.data();
            return ds.krs.data.filter(function(r) { return r.kelas_id == st.kelas_id && r.status == 'disetujui'; }).map(function(r) {
                return ds.mahasiswa.data.find(function(m) { return m.id == r.mahasiswa_id; });
            }).filter(Boolean);
        },
        status: function(pid, mid) {
            var r = absen.model.data().presensi.data.find(function(x) { return x.pertemuan_id == pid && x.mahasiswa_id == mid; });
            return r ? r.status : '';
        },
        // status kosong = hapus baris presensi
        set: function(pid, mid, s) {
            var ds = absen.model.data(), rows = ds.presensi.data;
            var r = rows.find(function(x) { return x.pertemuan_id == pid && x.mahasiswa_id == mid; });
            if (!s) { ds.presensi.data = rows.filter(function(x) { return x !== r; }); }
            else if (r) { r.status = s; }
            else {
                var max = 0; rows.forEach(function(x) { if (x.id > max) { max = x.id; } });
                rows.push({ id: max + 1, pertemuan_id: pid, mahasiswa_id: mid, status: s });
            }
        },
        // presensi dosen dianggap terisi bila minimal 50% peserta sudah dipresensi (aturan Sevima)
        sinkron: function(st) {
            var p = absen.model.pertemuan(st), ps = absen.model.peserta(st);
            if (!p) { return; }
            var isi = ps.filter(function(m) { return absen.model.status(p.id, m.id); }).length;
            p.presensi_dosen = (ps.length && isi * 2 >= ps.length) ? 1 : 0;
            d.setls('dataset', absen.model.data());
        },
        rekap: function(st) {
            var p = absen.model.pertemuan(st), ps = absen.model.peserta(st);
            var r = { H: 0, I: 0, S: 0, A: 0, kosong: 0, total: ps.length };
            ps.forEach(function(m) { var s = p ? absen.model.status(p.id, m.id) : ''; if (s) { r[s]++; } else { r.kosong++; } });
            r.persen = r.total ? Math.round(r.H / r.total * 100) : 0;
            return r;
        }
    },

    controller: {
        absen: function() {
            d.gebi('content').innerHTML = `
                <div class="row shadow pos-top">
                    <div class="search">
                        <input id="pos-search" class="input" type="text" placeholder="Cari nama atau NIM mahasiswa" value="${absen.q}" onkeyup="absen.controller.find(this.value)">
                        <button id="pos-badge" onclick="absen.controller.rekap()"> <img data-src="?check/32x32" alt="Donat"> <span id="pos-badge-text">Rekap</span></button>
                    </div>
                    <div id="pos-chips" class="gButton"></div>
                    <div id="pos-ke" class="gButton"></div>
                    <p id="absen-info" class="info" style="margin:8px 5px 0"></p>
                </div>
                <div id="pos-grid" class="row card-container"></div>`;
            absen.controller.chips();
        },

        chips: function() {
            var st = absen.model.load();
            d.gebi('pos-chips').innerHTML = absen.model.kelas().map(function(k) {
                return ui.chip(absen.model.nama(k), st.kelas_id == k.id, 'absen.controller.kelas(' + k.id + ')');
            }).join('');
            d.gebi('pos-ke').innerHTML = absen.model.daftarPertemuan(st).map(function(p) {
                return ui.chip('P' + p.ke, st.ke == p.ke, 'absen.controller.ke(' + p.ke + ')');
            }).join('');
            var p = absen.model.pertemuan(st);
            d.gebi('absen-info').innerHTML = p ? `<b>Pertemuan ${p.ke}</b> | ${p.tanggal} ${p.jam_mulai} | ${p.materi.replace(/^Pertemuan \d+: /, '')} | Presensi dosen: ${p.presensi_dosen ? 'sudah' : 'belum'}` : 'Belum ada pertemuan.';
            absen.controller.grid();
        },

        kelas: function(id) { var st = absen.model.load(); st.kelas_id = id; st.ke = 1; absen.model.store(st); absen.controller.chips(); },
        ke: function(n) { var st = absen.model.load(); st.ke = n; absen.model.store(st); absen.controller.chips(); },
        find: function(v) { absen.q = v; absen.controller.grid(); },

        grid: function() {
            var st = absen.model.load(), p = absen.model.pertemuan(st), q = absen.q.toLowerCase();
            var list = absen.model.peserta(st).filter(function(m) { return !q || (m.nama + ' ' + m.nim).toLowerCase().indexOf(q) >= 0; });
            d.gebi('pos-grid').innerHTML = list.map(function(m) {
                var s = p ? absen.model.status(p.id, m.id) : '';
                var btn = ['H', 'I', 'S', 'A'].map(function(k) {
                    return ui.chip(k, s == k, "absen.controller.tandai(" + m.id + ",'" + k + "')", ' style="padding:4px 10px;margin:0" title="' + absen.STATUS[k] + '"');
                }).join('');
                return `
<div class="col-1-4">
  <div class="card shadow">
    <img data-src="?person/150x150" alt="${m.nama}">
    <strong>${m.nama}</strong>
    <div class="artikel">${m.nim}
      <small>${s ? absen.STATUS[s] : 'Belum presensi'}</small>
    </div>
    <div class="gButton" style="gap:4px;margin:4px 0 0">${btn}</div>
  </div>
</div>`;
            }).join('') || '<div class="artikel">Mahasiswa tidak ditemukan.</div>';
            var r = absen.model.rekap(st), el = d.gebi('pos-badge-text');
            if (el) { el.textContent = 'Rekap (' + (r.total - r.kosong) + '/' + r.total + ')'; }
            ui.gambar();
        },

        tandai: function(mid, s) {
            var st = absen.model.load(), p = absen.model.pertemuan(st);
            if (!p) { d.info('Belum ada pertemuan'); return; }
            absen.model.set(p.id, mid, absen.model.status(p.id, mid) == s ? '' : s);
            absen.model.sinkron(st);
            absen.controller.chips();
        },

        hadirSemua: function() {
            var st = absen.model.load(), p = absen.model.pertemuan(st);
            if (!p) { return; }
            absen.model.peserta(st).forEach(function(m) { absen.model.set(p.id, m.id, 'H'); });
            absen.model.sinkron(st);
            absen.controller.chips();
            absen.controller.rekap();
            d.info('Semua peserta ditandai hadir');
        },

        rekap: function() {
            var st = absen.model.load(), r = absen.model.rekap(st), p = absen.model.pertemuan(st);
            var k = absen.model.kelas().find(function(x) { return x.id == st.kelas_id; });
            var row = function(a, b) { return `<div class="cart-row"><span>${a}</span><span>${b}</span></div>`; };
            var html = `
<div class="info"><strong>${k ? absen.model.nama(k) : '-'}</strong><br>${p ? 'Pertemuan ' + p.ke + ' | ' + p.tanggal : ''}</div>
${row('Hadir', r.H)}${row('Izin', r.I)}${row('Sakit', r.S)}${row('Alpha', r.A)}${row('Belum presensi', r.kosong)}
<div class="cart-row cart-total"><span>Kehadiran</span><span>${r.persen}%</span></div>
<div class="info">Lengkapi presensi setidaknya 50% dari ${r.total} mahasiswa terdaftar.</div>
<div class="cart-actions">
  ${ui.btn('Tutup', 'x', 'd.closePanel()', true, 'Cancel')}
  ${ui.btn('Tandai hadir semua', 'check', 'absen.controller.hadirSemua()', true, 'Add')}
</div>`;
            d.sidePanel('Rekap Presensi', html);
        }
    }
};
