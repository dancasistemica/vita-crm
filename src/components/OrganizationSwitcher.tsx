import { useState, useRef, useEffect } from 'react';
import { useOrganizationSwitch } from '@/hooks/useOrganizationSwitch';
import { ChevronDown, Search, Building2, Check, Globe } from 'lucide-react';
import { CONSOLIDATED_ORG_ID } from '@/contexts/OrganizationContext';
import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui/ds";

export function OrganizationSwitcher() {
  const { organizations, currentOrganization, currentOrgId, isSuperadmin, loading, switchOrganization } = useOrganizationSwitch();
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
      <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium mb-1.5 px-1">
        Organização
      </p>
      <Button variant="secondary" size="sm"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
      >
        {isConsolidated ? (
          <div className="h-6 w-6 shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
            <Globe className="h-3.5 w-3.5 text-primary-600" />
          </div>
        ) : (
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={currentOrganization?.logo_url || undefined} />
            <AvatarFallback className="bg-primary-50 text-primary-700 text-[10px]">
              {currentOrganization?.name?.charAt(0)?.toUpperCase() || <Building2 className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
        )}
        <span className="text-sm font-medium text-neutral-900 truncate flex-1">
          {isConsolidated ? '🌐 Consolidado' : currentOrganization?.name || 'Selecione uma org'}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute left-3 right-3 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-neutral-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar organização..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {/* Consolidado option — always first */}
            {(!search || 'consolidado'.includes(search.toLowerCase())) && (
              <button
                onClick={() => { switchOrganization(CONSOLIDATED_ORG_ID); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-3.5 hover:bg-neutral-50 transition-colors ${isConsolidated ? 'bg-neutral-50' : ''}`}
              >
                <div className="h-7 w-7 shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-neutral-900">🌐 Consolidado</p>
                  <p className="text-xs truncate text-neutral-500">
                    Visão de todas as organizações
                  </p>
                </div>
                {isConsolidated && <Check className="h-4 w-4 text-primary-600 shrink-0" />}
              </button>
            )}

            {filtered.length === 0 && search ? (
              <p className="p-3 text-center text-sm text-neutral-500">Nenhuma organização encontrada</p>
            ) : (
              filtered.map(org => {
                const active = currentOrgId === org.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => { switchOrganization(org.id); setOpen(false); setSearch(''); }}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3.5 hover:bg-neutral-50 transition-colors ${active ? 'bg-neutral-50' : ''}`}
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={org.logo_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-neutral-100">{org.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-neutral-900">{org.name}</p>
                      {org.description && (
                        <p className="text-xs truncate text-neutral-500">
                          {org.description}
                        </p>
                      )}
                    </div>
                    {active && <Check className="h-4 w-4 text-primary-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-neutral-100 px-3 py-2">
            <p className="text-[10px] text-neutral-400">📊 {organizations.length} organização(ões) disponível(is)</p>
          </div>
        </div>
      )}
    </div>
  );
}
