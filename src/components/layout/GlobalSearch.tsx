import { Input, Popover, PopoverContent, PopoverTrigger } from "@/components/ui/ds";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useGlobalSearch,
  type SearchResult,
} from "@/hooks/useGlobalSearch";
import { SearchResults } from "@/components/search/SearchResults";

export function GlobalSearch() {
  const { organizationId } = useOrganization();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);

  const { query, setQuery, results, loading, search, clearResults } =
    useGlobalSearch();

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        search(value);
      }, 150); // Reduzido para 150ms para uma busca em tempo real mais fluida
    },
    [search],
  );

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      debouncedSearch(value);
      setOpen(true);
    } else {
      clearResults();
      setOpen(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === "lead") {
      navigate("/leads", { state: { leadId: result.id } });
    } else if (result.type === "client") {
      navigate(`/clientes/${result.id}`);
    } else if (result.type === "task") {
      navigate("/tarefas", { state: { taskId: result.id } });
    } else if (result.type === "product") {
      navigate("/produtos", { state: { productId: result.id } });
    }

    setOpen(false);
    setQuery("");
    clearResults();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      clearResults();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="relative flex-1 w-full sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        <Input
          ref={inputRef}
          placeholder="Buscar leads, clientes, tarefas, produtos... (Ctrl+K)"
          value={query}
          onChange={(event) => handleSearchChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
          className="pl-9"
        />
      </div>
      
      <PopoverContent 
        className="p-0 w-[400px] sm:w-[500px]" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SearchResults
          results={[...results.leads, ...results.clientes, ...results.tarefas, ...results.vendas, ...results.produtos]}
          loading={loading}
          query={query}
          onSelect={handleSelectResult}
        />
      </PopoverContent>
    </Popover>
  );
}
