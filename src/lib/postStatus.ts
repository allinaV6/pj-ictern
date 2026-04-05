export type PostStatusLike = {
  internship_status?: number | string | null;
  internship_expired_date?: string | null;
};

export const normalizeDateToISO = (dateString: string | undefined | null): string | null => {
  if (!dateString) return null;

  const text = String(dateString).trim();
  if (!text || text === '0000-00-00') return null;

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) {
      return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
        .toString()
        .padStart(2, '0')}`;
    }
  }

  const dmyMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    let year = Number(dmyMatch[3]);

    if (year > 2400) year -= 543;
    if (year < 100) year += 2000;

    const parsed = new Date(year, month - 1, day);
    if (!Number.isNaN(parsed.getTime())) {
      return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
        .toString()
        .padStart(2, '0')}`;
    }
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = parsed.getMonth() + 1;
  const day = parsed.getDate();
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
};

export const getThailandTodayISO = (): string => {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
};

export const formatThaiDateOnly = (dateString: string | undefined | null): string => {
  const iso = normalizeDateToISO(dateString);
  if (!iso) return '-';

  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('th-TH');
};

export const getDaysLeftFromToday = (dateString: string | undefined | null): number | null => {
  const iso = normalizeDateToISO(dateString);
  if (!iso) return null;

  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date(`${getThailandTodayISO()}T00:00:00`);
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetOnly = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return Math.ceil((targetOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));
};

export const isPostOpenByDateAndStatus = (post: PostStatusLike): boolean => {
  const statusValue = Number(post.internship_status ?? 1);
  if (statusValue === 0) return false;

  const expireISO = normalizeDateToISO(post.internship_expired_date);
  if (!expireISO) return statusValue === 1;

  // Close on the expiry date itself; only dates after today are considered open.
  return expireISO > getThailandTodayISO();
};
