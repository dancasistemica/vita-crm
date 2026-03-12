

# Plano: Autenticação Frontend (Login/Signup)

## O que será criado

1. **`src/pages/AuthPage.tsx`** — Página de login e cadastro com abas (Login / Criar Conta)
   - Campos: email, senha, nome completo (apenas no signup)
   - Validação inline com react-hook-form + zod
   - Usa `supabase.auth.signInWithPassword()` e `supabase.auth.signUp()`
   - No signup, cria organização automaticamente (nome padrão baseado no nome do usuário) + organization_member com role "owner"
   - Toast de sucesso/erro via sonner
   - Visual premium consistente com o design existente (rose/slate)

2. **`src/pages/ResetPasswordPage.tsx`** — Página para redefinir senha
   - Checa `type=recovery` na URL
   - Chama `supabase.auth.updateUser({ password })`

3. **`src/hooks/useAuth.ts`** — Hook de autenticação
   - Expõe `{ user, session, loading, signOut }`
   - Usa `onAuthStateChange` (listener antes de `getSession`)
   - Integra com OrganizationContext existente

4. **`src/components/ProtectedRoute.tsx`** — Wrapper que redireciona para `/auth` se não autenticado

5. **Alterações em `src/App.tsx`**
   - Rota pública `/auth` → AuthPage
   - Rota pública `/reset-password` → ResetPasswordPage
   - Todas as rotas do CRMLayout envolvidas pelo ProtectedRoute

6. **Alteração no `src/components/AppSidebar.tsx`**
   - Adicionar botão de logout no rodapé da sidebar

## Migração SQL

- Criar função `handle_new_user_org()` trigger que, ao criar profile, também cria uma organização padrão e insere o usuário como owner em organization_members
- Ou: fazer isso no frontend após signup bem-sucedido (mais simples, evita trigger complexo)

**Decisão**: Criar organização no frontend pós-signup (dentro do AuthPage), pois o trigger `handle_new_user` já cria o profile. Após signup + confirmação de email, ao primeiro login o app verifica se o user tem organização; se não, cria uma.

## Fluxo

1. Usuário acessa qualquer rota → ProtectedRoute verifica sessão → redireciona para `/auth`
2. Signup: cria conta → email de confirmação (padrão do sistema)
3. Login: autentica → OrganizationContext carrega org → se não tem org, cria automaticamente → redireciona para `/`
4. Logout: limpa sessão → redireciona para `/auth`

## Arquivos NÃO modificados
- Nenhum componente UI existente (exceto AppSidebar para logout)
- Nenhuma lógica de negócio
- Nenhum estilo global

