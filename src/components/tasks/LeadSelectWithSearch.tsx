import { useState, useRef, useEffect, useMemo } from "react";
import { Lead } from "@/types/crm";
import { cn } from "@/lib/utils";
import { Search, X, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, Button, ScrollArea, Skeleton } from "@/components/ui/ds";

interface LeadSelectWithSearchProps {
  value: string;
  onChange: (leadId: string) => void;
  leads: Lead[];
  placeholder?: string;
  disabled?: boolean;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const COLORS = [
  "bg-primary/20 text-primary",
  "bg-accent/20 text-accent-foreground",
  "bg-destructive/10 text-destructive",
  "bg-secondary text-secondary-foreground",
];

function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export default function LeadSelectWithSearch({
  value,
  onChange,
  leads,
  placeholder = "Selecionar lead",
  disabled = false,
}: LeadSelectWithSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(-1);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setFocusIndex(-1);
    } else {
      setQuery("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return leads;
    const q = debouncedQuery.toLowerCase();
    return leads.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q)
    );
  }, [leads, debouncedQuery]);

  const selected = leads.find(l => l.id === value);

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusIndex >= 0 && focusIndex < filtered.length) {
      e.preventDefault();
      select(filtered[focusIndex].id);
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex >= 0 && listRef.current) {
      const el = listRef.current.children[focusIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [focusIndex]);

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <Button variant="secondary" size="sm"
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-2 ring-ring ring-offset-2"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <span className="flex items-center gap-3 truncate">
            <Avatar className="h-5 w-5 text-[10px]">
              <AvatarFallback className={cn("text-[10px]", colorFor(selected.id))}>
                {getInitials(selected.name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium truncate">{selected.name}</span>
            {selected.email && (
              <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                {selected.email}
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
          {/* Search */}
          <div className="flex items-center gap-3 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setFocusIndex(-1); }}
              placeholder="Buscar por nome, email ou telefone..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <Button variant="secondary" size="sm" type="button" onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* List */}
          <ScrollArea className="max-h-[300px]">
            <div ref={listRef} role="listbox">
              {leads.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum lead cadastrado. Crie um lead primeiro.
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum lead encontrado
                </p>
              ) : (
                filtered.map((lead, idx) => (
                  <Button variant="secondary" size="sm"
                    key={lead.id}
                    type="button"
                    role="option"
                    aria-selected={lead.id === value}
                    onClick={() => select(lead.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      "hover:bg-accent/50 cursor-pointer",
                      lead.id === value && "bg-primary/10 font-medium",
                      idx === focusIndex && "bg-accent/50"
                    )}
                  >
                    <Avatar className="h-7 w-7 text-xs shrink-0">
                      <AvatarFallback className={colorFor(lead.id)}>
                        {getInitials(lead.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{lead.name}</p>
                      <div className="flex items-center gap-3">
                        {lead.email && (
                          <span className="text-xs text-muted-foreground truncate">{lead.email}</span>
                        )}
                        {lead.phone && (
                          <span className="text-xs text-muted-foreground/60 truncate hidden sm:inline">
                            {lead.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
