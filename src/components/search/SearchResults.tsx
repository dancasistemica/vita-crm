import { CheckSquare, Package, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/ds";
import type { GlobalSearchResult, GlobalSearchResultType } from "@/hooks/useGlobalSearch";

interface SearchResultsProps {
  results: GlobalSearchResult[];
  loading: boolean;
  query: string;
  onSelect: (result: GlobalSearchResult) => void;
}

const typeLabels: Record<GlobalSearchResultType, string> = {
  lead: "Leads",
  client: "Clientes",
  task: "Tarefas",
  product: "Produtos",
};

const typeIcons: Record<GlobalSearchResultType, JSX.Element> = {
  lead: <UserPlus className="h-4 w-4 text-muted-foreground" />,
  client: <User className="h-4 w-4 text-muted-foreground" />,
  task: <CheckSquare className="h-4 w-4 text-muted-foreground" />,
  product: <Package className="h-4 w-4 text-muted-foreground" />,
};

export function SearchResults({ results, loading, query, onSelect }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Buscando...
      </div>
    );
  }

  if (!loading && results.length === 0 && query.trim().length >= 2) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Nenhum resultado encontrado
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="divide-y max-h-[60vh] overflow-y-auto">
      {(["lead", "client", "task", "product"] as GlobalSearchResultType[]).map((type) => {
        const typeResults = results.filter((result) => result.type === type);
        if (typeResults.length === 0) return null;

        return (
          <div key={type}>
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
              {type === "lead"
                ? "👤"
                : type === "client"
                  ? "👥"
                  : type === "task"
                    ? "✓"
                    : "📦"} {typeLabels[type]}
            </div>
            {typeResults.map((result) => (
              < variant="secondary" size="sm"
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
                  {result.subtitle && (
                    <div className="text-xs text-muted-foreground">
                      {result.subtitle}
                    </div>
                  )}
                </div>
              </>
            ))}
          </div>
        );
      })}
    </div>
  );
}
