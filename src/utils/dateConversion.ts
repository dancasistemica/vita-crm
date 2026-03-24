export const convertExcelSerialToISO = (excelSerial: number | string): string | null => {
  if (typeof excelSerial === 'string') {
    const trimmed = excelSerial.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return convertExcelSerialToISO(numeric);
    }
    return null;
  }

  if (typeof excelSerial === 'number') {
    const excelEpoch = Date.UTC(1900, 0, 1);
    const millisecondsPerDay = 86400000;

    const adjustedSerial = excelSerial > 60 ? excelSerial - 1 : excelSerial;
    const timestamp = excelEpoch + adjustedSerial * millisecondsPerDay;
    const date = new Date(timestamp);

    if (date.getFullYear() < 1900 || date.getFullYear() > 2100) {
      console.warn('[DateConversion] Data fora do intervalo válido:', excelSerial);
      return null;
    }

    return date.toISOString();
  }

  return null;
};

export const convertExcelSerialToReadable = (excelSerial: number | string): string => {
  const iso = convertExcelSerialToISO(excelSerial);
  if (!iso) return 'Data inválida';

  const date = new Date(iso);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const isExcelSerialDate = (value: unknown): boolean => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 1 && value < 60000;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) && numeric > 1 && numeric < 60000;
  }
  return false;
};
