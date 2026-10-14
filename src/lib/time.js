export const TZ = process.env.APP_TIMEZONE || 'Asia/Jakarta';

const TZ_LABEL = { 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' };
export const tzLabel = TZ_LABEL[TZ] || TZ;

export function todayKey(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}
export function fmtDate(v, opts = {}) {
  if (!v) return '-';
  const d = typeof v === 'string' && v.length === 10 ? new Date(v + 'T12:00:00Z') : new Date(v);
  return new Intl.DateTimeFormat('id-ID', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', ...opts }).format(d);
}
export function fmtDateLong(v) {
  return fmtDate(v, { weekday: 'long', month: 'long' });
}
export function fmtTime(v) {
  if (!v) return '-';
  return new Intl.DateTimeFormat('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(v)).replace('.', ':');
}
export function fmtDateTime(v) {
  if (!v) return '-';
  return `${fmtDate(v)}, ${fmtTime(v)}`;
}
export function minutesBetween(a, b) {
  if (!a) return null;
  return Math.max(0, Math.round((new Date(b || Date.now()) - new Date(a)) / 60000));
}
export function fmtDuration(min) {
  if (min == null) return '-';
  if (min < 60) return `${min} menit`;
  return `${Math.floor(min / 60)} jam ${min % 60} menit`;
}
// "2026-10-15" + "10:30" (waktu lokal TZ) -> Date UTC
export function localToDate(key, hhmm) {
  const [y, m, d] = key.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(guess);
  const g = (t) => Number(p.find((x) => x.type === t).value);
  const offset = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute')) - guess.getTime();
  return new Date(guess.getTime() - offset);
}
export function localHHMM(v) {
  return fmtTime(v);
}
