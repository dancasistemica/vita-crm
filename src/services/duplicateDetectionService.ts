import { Lead } from '@/types/crm';
import { ImportValidationResult } from '@/services/importService';
import { DuplicateMatch } from '@/hooks/useImportModal';

export function detectDuplicates(
  validResults: ImportValidationResult[],
  existingLeads: Lead[]
): { clean: ImportValidationResult[]; duplicates: DuplicateMatch[] } {
  const clean: ImportValidationResult[] = [];
  const duplicates: DuplicateMatch[] = [];

  const emailMap = new Map<string, Lead>();
  const phoneMap = new Map<string, Lead>();

  for (const lead of existingLeads) {
    if (lead.email) emailMap.set(lead.email.toLowerCase(), lead);
    if (lead.phone) phoneMap.set(lead.phone.replace(/\D/g, ''), lead);
  }

  for (const result of validResults) {
    if (result.status !== 'success' || !result.data) {
      clean.push(result);
      continue;
    }

    const email = result.data.email?.toLowerCase();
    const phone = result.data.phone?.replace(/\D/g, '');

    const matchByEmail = email ? emailMap.get(email) : undefined;
    const matchByPhone = phone ? phoneMap.get(phone) : undefined;
    const match = matchByEmail || matchByPhone;

    if (match) {
      duplicates.push({
        rowIndex: result.row,
        newData: result.data,
        existingLeadId: match.id,
        existingName: match.name,
        matchField: matchByEmail ? 'email' : 'phone',
        matchValue: matchByEmail ? email! : phone!,
        action: 'skip',
      });
    } else {
      clean.push(result);
    }
  }

  console.log('[DuplicateDetection]', { clean: clean.length, duplicates: duplicates.length });
  return { clean, duplicates };
}
