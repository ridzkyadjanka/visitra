import 'server-only';
import { query, one } from './db';
import { todayKey, addDays, TZ } from './time';

export function parseFilters(sp) {
  const today = todayKey();
  const valid = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : null);
  return {
    from: valid(sp.from) || addDays(today, -29),
    to: valid(sp.to) || today,
    department: sp.department || '',
    pic: Number(sp.pic) || '',
    status: sp.status || '',
  };
}

function buildWhere(f) {
  const where = [`v.queue_date BETWEEN $1 AND $2`, `v.status IN ('REGISTERED','CHECKED_IN','CHECKED_OUT','CANCELLED')`];
  const params = [f.from, f.to];
  if (f.department) { params.push(f.department); where.push(`p.department = $${params.length}`); }
  if (f.pic) { params.push(f.pic); where.push(`v.pic_id = $${params.length}`); }
  if (f.status) { params.push(f.status); where.push(`v.status = $${params.length}`); }
  return { sql: 'WHERE ' + where.join(' AND '), params };
}

export async function getReport(f) {
  const { sql, params } = buildWhere(f);
  const base = `FROM visits v LEFT JOIN pics p ON p.id = v.pic_id ${sql}`;
  const [summary, daily, byPurpose, byDept, byPic, byHour] = await Promise.all([
    one(`SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE v.status='CHECKED_OUT')::int AS done,
                COUNT(*) FILTER (WHERE v.status='CANCELLED')::int AS cancelled,
                COUNT(DISTINCT v.institution)::int AS institutions,
                COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (v.check_out_at - v.check_in_at))/60) FILTER (WHERE v.status='CHECKED_OUT')),0)::int AS avg_min
         ${base}`, params),
    query(`SELECT v.queue_date AS d, COUNT(*)::int AS total ${base} GROUP BY 1 ORDER BY 1`, params),
    query(`SELECT v.purpose AS name, COUNT(*)::int AS value ${base} GROUP BY 1 ORDER BY 2 DESC`, params),
    query(`SELECT COALESCE(p.department,'Tanpa PIC') AS name, COUNT(*)::int AS value ${base} GROUP BY 1 ORDER BY 2 DESC`, params),
    query(`SELECT COALESCE(p.name,'Tanpa PIC') AS name, COALESCE(p.department,'-') AS department, COUNT(*)::int AS value,
                  COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (v.check_out_at - v.check_in_at))/60)),0)::int AS avg_min
           ${base} GROUP BY 1,2 ORDER BY 3 DESC LIMIT 10`, params),
    query(`SELECT EXTRACT(HOUR FROM v.check_in_at AT TIME ZONE '${TZ}')::int AS h, COUNT(*)::int AS n ${base} AND v.check_in_at IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 1`, params),
  ]);
  const days = Math.max(1, Math.round((new Date(f.to) - new Date(f.from)) / 86400000) + 1);
  // isi tanggal kosong
  const map = Object.fromEntries(daily.map((r) => [r.d, r.total]));
  const series = Array.from({ length: Math.min(days, 366) }, (_, i) => {
    const d = addDays(f.from, i);
    return { d, label: `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`, total: map[d] || 0 };
  });
  return { summary: { ...summary, perDay: Math.round(summary.total / days), peakHour: byHour[0]?.h }, series, byPurpose, byDept, byPic };
}

export async function getReportRows(f, limit = 10000) {
  const { sql, params } = buildWhere(f);
  return query(
    `SELECT v.visit_code, v.queue_number, v.queue_date, v.name, v.institution, v.phone, v.purpose,
            p.name AS pic_name, p.department, v.check_in_at, v.check_out_at, v.status,
            CASE WHEN v.check_out_at IS NOT NULL THEN ROUND(EXTRACT(EPOCH FROM (v.check_out_at - v.check_in_at))/60)::int END AS duration
       FROM visits v LEFT JOIN pics p ON p.id = v.pic_id ${sql}
      ORDER BY v.queue_date, v.check_in_at NULLS LAST LIMIT ${limit}`,
    params,
  );
}
