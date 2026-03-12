

## Plan: Superadmin Dashboard with Sidebar + Organization Actions

### What needs to change

The SuperadminDashboard currently renders as a standalone full-page layout without the app sidebar. The user wants it wrapped in the CRMLayout (sidebar). Additionally, the organizations table needs Edit and Delete action buttons alongside the existing status toggle.

### 1. Move `/superadmin` route inside CRMLayout

In `src/App.tsx`, move the superadmin route inside the `<CRMLayout />` wrapper so it gets the standard sidebar.

### 2. Create `EditOrganizationModal.tsx`

New file: `src/components/superadmin/EditOrganizationModal.tsx`

- Dialog-based modal using existing shadcn Dialog components
- Fields: name, contact_email, phone, website, description
- Fetches org data on open, saves via `updateOrganization()` service function
- Uses existing UI components (Dialog, Input, Label, Button, Textarea)

### 3. Add service functions to `superadminService.ts`

- `updateOrganization(orgId, data)` -- updates name, contact_email, phone, website, description
- `deleteOrganization(orgId)` -- deletes the organization (requires adding a DELETE RLS policy for superadmins)

### 4. Database migration

Add a DELETE policy on `organizations` for superadmins:
```sql
CREATE POLICY "Superadmins can delete orgs"
ON public.organizations FOR DELETE TO authenticated
USING (is_superadmin(auth.uid()));
```

### 5. Update `OrganizationsTab.tsx`

- Add `contact_email` to the Org interface and table columns
- Add Edit button (Pencil icon) that opens EditOrganizationModal
- Add Delete button (Trash icon) with AlertDialog confirmation
- Keep existing status toggle and plan change functionality
- Add state for `editingOrg` and `deleteConfirmOrg`

### 6. Update `SuperadminDashboard.tsx`

- Remove the standalone header/full-page layout since CRMLayout provides the shell
- Keep quick access cards and tabs content, but remove `min-h-screen` wrapper and header bar

### Files to create
- `src/components/superadmin/EditOrganizationModal.tsx`

### Files to modify
- `src/App.tsx` (move superadmin route inside CRMLayout)
- `src/pages/SuperadminDashboard.tsx` (remove standalone header)
- `src/components/superadmin/OrganizationsTab.tsx` (add edit/delete buttons)
- `src/services/superadminService.ts` (add update/delete functions)
- 1 migration (DELETE policy on organizations)

