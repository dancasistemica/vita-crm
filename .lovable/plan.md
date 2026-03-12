

## Plan: Search and Filters for Organizations Table

### Changes

#### 1. Modify `src/components/superadmin/OrganizationsTab.tsx`

Add search/filter UI directly into the component (no need for a separate file given the simplicity):

- Add state: `searchTerm`, `statusFilter` ('all' | 'active' | 'suspended'), `planFilter` ('all' | planId)
- Add `useMemo` to compute `filteredOrgs` from `orgs` based on the three filters
- Search filters by `name` and `contact_email` (case-insensitive)
- Status filter maps to `org.active` boolean (true = 'active', false = 'suspended')
- Plan filter matches `org.plan_id`

**Filter bar** (inserted between the header row and the table):
- `Input` with `Search` icon for name search
- `Select` for status: Todas / Ativa / Suspensa
- `Select` for plan: Todos / dynamic plan names from existing `plans` state
- `X` button to clear all filters (visible only when filters are active)

**Counter update**: Change the counter text to show `filteredOrgs.length` of `orgs.length` when filtered.

**Empty state**: Show "Nenhuma organização encontrada" message when filters yield no results.

All existing functionality (edit, delete, toggle status, plan change, create modal) remains untouched. The table simply renders `filteredOrgs` instead of `orgs`.

### Files to modify
- `src/components/superadmin/OrganizationsTab.tsx` -- add filter state, filter bar UI, and filtered rendering

### No new files needed
The filter UI is simple enough to inline. No database changes required.

