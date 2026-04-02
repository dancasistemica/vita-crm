import { Button } from "@/components/ui/ds";
import { cn } from "@/lib/utils";
import { CheckSquare, Package, User, UserPlus } from "lucide-react";
import type { SearchResult, SearchResultType } from "@/hooks/useGlobalSearch";

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
  onSelect: (result: SearchResult) => void;
}

const typeLabels: Record<SearchResultType | 'sale', string> = {
  lead: "Leads",
  client: "Clientes",
  task: "Tarefas",
  product: "Produtos",
  sale: "Vendas",
};

const typeIcons: Record<SearchResultType | 'sale', JSX.Element> = {
  lead: <UserPlus className="h-4 w-4 text-neutral-500" />,
  client: <User className="h-4 w-4 text-neutral-500" />,
  task: <CheckSquare className="h-4 w-4 text-neutral-500" />,
  product: <Package className="h-4 w-4 text-neutral-500" />,
  sale: <Package className="h-4 w-4 text-neutral-500" />,
};

export function SearchResults({ results, loading, query, onSelect }: SearchResultsProps) {
  if (loading && results.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-neutral-500 flex items-center justify-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Buscando...
      </div>
    );
  }

  if (!loading && results.length === 0 && query.trim().length >= 2) {
    return (
      <div className="p-4 text-center text-sm text-neutral-500">
        Nenhum resultado encontrado
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className={cn("divide-y max-h-[60vh] overflow-y-auto relative", loading && "opacity-60 pointer-events-none")}>
      {loading && (
        <div className="absolute top-2 right-2 z-10">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {(["lead", "client", "task", "product", "sale"] as SearchResultType[]).map((type) => {
        const typeResults = results.filter((result) => result.type === type);
        if (typeResults.length === 0) return null;

        return (
          <div key={type}>
            <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase">
              {type === "lead"
                ? "👤"
                : type === "client"
                  ? "👥"
                  : type === "task"
                    ? "✓"
                    : "📦"} {typeLabels[type]}
            </div>
            {typeResults.map((result) => (
              <Button variant="secondary" size="sm"
                key={result.id}
                onClick={() => onSelect(result)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors min-h-11"
                type="button"
              >
                <div className="mt-0.5">{typeIcons[type]}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">
                    {result.title}
                  </div>
                  {(result.description || result.email || result.phone) && (
                    <div className="text-xs text-neutral-500">
                      {result.description || result.email || result.phone}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
