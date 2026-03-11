

## Plan: Consolidate Import Flow & Fix Reset + Mapping Issues

### Problems Identified

1. **State not resetting**: `ImportLeadsModal` creates a new `useImportModal()` instance each render, but never calls `reset()` when the modal opens — so stale state from a previous incomplete import persists.

2. **Mapping selects not visible**: The mapping UI in `Step4Upload.tsx` renders correctly code-wise, but there's likely a rendering issue with `Select` value `''` vs `'_ignore'`. When `suggestMapping` returns empty strings for unmapped fields, the Select gets `''` which doesn't match any `SelectItem`.

3. **Duplicate code**: `LeadImportModal.tsx` (old 4-step modal) still exists alongside `ImportLeadsModal.tsx` (new 6-step modal). The old one is still imported in `LeadsPage.tsx`.

4. **Dead routes**: `/importar-wizard` and `/importar-modelo` routes and their page files still exist.

### Changes

**1. `src/components/import/ImportLeadsModal.tsx`** — Reset state when modal opens
- Add `useEffect` that calls `reset()` when `open` transitions to `true`

**2. `src/components/import/steps/Step4Upload.tsx`** — Fix mapping Select values
- Ensure `suggestMapping` results with empty string values are converted to `'_ignore'` for proper Select rendering
- Alternatively, filter out empty mappings before setting state

**3. `src/pages/LeadsPage.tsx`** — Clean up old import references
- Already uses `ImportLeadsModal` (the new one) — verify import path is correct
- Remove any reference to old `LeadImportModal` if present (currently imports from `ImportLeadsModal` which is the new one, so this is fine)

**4. Delete old/unused files:**
- `src/components/import/LeadImportModal.tsx`
- `src/components/import/wizard/` (entire directory)
- `src/pages/ImportLeadsWizard.tsx`
- `src/pages/ImportLeadsGuide.tsx`

**5. `src/App.tsx`** — Remove dead routes
- Remove `/importar-wizard` and `/importar-modelo` routes and their imports

### Implementation Details

**Reset on open** (`ImportLeadsModal.tsx`):
```typescript
import { useEffect } from 'react';
// Inside component:
useEffect(() => {
  if (open) reset();
}, [open]);
```

**Fix mapping Select** (`Step4Upload.tsx`):
The `suggestMapping()` function returns `Record<string, string>` where unmapped headers have empty string `''`. The `Select` component uses `state.mapping[header] || '_ignore'` which should work. The real issue may be that `getCRMFields()` returns items with `value: ''` for the "ignore" option, and Radix Select doesn't render items with empty values well. Will ensure the ignore option always uses `'_ignore'` as value and filter it when reading mapping state.

**Route cleanup** (`App.tsx`):
Remove lines 17-18 (imports) and lines 41-42 (routes).

