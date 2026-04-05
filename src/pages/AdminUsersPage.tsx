import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSuperadmin } from "@/hooks/useSuperadmin";
import { useNavigate } from "react-router-dom";
import { 
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  Label
} from "@/components/ui/ds";
import { Users, Search, Edit, Trash2, RotateCcw, Eye, Loader, X, EyeIcon, EyeOffIcon } from "lucide-react";
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
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name, owner_id")
        .order("name");
      setOrgs(orgData?.map((o) => ({ id: o.id, name: o.name })) || []);

      const ownerMap = new Map<string, string>();
      orgData?.forEach((o) => {
        if (o.owner_id) ownerMap.set(o.owner_id, o.id);
      });

      const { data: members } = await supabase
        .from("organization_members")
        .select("id, user_id, role, organization_id, created_at");

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
        (u) =>
          u.full_name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
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
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: editName, phone: editPhone || null })
        .eq("id", editUser.user_id);
      if (profileError) throw profileError;

      const orgChanged = editOrgId !== editUser.org_id;
      if (orgChanged) {
        if (editUser.member_id) {
          await supabase.from("organization_members").delete().eq("user_id", editUser.user_id);
        }
        if (editOrgId) {
          await supabase.from("organization_members").insert({
            user_id: editUser.user_id,
            organization_id: editOrgId,
            role: (editRole && editRole !== "—" ? editRole : "member") as any,
          });
        }
      } else {
        if (editUser.member_id && editRole !== editUser.role && editRole !== "—") {
          await supabase.from("organization_members").update({ role: editRole as any }).eq("id", editUser.member_id);
        }
      }

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

        const { data, error } = await supabase.functions.invoke("manage-org-users", { body: payload });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      toast.success("Usuário atualizado!");
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
        <Loader className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!isSuperadmin) return null;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold text-neutral-900">Usuários</h1>
        <Badge variant="secondary" className="ml-auto">{filtered.length} total</Badge>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">Filtros Avançados</h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label className="mb-1.5 block">Busca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Nome ou email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-[240px]">
              <Label className="mb-1.5 block">Organização</Label>
              <Select value={orgFilter} onValueChange={(v) => { setOrgFilter(v); setPage(1); }}>
                <option value="all">Todas as organizações</option>
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-[180px]">
              <Label className="mb-1.5 block">Função</Label>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <option value="all">Todas as funções</option>
                <option value="owner">Proprietário</option>
                <option value="admin">Administrador</option>
                <option value="vendedor">Vendedor</option>
                <option value="member">Usuário</option>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" onClick={resetFilters} className="text-neutral-500 hover:text-neutral-900">
                <X className="h-4 w-4 mr-1" /> Resetar
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="h-10 w-10 animate-spin text-primary/30" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">Nenhum usuário encontrado.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Organização</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Função</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Criado em</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {paginated.map((u) => (
                  <tr key={u.user_id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-neutral-900">{u.full_name}</div>
                        {u.is_owner && <Badge variant="error" className="ml-2 text-[10px]">Dono</Badge>}
                      </div>
                      <div className="text-xs text-neutral-500">{u.phone || "—"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{u.org_name || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary">{roleLabels[u.role] || u.role}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Editar"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleResetPassword(u)} title="Resetar senha"><RotateCcw className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(u)} className="text-destructive" title="Remover"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
            <span className="text-sm text-neutral-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próximo</Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div className="space-y-1">
              <Label>Nome Completo</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nova Senha (opcional)</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-8 w-8 p-0" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Organização</Label>
              <Select value={editOrgId || ""} onValueChange={(v) => setEditOrgId(v || null)}>
                <option value="">Sem organização</option>
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Função</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <option value="owner">Proprietário</option>
                <option value="admin">Administrador</option>
                <option value="vendedor">Vendedor</option>
                <option value="member">Usuário</option>
                <option value="—">Nenhuma</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="secondary" className="flex-1" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleEditSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <Card variant="default" padding="lg" className="w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-2">Remover usuário</h2>
            <p className="text-sm text-neutral-600 mb-6">
              Tem certeza que deseja remover <strong>{deleteTarget?.full_name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="error" className="flex-1" onClick={handleDelete}>
                Remover
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
