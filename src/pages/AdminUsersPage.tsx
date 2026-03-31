import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSuperadmin } from "@/hooks/useSuperadmin";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  
  Input, 
  Badge, 
  Select, 
  Dialog, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  AlertDialog 
} from "@/components/ui/ds";
import { Users, Search, Edit, Trash2, RotateCcw, Eye, Loader2, X, EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  org_id: string | null;
  org_name: string | null;
  role: string;
  member_id: string | null;
  created_at: string;
  is_owner: boolean;
}

interface OrgOption {
  id: string;
  name: string;
}

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  vendedor: "Vendedor",
  member: "Usuário",
};

export default function AdminUsersPage() {
  const { isSuperadmin, loading: saLoading } = useSuperadmin();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const [orgs, setOrgs] = useState<OrgOption[]>([]);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editOrgId, setEditOrgId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!saLoading && !isSuperadmin) {
      navigate("/");
    }
  }, [saLoading, isSuperadmin, navigate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Fetch all orgs
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name, owner_id")
        .order("name");
      setOrgs(orgData?.map((o) => ({ id: o.id, name: o.name })) || []);

      const ownerMap = new Map<string, string>();
      orgData?.forEach((o) => {
        if (o.owner_id) ownerMap.set(o.owner_id, o.id);
      });

      // Fetch all members with org info
      const { data: members } = await supabase
        .from("organization_members")
        .select("id, user_id, role, organization_id, created_at");

      // Fetch all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at");

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      const orgMap = new Map(orgData?.map((o) => [o.id, o.name]) || []);

      const result: AdminUser[] = [];
      const seenUserIds = new Set<string>();

      members?.forEach((m) => {
        seenUserIds.add(m.user_id);
        const p = profileMap.get(m.user_id);
        result.push({
          user_id: m.user_id,
          full_name: p?.full_name || "—",
          email: p?.email || "—",
          phone: p?.phone || null,
          org_id: m.organization_id,
          org_name: orgMap.get(m.organization_id) || "—",
          role: m.role,
          member_id: m.id,
          created_at: m.created_at,
          is_owner: ownerMap.get(m.user_id) === m.organization_id,
        });
      });

      // Include profiles without org membership (orphaned)
      profiles?.forEach((p) => {
        if (!seenUserIds.has(p.id)) {
          result.push({
            user_id: p.id,
            full_name: p.full_name || "—",
            email: p.email || "—",
            phone: p.phone || null,
            org_id: null,
            org_name: null,
            role: "—",
            member_id: null,
            created_at: p.created_at,
            is_owner: false,
          });
        }
      });

      // Sort by created_at desc
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setUsers(result);
    } catch (err) {
      console.error("[AdminUsersPage] fetch error:", err);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperadmin) fetchAll();
  }, [isSuperadmin]);

  const filtered = useMemo(() => {
    let list = users;
    if (orgFilter !== "all") {
      list = list.filter((u) => u.org_id === orgFilter);
    }
    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (u) => u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
      );
    }
    return list;
  }, [users, search, orgFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const resetFilters = () => {
    setSearch("");
    setOrgFilter("all");
    setRoleFilter("all");
    setPage(1);
  };

  const hasFilters = search || orgFilter !== "all" || roleFilter !== "all";

  // Edit handlers
  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditName(u.full_name);
    setEditPhone(u.phone || "");
    setEditRole(u.role);
    setEditEmail(u.email);
    setEditPassword("");
    setShowPassword(false);
    setEditOrgId(u.org_id);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    if (editPassword && editPassword.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    setSaving(true);
    try {
      // Update profile (name, phone)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: editName, phone: editPhone || null })
        .eq("id", editUser.user_id);
      if (profileError) throw profileError;

      // Handle organization change
      const orgChanged = editOrgId !== editUser.org_id;
      if (orgChanged) {
        // Remove existing membership(s)
        if (editUser.member_id) {
          const { error: delError } = await supabase
            .from("organization_members")
            .delete()
            .eq("user_id", editUser.user_id);
          if (delError) throw delError;
        }
        // Create new membership if org selected
        if (editOrgId) {
          const { error: insError } = await supabase
            .from("organization_members")
            .insert({
              user_id: editUser.user_id,
              organization_id: editOrgId,
              role: (editRole && editRole !== "—" ? editRole : "member") as any,
            });
          if (insError) throw insError;
        }
      } else {
        // Update role if changed (and has membership)
        if (editUser.member_id && editRole !== editUser.role && editRole !== "—") {
          const { error: roleError } = await supabase
            .from("organization_members")
            .update({ role: editRole as any })
            .eq("id", editUser.member_id);
          if (roleError) throw roleError;
        }
      }

      // Update email/password via edge function if changed
      const emailChanged = editEmail !== editUser.email;
      const passwordChanged = editPassword.length > 0;

      if (emailChanged || passwordChanged) {
        const payload: any = {
          action: "update_auth",
          organization_id: editUser.org_id || "global",
          user_id: editUser.user_id,
        };
        if (emailChanged) payload.email = editEmail;
        if (passwordChanged) payload.password = editPassword;

        const { data, error } = await supabase.functions.invoke("manage-org-users", {
          body: payload,
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      toast.success(orgChanged ? "Usuário vinculado à organização com sucesso!" : "Usuário atualizado!");
      setEditOpen(false);
      setEditUser(null);
      fetchAll();
    } catch (err: any) {
      console.error('[EditUserModal] Erro ao salvar:', err);
      toast.error(err.message || "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.org_id) {
        const { data, error } = await supabase.functions.invoke("manage-org-users", {
          body: {
            action: "delete",
            organization_id: deleteTarget.org_id,
            user_id: deleteTarget.user_id,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }
      toast.success("Usuário removido!");
      setDeleteTarget(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover");
    } finally {
      setSaving(false);
    }
  };

  // Reset password
  const handleResetPassword = async (u: AdminUser) => {
    if (!u.org_id || !u.email) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-org-users", {
        body: {
          action: "reset_password",
          organization_id: u.org_id,
          email: u.email,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Email de redefinição enviado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar email de reset");
    }
  };

  if (saLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!isSuperadmin) return null;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary-600" />
        <h1 className="text-4xl font-bold text-neutral-900">Todos os Usuários</h1>
        <Badge variant="neutral" className="ml-auto">{filtered.length} usuários</Badge>
      </div>

      <Card padding="md">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-neutral-700">Filtros</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <Select 
                value={orgFilter} 
                onChange={(e) => { setOrgFilter(e.target.value); setPage(1); }}
                placeholder="Organização"
                options={[
                  { value: "all", label: "Todas as organizações" },
                  ...orgs.map(o => ({ value: o.id, label: o.name }))
                ]}
              />
            </div>
            <div className="w-full sm:w-[180px]">
              <Select 
                value={roleFilter} 
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                placeholder="Função"
                options={[
                  { value: "all", label: "Todas as funções" },
                  { value: "owner", label: "Proprietário" },
                  { value: "admin", label: "Administrador" },
                  { value: "vendedor", label: "Vendedor" },
                  { value: "member", label: "Usuário" },
                ]}
              />
            </div>
            {hasFilters && (
              < variant="ghost" onClick={resetFilters} className="sm:mb-1">
                <X className="h-4 w-4 mr-1" /> Resetar
              </>
            )}
          </div>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-neutral-500 py-12">Nenhum usuário encontrado.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((u, idx) => (
                  <TableRow key={`${u.user_id}-${u.org_id}-${idx}`}>
                    <TableCell className="font-medium">
                      {u.full_name}
                      {u.is_owner && (
                        <Badge variant="error" size="sm" className="ml-2">Owner</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-neutral-600">
                      {u.phone || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{u.org_name || "Sem org"}</TableCell>
                    <TableCell>
                      <Badge variant="neutral">{roleLabels[u.role] || u.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-neutral-600">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        < variant="ghost" title="Editar" onClick={() => openEdit(u)} className="p-1 h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </>
                        {u.email && u.org_id && (
                          < variant="ghost" title="Resetar senha" onClick={() => handleResetPassword(u)} className="p-1 h-8 w-8">
                            <RotateCcw className="h-4 w-4" />
                          </>
                        )}
                        {u.org_id && (
                          < variant="ghost" title="Ver organização" onClick={() => navigate("/superadmin")} className="p-1 h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </>
                        )}
                        < variant="ghost" title="Remover" onClick={() => setDeleteTarget(u)} className="p-1 h-8 w-8 text-error-600">
                          <Trash2 className="h-4 w-4" />
                        </>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-neutral-600 p-4 border-t border-neutral-100">
                <span>Página {page} de {totalPages}</span>
                <div className="flex gap-1">
                  < variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</>
                  < variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próximo</>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Edit User Modal */}
      <Dialog isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar Usuário">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <Input
            label="Nome Completo"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nome do usuário"
          />
          <Input
            label="Telefone"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="(00) 00000-0000"
          />
          <Input
            label="Email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
          <div className="space-y-3">
            <Input
              label="Nova Senha (opcional)"
              type={showPassword ? "text" : "password"}
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              icon={
                <button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} type="button" className="text-neutral-500">
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              }
            />
          </div>
          
          <Select
            label="Organização"
            value={editOrgId || ""}
            onChange={(e) => setEditOrgId(e.target.value || null)}
            placeholder="Sem organização"
            options={orgs.map(o => ({ value: o.id, label: o.name }))}
          />
          
          <Select
            label="Função na Organização"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            options={[
              { value: "owner", label: "Proprietário" },
              { value: "admin", label: "Administrador" },
              { value: "vendedor", label: "Vendedor" },
              { value: "member", label: "Usuário" },
              { value: "—", label: "Nenhuma" },
            ]}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-neutral-100">
          < variant="secondary" onClick={() => setEditOpen(false)} disabled={saving} className="flex-1">
            Cancelar
          </>
          < variant="primary" onClick={handleEditSave} isLoading={saving} className="flex-1">
            Salvar Alterações
          </>
        </div>
      </Dialog>

      <AlertDialog 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)}
        title="Remover Usuário"
        description={(
          <>
            Tem certeza que deseja remover o usuário <strong>{deleteTarget?.full_name}</strong>? 
            Esta ação removerá o acesso dele à organização.
          </>
        )}
        variant="error"
        onConfirm={handleDelete}
        isLoading={saving}
        confirmText="Remover Usuário"
      />
    </div>
  );
}
