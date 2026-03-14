export const formatDateToBR = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  try {
    if (typeof dateString === 'string') {
      // Already dd/mm/aaaa
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
      // YYYY-MM-DD — parse directly to avoid timezone shift
      const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
      }
      // Full ISO string — also extract date part directly
      const fullIsoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})T/);
      if (fullIsoMatch) {
        return `${fullIsoMatch[3]}/${fullIsoMatch[2]}/${fullIsoMatch[1]}`;
      }
    }
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

export const formatDateToBRShort = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  try {
    if (typeof dateString === 'string') {
      const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1].slice(-2)}`;
      }
    }
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

export const parseBRDateToISO = (brDateString: string): string | null => {
  if (!brDateString) return null;
  try {
    const [day, month, year] = brDateString.split('/');
    if (!day || !month || !year) return null;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month}-${day}`;
  } catch {
    return null;
  }
};
