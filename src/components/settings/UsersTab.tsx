import { Alert, AlertDialog, Badge, Button, Card, Command, Dialog, Input, Label, Popover, Select, Table } from "@/components/ui/ds";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSuperadmin } from "@/hooks/useSuperadmin";
import { Plus, Edit, Trash2, RotateCcw, Search, Users, Loader2, Building2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrgUser {
  member_id: string;
  user_id: string;
  role: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

interface OrgOption {
  id: string;
  name: string;
  cnpj: string | null;
}

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  vendedor: "Vendedor",
  member: "Usuário",
};

const roleBadgeVariant = (role: string) => {
  if (role === "owner") return "default" as const;
  if (role === "admin") return "default" as const;
  return "secondary" as const;
};

export default function UsersTab() {
  const { organizationId, organization } = useOrganization();
  const { isSuperadmin } = useSuperadmin();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrgUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgUser | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("member");
  const [formOrgId, setFormOrgId] = useState("");
  const [orgSelectOpen, setOrgSelectOpen] = useState(false);

  // Organizations list (superadmin only)
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);

  // Custom roles
  const [customRoleOptions, setCustomRoleOptions] = useState<string[]>([]);

  const fetchUsers = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data: members, error } = await supabase
        .from("organization_members")
        .select("id, user_id, role, created_at")
        .eq("organization_id", organizationId);

      if (error) throw error;
      if (!members || members.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const userIds = members.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const merged: OrgUser[] = members.map((m) => {
        const p = profileMap.get(m.user_id);
        return {
          member_id: m.id,
          user_id: m.user_id,
          role: m.role,
          full_name: p?.full_name || "—",
          email: p?.email || "—",
          phone: p?.phone || null,
          created_at: m.created_at,
        };
      });

      setUsers(merged);
    } catch (err) {
      console.error("[UsersTab] fetch error:", err);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Load custom roles for the org
    if (organizationId) {
      supabase
        .from('custom_roles')
        .select('name')
        .eq('organization_id', organizationId)
        .order('name')
        .then(({ data }) => {
          setCustomRoleOptions(data?.map(r => r.name) || []);
        });
    }
  }, [organizationId]);

  // Fetch organizations for superadmin
  const fetchOrgs = async () => {
    setOrgsLoading(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, cnpj")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      setOrgOptions(data || []);
      console.log("[AddUserDialog] Organizações carregadas:", data?.length || 0);
    } catch (err) {
      console.error("[UsersTab] fetch orgs error:", err);
    } finally {
      setOrgsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = users;
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
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("member");
    setFormOrgId("");
    setOrgSelectOpen(false);
    if (isSuperadmin) fetchOrgs();
    setFormOpen(true);
  };

  const openEdit = (u: OrgUser) => {
    setEditing(u);
    setFormName(u.full_name);
    setFormEmail(u.email);
    setFormPhone(u.phone || "");
    setFormRole(u.role);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    if (!editing && isSuperadmin && !formOrgId) {
      console.log("[AddUserDialog] Validação: organização obrigatória");
      toast.error("Selecione uma organização");
      return;
    }
    const targetOrgId = editing ? organizationId : (isSuperadmin ? formOrgId : organizationId);
    setSaving(true);
    try {
      if (editing) {
        // Update profile
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: formName, phone: formPhone || null })
          .eq("id", editing.user_id);
        if (profileError) throw profileError;

        // Update role if changed
        if (formRole !== editing.role) {
          const { error: roleError } = await supabase
            .from("organization_members")
            .update({ role: formRole as any })
            .eq("id", editing.member_id);
          if (roleError) throw roleError;
        }

        toast.success("Usuário atualizado!");
      } else {
        // Create via edge function
        const { data, error } = await supabase.functions.invoke("manage-org-users", {
          body: {
            action: "create",
            organization_id: targetOrgId,
            email: formEmail,
            full_name: formName,
            phone: formPhone,
            role: formRole,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        if (data?.temp_password) {
          toast.success(`Usuário criado! Senha temporária: ${data.temp_password}`, {
            duration: 15000,
          });
        } else {
          toast.success("Usuário adicionado à organização!");
        }
      }

      setFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("[UsersTab] save error:", err);
      toast.error(err.message || "Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-org-users", {
        body: {
          action: "delete",
          organization_id: organizationId,
          user_id: deleteTarget.user_id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Usuário removido!");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      console.error("[UsersTab] delete error:", err);
      toast.error(err.message || "Erro ao remover usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (u: OrgUser) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-org-users", {
        body: {
          action: "reset_password",
          organization_id: organizationId,
          email: u.email,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Email de redefinição de senha enviado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar email de reset");
    }
  };

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold mb-2">
          <Users className="h-5 w-5" />
          Usuários da Organização
        </h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Novo Usuário
        </Button>
      </div>
      <div>
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            
              
            
            
              <option value="all">Todas as funções</option>
              <option value="owner">Proprietário</option>
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
              <option value="member">Usuário</option>
            
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-neutral-500 py-8">Nenhum usuário encontrado.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <th className=\"px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider\"><td className=\"px-4 py-4 text-sm text-neutral-900 whitespace-nowrap\"><table className="w-full border-collapse">
                    <table className="w-full border-collapse">Nome</th>
                    <th className=\"px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider\">Email</th>
                    <th className=\"px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider\">Telefone</th>
                    <th className=\"px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider\">Função</th>
                    <th className=\"px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider\">Criado em</th>
                    <th className=\"px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider\">Ações</th>
                  </tr>
                </thead>
                <table className="w-full border-collapse">
                  {paginated.map((u) => (
                    <table className="w-full border-collapse">
                      <table className="w-full border-collapse">{u.full_name}</td>
                      <td className=\"px-4 py-4 text-sm text-neutral-900 whitespace-nowrap\">{u.email}</td>
                      <td className=\"px-4 py-4 text-sm text-neutral-900 whitespace-nowrap\">{u.phone || "—"}</td>
                      <td className=\"px-4 py-4 text-sm text-neutral-900 whitespace-nowrap\"><Badge variant={roleBadgeVariant(u.role)}>
                          {roleLabels[u.role] || u.role}
                        </Badge></td>
                      <td className=\"px-4 py-4 text-sm text-neutral-900 whitespace-nowrap\">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className=\"px-4 py-4 text-sm text-neutral-900 whitespace-nowrap\"><div className="flex items-center justify-end gap-1">
                          <Button variant="ghost"
                            size="sm"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={() => openEdit(u)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost"
                            size="sm"
                            className="h-8 w-8"
                            title="Resetar senha"
                            onClick={() => handleResetPassword(u)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          {u.role !== "owner" && (
                            <Button variant="ghost"
                              size="sm"
                              className="h-8 w-8 text-destructive"
                              title="Remover"
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-neutral-500">
                <span>
                  {filtered.length} usuário(s) · Página {page} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
          
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">{editing ? "Editar Usuário" : "Novo Usuário"}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  disabled={!!editing}
                />
                {editing && (
                  <p className="text-xs text-neutral-500">O email não pode ser alterado.</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              {/* Organization select - superadmin only, create mode only */}
              {isSuperadmin && !editing && (
                <div className="space-y-1">
                  <Label>Organização *</Label>
                  <Popover open={orgSelectOpen} onOpenChange={setOrgSelectOpen}>
                    
                      <Button variant="secondary"
                        role="combobox"
                        aria-expanded={orgSelectOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formOrgId
                          ? orgOptions.find((o) => o.id === formOrgId)?.name || "Selecione..."
                          : "Selecione uma organização"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    
                    <div className="absolute z-50 mt-2 p-4 bg-white border border-neutral-200 rounded-lg shadow-lg">
                      <Command>
                        <CommandInput placeholder="Buscar organização..." className="h-10" />
                        <CommandList>
                          <CommandEmpty>
                            {orgsLoading ? "Carregando..." : "Nenhuma organização encontrada."}
                          </CommandEmpty>
                          <CommandGroup>
                            {orgOptions.map((org) => (
                              <CommandItem
                                key={org.id}
                                value={`${org.name} ${org.cnpj || ""}`}
                                onSelect={() => {
                                  setFormOrgId(org.id);
                                  console.log("[AddUserDialog] Organização selecionada:", org.id, org.name);
                                  setOrgSelectOpen(false);
                                }}
                                className="min-h-[44px]"
                              >
                                <Check className={cn("mr-2 h-4 w-4", formOrgId === org.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                  <span>{org.name}</span>
                                  {org.cnpj && (
                                    <span className="text-xs text-neutral-500">{org.cnpj}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  </Popover>
                  {orgsLoading && (
                    <div className="text-sm text-neutral-500">Carregando organizações...</div>
                  )}
                  {!orgsLoading && orgOptions.length === 0 && (
                    <div className="text-sm text-neutral-500">Nenhuma organização disponível</div>
                  )}
                </div>
              )}
              <div className="space-y-1">
                <Label>Função</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  
                    
                  
                  
                    <option value="admin">Administrador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="member">Usuário</option>
                    {customRoleOptions.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-neutral-500 border-t mt-1 pt-1">Roles Customizadas</div>
                        {customRoleOptions.map(cr => (
                          <option key={cr} value={cr}>{cr}</option>
                        ))}
                      </>
                    )}
                  
                </Select>
              </div>
            </div>
            <DialogFooter className="sticky bottom-0 bg-background z-10 p-6 border-t">
              <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover <strong>{deleteTarget?.full_name}</strong> da organização?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {saving ? "Removendo..." : "Remover"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
