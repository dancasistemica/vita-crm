

## Plan: Role-Based Permission System (Superadmin/Admin/Vendedor/User)

### Current Architecture Analysis

The project already has:
- **`superadmin_roles`** table + `is_superadmin()` RPC for superadmin detection
- **`organization_members`** table with `org_role` enum (`owner`, `admin`, `member`) for org-level roles
- **`role_permissions`** table for granular permission keys per org
- **`profiles`** table without `role` or `organization_id` columns
- **`useSuperadmin` hook** that checks `superadmin_roles` table
- **`OrganizationContext`** that resolves org via `organization_members`
- **`CRMUser` in zustand** with local roles (`admin`, `vendedora`, `usuario`) -- not persisted to DB

### Design Decision

Rather than adding `role` and `organization_id` to `profiles` (duplicating what `organization_members` already provides), we should leverage the existing `organization_members.role` field. We need to extend the `org_role` enum to include `vendedor` and rename existing values for clarity.

### Implementation Plan

#### 1. Database Migration
- Add `vendedor` to the `org_role` enum: `ALTER TYPE org_role ADD VALUE 'vendedor'`
- Create a security definer function `get_user_role(_user_id uuid)` that returns the user's org role (or `'superadmin'` if in `superadmin_roles`)
- No changes to `profiles` table -- role comes from `organization_members`, superadmin from `superadmin_roles`

#### 2. Create `src/hooks/useUserRole.ts`
- New hook that combines `useSuperadmin` + org membership to return a unified role: `superadmin | owner | admin | member | vendedor | null`
- Fetches from `organization_members` for the current user's org
- Exposes helper booleans: `canCreate`, `canEdit`, `canDelete`, `canAccessSettings`, `isSuperadmin`
- Permission logic:
  - **superadmin/owner**: full CRUD + settings
  - **admin**: full CRUD + settings
  - **vendedor**: create + read + update own records only
  - **member** (user/viewer): read-only

#### 3. Create `src/services/permissionService.ts`
- Pure functions: `canPerformAction(role, action, resource)`, `canDeleteRecord(role)`, `canEditRecord(role, createdBy, currentUserId)`
- Used by components to conditionally show/hide UI elements

#### 4. Update `src/components/AppSidebar.tsx`
- Conditionally show "Configurações" only for `owner`/`admin`/`superadmin`
- Add "Superadmin" link only for superadmins

#### 5. Update `src/components/ProtectedRoute.tsx`
- Add optional `requiredRoles` prop
- If roles specified, check user's role and redirect if unauthorized

#### 6. Update `src/App.tsx` Routes
- `/configuracoes` route: require `owner` or `admin`
- `/superadmin` route: already protected by `useSuperadmin` internally

#### 7. Update Key Pages (LeadsPage, ClientesPage, etc.)
- Use `useUserRole()` hook
- Conditionally render create/edit/delete buttons based on permissions
- Hide bulk actions for read-only users
- For vendedor: only show edit on own records (requires `responsible` or `created_by` field matching)

#### 8. Update `src/components/settings/UsersTab.tsx`
- Update role dropdown to use actual `org_role` values: `admin`, `vendedor`, `member`
- Remove `superadmin` from this dropdown (managed via `/superadmin` panel only)
- When saving, update `organization_members.role` in the database instead of zustand

### Files to Create
- `src/hooks/useUserRole.ts`
- `src/services/permissionService.ts`
- 1 migration file

### Files to Modify
- `src/components/AppSidebar.tsx` -- conditional menu items
- `src/components/ProtectedRoute.tsx` -- role-based route protection
- `src/App.tsx` -- add role requirements to routes
- `src/pages/LeadsPage.tsx` -- conditional CRUD buttons
- `src/pages/ClientesPage.tsx` -- conditional CRUD buttons
- `src/components/settings/UsersTab.tsx` -- fix role values

