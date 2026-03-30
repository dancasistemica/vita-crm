import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GlobalSearchResultType = "lead" | "client" | "task" | "product";

export interface GlobalSearchResult {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle?: string;
}

const normalizeSearchValue = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

interface LeadResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  pipeline_stage: string | null;
}

interface ClientResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface TaskResult {
  id: string;
  title: string;
  lead_id: string | null;
  due_date: string | null;
}

interface ProductResult {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  notes: string | null;
}

export function useGlobalSearch(organizationId?: string | null) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const filterProductsByTerm = useCallback((items: ProductResult[], term: string) => {
    const filterTerm = normalizeSearchValue(term);
    if (!filterTerm) return [];
    const tokens = filterTerm.split(/\s+/).filter(Boolean);
    return items.filter((product) => {
      const haystack = normalizeSearchValue(
        [product.name, product.type, product.description, product.notes]
          .filter(Boolean)
          .join(" "),
      );
      return tokens.every((token) => haystack.includes(token));
    }).slice(0, 5);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  const search = useCallback(
    async (searchTerm: string) => {
      const normalized = searchTerm.trim();
      setQuery(searchTerm);

      if (!organizationId || normalized.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const term = normalized;

      try {
        const [leadsResponse, clientsResponse, tasksResponse, productsResponse] = await Promise.all([
          supabase
            .from("leads")
            .select("id, name, email, phone, pipeline_stage")
            .eq("organization_id", organizationId)
            .or(
              `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
            )
            .limit(5),
          supabase
            .from("clients")
            .select("id, name, email, phone")
            .eq("organization_id", organizationId)
            .or(
              `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
            )
            .limit(5),
          supabase
            .from("tasks")
            .select("id, title, lead_id, due_date")
            .eq("organization_id", organizationId)
            .ilike("title", `%${term}%`)
            .limit(5),
          supabase
            .from("products")
            .select("id, name, type, description, notes")
            .eq("organization_id", organizationId)
            .or(
              `name.ilike.%${term}%,type.ilike.%${term}%,description.ilike.%${term}%,notes.ilike.%${term}%`,
            )
            .limit(5),
        ]);

        if (leadsResponse.error) {
          console.error("[GlobalSearch] Erro ao buscar leads:", leadsResponse.error);
        }
        if (clientsResponse.error) {
          console.error("[GlobalSearch] Erro ao buscar clientes:", clientsResponse.error);
        }
        if (tasksResponse.error) {
          console.error("[GlobalSearch] Erro ao buscar tarefas:", tasksResponse.error);
        }
        const leads = (leadsResponse.data || []) as LeadResult[];
        const clients = (clientsResponse.data || []) as ClientResult[];
        const tasks = (tasksResponse.data || []) as TaskResult[];
        let products = (productsResponse.data || []) as ProductResult[];

        if (productsResponse.error) {
          console.error("[GlobalSearch] Erro ao buscar produtos:", productsResponse.error);
          const fallback = await supabase
            .from("products")
            .select("id, name, type, description, notes")
            .eq("organization_id", organizationId)
            .limit(200);
          if (fallback.error) {
            console.error("[GlobalSearch] Erro no fallback de produtos:", fallback.error);
          } else {
            products = filterProductsByTerm(fallback.data || [], term);
          }
        } else {
          products = filterProductsByTerm(products, term);
          if (products.length === 0 && (productsResponse.data || []).length > 0) {
            const fallback = await supabase
              .from("products")
              .select("id, name, type, description, notes")
              .eq("organization_id", organizationId)
              .limit(200);
            if (fallback.error) {
              console.error("[GlobalSearch] Erro no fallback de produtos:", fallback.error);
            } else {
              products = filterProductsByTerm(fallback.data || [], term);
            }
          }
        }

        const allResults: GlobalSearchResult[] = [
          ...leads.map((lead) => ({
            id: lead.id,
            type: "lead" as const,
            title: lead.name,
            subtitle: lead.email || lead.phone || undefined,
          })),
          ...clients.map((client) => ({
            id: client.id,
            type: "client" as const,
            title: client.name,
            subtitle: client.company || client.email || client.phone || undefined,
          })),
          ...tasks.map((task) => ({
            id: task.id,
            type: "task" as const,
            title: task.title,
            subtitle: task.due_date
              ? `Prazo: ${new Date(task.due_date).toLocaleDateString("pt-BR")}`
              : "Sem prazo",
          })),
          ...products.map((product) => ({
            id: product.id,
            type: "product" as const,
            title: product.name,
            subtitle: product.type || product.description || product.notes || undefined,
          })),
        ];

        console.log("[GlobalSearch] Resultados encontrados:", allResults.length, {
          leads: leads.length,
          clientes: clients.length,
          tarefas: tasks.length,
          produtos: products.length,
        });

        setResults(allResults);
      } catch (error) {
        console.error("[GlobalSearch] Erro inesperado na busca:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [filterProductsByTerm, organizationId],
  );

  return {
    query,
    setQuery,
    results,
    loading,
    search,
    clearResults,
  };
}
