import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { getSession, audit } from '@/lib/auth';
import { can, STATUS, maskPhone } from '@/lib/constants';
import { parseFilters, getReport, getReportRows } from '@/lib/reports';
import { getSettings } from '@/lib/settings';
import { fmtDate, fmtTime, fmtDateTime } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await getSession();
  if (!user || !can(user.role, 'reports.view')) return new Response('Tidak diizinkan', { status: 403 });

  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const f = parseFilters(sp);
  const format = sp.format === 'pdf' ? 'pdf' : 'xlsx';
  const [s, rows, rep] = await Promise.all([getSettings(), getReportRows(f), getReport(f)]);
  const showPhone = can(user.role, 'personal.view') || !s.mask_personal;
  const fname = `laporan-kunjungan_${f.from}_sd_${f.to}`;
  await audit(user, 'EXPORT', 'Report', null, `Ekspor ${format.toUpperCase()} ${f.from} s/d ${f.to} (${rows.length} baris)`);

  const table = rows.map((r, i) => ({
    No: i + 1,
    'Kode Kunjungan': r.visit_code,
    'No. Antrean': r.queue_number,
    Tanggal: fmtDate(r.queue_date),
    Nama: r.name,
    Instansi: r.institution,
    'No. HP': showPhone ? r.phone : maskPhone(r.phone),
    Tujuan: r.purpose,
    PIC: r.pic_name || '-',
    Departemen: r.department || '-',
    'Check-in': fmtTime(r.check_in_at),
    'Check-out': fmtTime(r.check_out_at),
    'Durasi (menit)': r.duration ?? '',
    Status: STATUS[r.status]?.label || r.status,
  }));

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const summary = [
      ['LAPORAN KUNJUNGAN TAMU'], [s.company_name], [`Periode: ${fmtDate(f.from)} s/d ${fmtDate(f.to)}`],
      [`Dibuat: ${fmtDateTime(new Date())} oleh ${user.name}`], [],
      ['Total Kunjungan', rep.summary.total], ['Kunjungan Selesai', rep.summary.done], ['Dibatalkan', rep.summary.cancelled],
      ['Rata-rata per Hari', rep.summary.perDay], ['Rata-rata Durasi (menit)', rep.summary.avg_min], ['Jumlah Instansi', rep.summary.institutions],
      [], ['Tujuan Kunjungan', 'Jumlah'], ...rep.byPurpose.map((x) => [x.name, x.value]),
      [], ['Departemen', 'Jumlah'], ...rep.byDept.map((x) => [x.name, x.value]),
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summary);
    ws1['!cols'] = [{ wch: 28 }, { wch: 14 }];
    const ws2 = XLSX.utils.json_to_sheet(table);
    ws2['!cols'] = [5, 20, 10, 14, 24, 24, 15, 18, 18, 14, 9, 9, 13, 11].map((w) => ({ wch: w }));
    ws2['!autofilter'] = { ref: ws2['!ref'] };
    const ws3 = XLSX.utils.json_to_sheet(rep.series.map((x) => ({ Tanggal: x.d, 'Jumlah Kunjungan': x.total })));
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan');
    XLSX.utils.book_append_sheet(wb, ws2, 'Data Kunjungan');
    XLSX.utils.book_append_sheet(wb, ws3, 'Harian');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fname}.xlsx"`,
      },
    });
  }

  // PDF (A4 landscape)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(11, 27, 63);
  doc.rect(0, 0, W, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold').setFontSize(15).text('Laporan Kunjungan Tamu', 14, 12);
  doc.setFont('helvetica', 'normal').setFontSize(9).text(`${s.company_name}  |  Periode ${fmtDate(f.from)} s/d ${fmtDate(f.to)}`, 14, 19);
  doc.text('VISITRA', W - 14, 12, { align: 'right' });

  const cards = [['Total Kunjungan', rep.summary.total], ['Selesai', rep.summary.done], ['Rata-rata / Hari', rep.summary.perDay],
    ['Rata-rata Durasi', `${rep.summary.avg_min} mnt`], ['Instansi', rep.summary.institutions]];
  const cw = (W - 28 - 4 * 4) / 5;
  cards.forEach(([l, v], i) => {
    const x = 14 + i * (cw + 4);
    doc.setDrawColor(226, 232, 240).setFillColor(248, 250, 252).roundedRect(x, 32, cw, 17, 2, 2, 'FD');
    doc.setTextColor(100, 116, 139).setFontSize(8).text(l, x + 4, 38);
    doc.setTextColor(11, 27, 63).setFont('helvetica', 'bold').setFontSize(13).text(String(v), x + 4, 45.5);
    doc.setFont('helvetica', 'normal');
  });

  const cols = ['No', 'Kode Kunjungan', 'Tanggal', 'Nama', 'Instansi', 'Tujuan', 'PIC', 'Masuk', 'Keluar', 'Durasi', 'Status'];
  autoTable(doc, {
    startY: 55,
    head: [cols],
    body: table.map((r) => [r.No, r['Kode Kunjungan'], r.Tanggal, r.Nama, r.Instansi, r.Tujuan, r.PIC, r['Check-in'], r['Check-out'],
      r['Durasi (menit)'] === '' ? '-' : `${r['Durasi (menit)']} m`, r.Status]),
    styles: { fontSize: 7.5, cellPadding: 1.8, textColor: [11, 27, 63] },
    headStyles: { fillColor: [30, 86, 240], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      const H = doc.internal.pageSize.getHeight();
      doc.setFontSize(7.5).setTextColor(148, 163, 184);
      doc.text(`Dicetak ${fmtDateTime(new Date())} oleh ${user.name}`, 14, H - 7);
      doc.text(`Halaman ${doc.getNumberOfPages()}`, W - 14, H - 7, { align: 'right' });
    },
  });
  const pdf = Buffer.from(doc.output('arraybuffer'));
  return new Response(pdf, {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fname}.pdf"` },
  });
}
