import { useState, useCallback } from 'react';
import { type CSVRow, type ImportValidationResult } from '@/services/importService';

export interface WizardState {
  currentStep: number;
  file: File | null;
  fileName: string;
  headers: string[];
  rows: CSVRow[];
  mapping: Record<string, string>;
  validationResults: ImportValidationResult[];
  newOptions: { newOrigins: string[]; newInterestLevels: string[]; newTags: string[] };
  importing: boolean;
  importProgress: number;
  importResult: { success: number; errors: number; warnings: number } | null;
  error: string | null;
  loading: boolean;
}

const initialState: WizardState = {
  currentStep: 1,
  file: null,
  fileName: '',
  headers: [],
  rows: [],
  mapping: {},
  validationResults: [],
  newOptions: { newOrigins: [], newInterestLevels: [], newTags: [] },
  importing: false,
  importProgress: 0,
  importResult: null,
  error: null,
  loading: false,
};

export function useImportWizard() {
  const [state, setState] = useState<WizardState>(initialState);

  const update = useCallback((partial: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { state, update, reset };
}
