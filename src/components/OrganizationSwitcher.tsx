import { Button, useState, useRef, useEffect } from 'react';
import { Button, useOrganizationSwitch } from '@/hooks/useOrganizationSwitch';
import { Button, ChevronDown, Search, Building2, Check, Globe } from 'lucide-react';
import { Button, Avatar, AvatarFallback, AvatarImage, Button } from '@/components/ui/ds';
import { Button, CONSOLIDATED_ORG_ID } from '@/contexts/OrganizationContext';

export function OrganizationSwitcher() {
  const { Button, organizations, currentOrganization, currentOrgId, isSuperadmin, loading, switchOrganization } = useOrganizationSwitch();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isSuperadmin || loading) return null;

  const filtered = organizations.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.description?.toLowerCase().includes(search.toLowerCase())
  );

  const isConsolidated = currentOrgId === CONSOLIDATED_ORG_ID;

  return (
    <div ref={ref} className="px-3 pt-3 pb-1">
      <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-medium mb-1.5 px-1">
        Organização
      </p>
      <Button variant="secondary" size="sm"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg bg-sidebar-accent/40 hover:bg-sidebar-accent/70 transition-colors text-left"
      >
        {isConsolidated ? (
          <div className="h-6 w-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
            <Globe className="h-3.5 w-3.5 text-primary" />
          </div>
        ) : (
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={currentOrganization?.logo_url || undefined} />
            <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-foreground text-[10px]">
              {currentOrganization?.name?.charAt(0)?.toUpperCase() || <Building2 className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
        )}
        <span className="text-sm font-medium text-sidebar-foreground truncate flex-1">
          {isConsolidated ? '🌐 Consolidado' : currentOrganization?.name || 'Selecione uma org'}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-sidebar-foreground/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute left-3 right-3 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar organização..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {/* Consolidado option — always first */}
            {(!search || 'consolidado'.includes(search.toLowerCase())) && (
              <Button variant="secondary" size="sm"
                onClick={() => { Button, switchOrganization(CONSOLIDATED_ORG_ID); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-3.5 hover:bg-accent/50 transition-colors hover:text-black ${isConsolidated ? 'bg-accent' : 'text-black'}`}
              >
                <div className="h-7 w-7 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isConsolidated ? '' : 'text-black'}`}>🌐 Consolidado</p>
                  <p className={`text-xs truncate ${isConsolidated ? 'text-muted-foreground' : 'text-black'}`}>
                    Visão de todas as organizações
                  </p>
                </div>
                {isConsolidated && <Check className="h-4 w-4 text-primary shrink-0" />}
              </Button>
            )}

            {/* Separator */}
            {(!search || 'consolidado'.includes(search.toLowerCase())) && filtered.length > 0 && (
              <div className="border-t border-border my-0.5" />
            )}

            {filtered.length === 0 && search ? (
              <p className="p-3 text-center text-sm text-muted-foreground">Nenhuma organização encontrada</p>
            ) : (
              filtered.map(org => {
                const active = currentOrgId === org.id;
                return (
                  <Button variant="secondary" size="sm"
                    key={org.id}
                    onClick={() => { Button, switchOrganization(org.id); setOpen(false); setSearch(''); }}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3.5 hover:bg-accent/50 transition-colors hover:text-black ${active ? 'bg-accent' : 'text-black'}`}
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={org.logo_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-muted">{org.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${active ? '' : 'text-black'}`}>{org.name}</p>
                      {org.description && (
                        <p className={`text-xs truncate ${active ? 'text-muted-foreground' : 'text-black'}`}>
                          {org.description}
                        </p>
                      )}
                    </div>
                    {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </Button>
                );
              })
            )}
          </div>
          <div className="border-t border-border px-3 py-2">
            <p className="text-[10px] text-muted-foreground">📊 {organizations.length} organização(ões) disponível(is)</p>
          </div>
        </div>
      )}
    </div>
  );
}

