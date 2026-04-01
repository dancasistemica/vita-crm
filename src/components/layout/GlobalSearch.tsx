import { Input, Popover } from "@/components/ui/ds";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useGlobalSearch,
  type GlobalSearchResult,
} from "@/hooks/useGlobalSearch";
import { SearchResults } from "@/components/search/SearchResults";

export function GlobalSearch() {
  const { organizationId } = useOrganization();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);

  const { query, setQuery, results, loading, search, clearResults } =
    useGlobalSearch(organizationId);

  useEffect(() => {
    console.log("[GlobalSearch] Barra de busca inicializada");
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
      }, 300);
    },
    [search],
  );

  const handleSearchChange = (value: string) => {
    setQuery(value);
    console.log("[GlobalSearch] Query:", value);

    if (value.trim().length >= 2) {
      debouncedSearch(value);
      setOpen(true);
    } else {
      clearResults();
    }
  };

  const handleSelectResult = (result: GlobalSearchResult) => {
    console.log("[GlobalSearch] Resultado selecionado:", result.type, result.id);

    if (result.type === "lead") {
      console.log("[GlobalSearch] Navegando para:", "/leads");
      navigate("/leads", { state: { leadId: result.id } });
    } else if (result.type === "client") {
      const url = `/clientes/${result.id}`;
      console.log("[GlobalSearch] Navegando para:", url);
      navigate(url);
    } else if (result.type === "task") {
      console.log("[GlobalSearch] Navegando para:", "/tarefas");
      navigate("/tarefas", { state: { taskId: result.id } });
    } else if (result.type === "product") {
      console.log("[GlobalSearch] Navegando para:", "/produtos");
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

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            ref={inputRef}
            placeholder="Buscar leads, clientes, tarefas, produtos..."
            value={query}
            onChange={(event) => handleSearchChange(event.target.value)}
            onFocus={() => setOpen(true)}
            className="pl-9"
          />
        </div>
      
      <div className="absolute z-50 mt-2 p-4 bg-white border border-neutral-200 rounded-lg shadow-lg"
        align="start"
        className="w-[--radix-popover-trigger-width] max-w-[90vw] p-0"
      >
        <SearchResults
          results={results}
          loading={loading}
          query={query}
          onSelect={handleSelectResult}
        />
      </div>
    </Popover>
  );
}
