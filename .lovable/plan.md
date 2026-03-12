

# Plano: Sistema Superadmin SaaS (Fase 1 - MVP)

## Resumo

Criar painel superadmin em `/superadmin` com 3 abas (Organizações, Planos, Usuários), protegido por role em tabela separada, com tabela de planos customizáveis.

## 1. Migração SQL

**Tabela `superadmin_roles`** (roles em tabela separada, conforme regra de segurança):
- `id uuid PK`, `user_id uuid UNIQUE NOT NULL`, `created_at timestamptz`
- RLS: superadmins podem SELECT; ninguém pode INSERT/UPDATE/DELETE via client (gerenciado via backend/SQL direto)

**Tabela `organization_plans`**:
- `id uuid PK`, `name text NOT NULL`, `value numeric(10,2) NOT NULL`, `period text NOT NULL` (monthly/annual), `max_users int NOT NULL`, `max_leads int`, `max_integrations int`, `description text`, `active boolean DEFAULT true`, `created_at/updated_at timestamptz`
- RLS: superadmins podem CRUD, authenticated podem SELECT

**Função `is_superadmin(uuid)`** — SECURITY DEFINER, checa `superadmin_roles`

**Adicionar `plan_id uuid` em `organizations`** — FK para `organization_plans`

**Políticas extras em `organizations`**: superadmins podem SELECT ALL e UPDATE ALL (bypass do filtro por membership)

**Políticas em `profiles`**: superadmins podem SELECT ALL profiles (para listar na aba Usuários)

## 2. Arquivos Novos

### `src/hooks/useSuperadmin.ts`
- Query `superadmin_roles` para verificar se `auth.uid()` é superadmin
- Retorna `{ isSuperadmin, loading }`

### `src/services/superadminService.ts`
- Funções usando `@/integrations/supabase/client`: `checkIsSuperadmin()`, `getAllOrganizations()`, `updateOrgStatus()`, `getAllPlans()`, `createPlan()`, `deletePlan()`, `getSuperadmins()`, `addSuperadmin()`, `removeSuperadmin()`

### `src/pages/SuperadminDashboard.tsx`
- Usa `useSuperadmin()` — redirect para `/` se não for superadmin
- Layout standalone (sem CRMLayout/Sidebar)
- 3 abas usando shadcn Tabs

### `src/components/superadmin/OrganizationsTab.tsx`
- Lista todas orgs com nome, plano, status (active/suspended), data
- Toggle ativar/suspender via `update organizations.active`
- Usa shadcn Table, Badge, Button

### `src/components/superadmin/PlansTab.tsx`
- Grid de cards com planos existentes + limites
- Dialog para criar plano (nome, valor, período, max_users, max_leads, max_integrations, descrição)
- Botão deletar

### `src/components/superadmin/UsersManagementTab.tsx`
- Lista superadmins via join `superadmin_roles` + `profiles`
- Adicionar superadmin por email (busca profile, insere em `superadmin_roles`)
- Remover superadmin (delete de `superadmin_roles`)
- **Não** cria auth users — apenas promove profiles existentes

## 3. Alteração em `src/App.tsx`
- Adicionar rota `/superadmin` dentro de `ProtectedRoute` mas **fora** de `CRMLayout`

## 4. Decisões Técnicas

- **Não** adicionar colunas em `profiles`/`users` — roles ficam em `superadmin_roles` (tabela separada)
- **Não** usar `signUp` para criar superadmins (inseguro via client) — apenas promover users existentes
- Import correto: `@/integrations/supabase/client` (não `@/services/supabaseClient`)
- Toast via `sonner` (padrão do projeto)
- Componentes shadcn existentes (Table, Dialog, Tabs, Button, Input, Badge, Card)

## 5. Arquivos NÃO alterados
- Nenhum componente/página existente (exceto App.tsx para rota)
- Store Zustand, OrganizationContext, AuthPage, AppSidebar — intactos

