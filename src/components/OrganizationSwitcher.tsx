import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components/ui/ds";
import { useState, useRef, useEffect } from 'react';
import { useOrganizationSwitch } from '@/hooks/useOrganizationSwitch';
import { ChevronDown, Search, Building2, Check, Globe } from 'lucide-react';
import { CONSOLIDATED_ORG_ID } from '@/contexts/OrganizationContext';
import { cn } from "@/lib/utils";

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

  if (!isSuperadmin) return null;

  const filtered = organizations.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.description?.toLowerCase().includes(search.toLowerCase())
  );

  const isConsolidated = currentOrgId === CONSOLIDATED_ORG_ID;

  return (
    <div ref={ref} className="w-full relative">
      <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1.5 px-1">
        Trocar Unidade
      </p>
      
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-all text-left shadow-sm",
          loading && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-6 w-6 shrink-0 rounded-md bg-neutral-100 flex items-center justify-center overflow-hidden">
            {isConsolidated ? (
              <Globe className="h-3.5 w-3.5 text-primary-600" />
            ) : currentOrganization?.logo_url ? (
              <img src={currentOrganization.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-3.5 w-3.5 text-neutral-400" />
            )}
          </div>
          <span className="text-sm font-semibold text-neutral-900 truncate">
            {loading ? 'Carregando...' : (isConsolidated ? 'Todas as Unidades' : currentOrganization?.name || 'Selecionar...')}
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-lg shadow-xl z-[1000] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-neutral-100 bg-neutral-50/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-sm"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto py-1">
            {/* Consolidado option */}
            {(!search || 'todas as unidades consolidado'.includes(search.toLowerCase())) && (
              <button
                onClick={() => { switchOrganization(CONSOLIDATED_ORG_ID); setOpen(false); setSearch(''); }}
                className={cn(
                  "w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-primary-50 transition-colors",
                  isConsolidated && "bg-primary-50 text-primary-700"
                )}
              >
                <div className="h-7 w-7 shrink-0 rounded-md bg-primary-100 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Todas as Unidades</p>
                  <p className="text-[10px] text-neutral-500 truncate">Visão consolidada</p>
                </div>
                {isConsolidated && <Check className="h-4 w-4 text-primary-600 shrink-0" />}
              </button>
            )}

            {filtered.length === 0 && search ? (
              <p className="p-4 text-center text-xs text-neutral-500 italic">Nenhuma encontrada</p>
            ) : (
              filtered.map(org => {
                const active = currentOrgId === org.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => { switchOrganization(org.id); setOpen(false); setSearch(''); }}
                    className={cn(
                      "w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-primary-50 transition-colors",
                      active && "bg-primary-50 text-primary-700"
                    )}
                  >
                    <div className="h-7 w-7 shrink-0 rounded-md bg-neutral-100 flex items-center justify-center overflow-hidden">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-500">{org.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{org.name}</p>
                    </div>
                    {active && <Check className="h-4 w-4 text-primary-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
          
          <div className="bg-neutral-50 px-3 py-1.5 border-t border-neutral-100">
            <p className="text-[10px] text-neutral-400 font-medium">Total: {organizations.length} unidade(s)</p>
          </div>
        </div>
      )}
    </div>
  );
}