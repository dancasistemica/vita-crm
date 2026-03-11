

# Plan: CSV Import, Bulk Edit, and CSV/PDF Export

This plan covers three features that all work with the existing Zustand store (no database migration needed since tables don't exist yet).

---

## Feature 1: CSV Lead Import

**New files:**
- `src/services/importService.ts` — CSV parsing, column normalization, validation, auto-creation of missing origins/tags/interest levels in the Zustand store
- `src/components/import/LeadImportModal.tsx` — 4-step wizard (Upload → Map Columns → Validate/Preview → Results) using Dialog
- `src/pages/ImportLeadsPage.tsx` — Simple page wrapper with drag-and-drop zone

**Integration:**
- Add route `/importar-leads` in `App.tsx`
- Add "Importar CSV" button on `LeadsPage.tsx` header (next to "Novo Lead")
- Add menu item in `AppSidebar.tsx` under Leads or as import icon

**Key logic:**
- Parse CSV using `File.text()` + split (no external lib needed)
- Fuzzy column mapping: normalize Portuguese/English headers to Lead fields via lookup table
- Step 2 shows two-column UI: CSV column name → dropdown of CRM fields
- Step 3: validate required fields (name + email or phone), email regex, detect duplicates by email/phone against existing `leads` in store
- Auto-create missing origins via `addOrigin()`, tags via `addTag()`, interest levels via `addInterestLevel()`
- Step 4: progress bar, summary of imported/errors/warnings
- Max 1000 rows per import
- All operations go through `useCRMStore` actions (addLead, addOrigin, addTag, etc.)

---

## Feature 2: Bulk Edit

**New files:**
- `src/components/bulk/BulkEditModal.tsx` — Modal with field selector + value input, preview of change, confirm button

**Integration points (minimal changes):**
- `LeadsPage.tsx`: Add checkbox column, selection state, floating action bar when ≥1 selected → opens BulkEditModal
- `ClientsTable.tsx`: Already has checkbox/selection infrastructure — add "Editar em massa" button to the existing bulk action bar

**Editable fields (Leads):** Origin (select), Interest Level (select), Funnel Stage (select), Responsible (select), Tags (multi-select), Notes (textarea)

**Editable fields (Clients):** Status (select), Responsible (select), Tags (multi-select), Notes (textarea)

**Logic:** Loop selected IDs, call `updateLead()` or `updateSale()` from store for each. Dynamic input component renders based on selected field type (select, multi-select, textarea, date).

---

## Feature 3: Export (CSV/PDF)

**New files:**
- `src/components/export/ExportModal.tsx` — Modal with format toggle (CSV/PDF), data scope (all/filtered), column checkboxes
- `src/services/exportService.ts` — CSV generation via Blob + download link; PDF generation using browser-native approach (no jsPDF dependency — use a simple HTML-to-printable approach or add jsPDF)

**Integration:**
- Add "Exportar" button on `LeadsPage.tsx` and `ClientesPage.tsx` headers
- Pass current filtered data + available columns to modal
- CSV: BOM header for Excel compatibility, proper escaping
- PDF: Install `jspdf` + `jspdf-autotable` dependencies; generate formatted table with rose-colored headers

**Column selection:** Checkboxes for each available field, default all selected. "Select all / Deselect all" toggle.

---

## Routing & Navigation Updates

```
App.tsx: Add <Route path="/importar-leads" element={<ImportLeadsPage />} />
AppSidebar.tsx: Add import item (optional, or keep as button on Leads page only)
```

## File Change Summary

| Action | File |
|--------|------|
| Create | `src/services/importService.ts` |
| Create | `src/components/import/LeadImportModal.tsx` |
| Create | `src/pages/ImportLeadsPage.tsx` |
| Create | `src/components/bulk/BulkEditModal.tsx` |
| Create | `src/components/export/ExportModal.tsx` |
| Create | `src/services/exportService.ts` |
| Edit | `src/pages/LeadsPage.tsx` (add Import/Export buttons, bulk selection) |
| Edit | `src/pages/ClientesPage.tsx` (add Export button) |
| Edit | `src/components/clients/ClientsTable.tsx` (add bulk edit button) |
| Edit | `src/App.tsx` (add import route) |
| Install | `jspdf`, `jspdf-autotable` |

All features operate on the existing Zustand store — no database migrations required.

