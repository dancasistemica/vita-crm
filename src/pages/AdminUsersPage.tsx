import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSuperadmin } from "@/hooks/useSuperadmin";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: editName, phone: editPhone || null })
        .eq("id", editUser.user_id);
      if (profileError) throw profileError;

      if (editUser.member_id && editRole !== editUser.role && editRole !== "—") {
        const { error: roleError } = await supabase
          .from("organization_members")
          .update({ role: editRole as any })
          .eq("id", editUser.member_id);
        if (roleError) throw roleError;
      }

      toast.success("Usuário atualizado!");
      setEditOpen(false);
      setEditUser(null);
      fetchAll();
    } catch (err: any) {
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuperadmin) return null;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Todos os Usuários</h1>
        <Badge variant="secondary" className="ml-auto">{filtered.length} usuários</Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={orgFilter} onValueChange={(v) => { setOrgFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Organização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as organizações</SelectItem>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="owner">Proprietário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="member">Usuário</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" /> Resetar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhum usuário encontrado.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
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
                            <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">Owner</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {u.phone || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{u.org_name || "Sem org"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{roleLabels[u.role] || u.role}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(u)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {u.email && u.org_id && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Resetar senha" onClick={() => handleResetPassword(u)}>
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {u.org_id && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver organização" onClick={() => navigate("/superadmin")}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Remover" onClick={() => setDeleteTarget(u)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground p-4 border-t">
                  <span>Página {page} de {totalPages}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próximo</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={editUser?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            {editUser?.member_id && (
              <div className="space-y-1">
                <Label>Função</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Proprietário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="member">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label>Organização</Label>
              <Input value={editUser?.org_name || "Sem organização"} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.full_name}</strong>?
              {deleteTarget?.is_owner && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Este usuário é proprietário (owner) da organização "{deleteTarget?.org_name}". Removê-lo pode causar problemas na organização.
                </span>
              )}
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
  );
}
