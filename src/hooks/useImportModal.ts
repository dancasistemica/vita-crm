import { useState, useCallback } from 'react';
import { CSVRow, ImportValidationResult } from '@/services/importService';

export interface DuplicateMatch {
  rowIndex: number;
  newData: Partial<any>;
  existingLeadId: string;
  existingName: string;
  matchField: 'email' | 'phone';
  matchValue: string;
  action: 'update' | 'duplicate' | 'skip';
}

export interface ImportModalState {
  currentStep: number;
  file: File | null;
  fileName: string;
  csvHeaders: string[];
  csvRows: CSVRow[];
  mapping: Record<string, string>;
  validationResults: ImportValidationResult[];
  duplicates: DuplicateMatch[];
  newOptions: { newOrigins: string[]; newInterestLevels: string[]; newTags: string[] };
  importing: boolean;
  importProgress: number;
  importProcessed: number;
  importTotal: number;
  importResult: { created: number; updated: number; duplicated: number; errors: number; dateConversions: number } | null;
  dateConversions: number;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: ImportModalState = {
  currentStep: 1,
  file: null,
  fileName: '',
  csvHeaders: [],
  csvRows: [],
  mapping: {},
  validationResults: [],
  duplicates: [],
  newOptions: { newOrigins: [], newInterestLevels: [], newTags: [] },
  importing: false,
  importProgress: 0,
  importProcessed: 0,
  importTotal: 0,
  importResult: null,
  dateConversions: 0,
  loading: false,
  error: null,
};

export function useImportModal() {
  const [state, setState] = useState<ImportModalState>(INITIAL_STATE);

  const update = useCallback((patch: Partial<ImportModalState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const setStep = useCallback((step: number) => update({ currentStep: step }), [update]);

  return { state, update, reset, setStep };
}
