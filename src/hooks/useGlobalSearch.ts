import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GlobalSearchResultType = "lead" | "client" | "task";

export interface GlobalSearchResult {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle?: string;
}

interface LeadResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  pipeline_stage: string | null;
}

interface ClientResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string | null;
}

interface TaskResult {
  id: string;
  title: string;
  lead_id: string | null;
  due_date: string | null;
  status: string | null;
  priority: string | null;
}

export function useGlobalSearch(organizationId?: string | null) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

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
      const term = normalized.toLowerCase();

      try {
        const [leadsResponse, clientsResponse, tasksResponse] = await Promise.all([
          supabase
            .from("leads")
            .select("id, name, email, phone, company, pipeline_stage")
            .eq("organization_id", organizationId)
            .or(
              `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,company.ilike.%${term}%`,
            )
            .limit(5),
          supabase
            .from("clients")
            .select("id, name, email, phone, company, status")
            .eq("organization_id", organizationId)
            .or(
              `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,company.ilike.%${term}%`,
            )
            .limit(5),
          supabase
            .from("tasks")
            .select("id, title, lead_id, due_date, status, priority")
            .eq("organization_id", organizationId)
            .ilike("title", `%${term}%`)
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

        const allResults: GlobalSearchResult[] = [
          ...leads.map((lead) => ({
            id: lead.id,
            type: "lead" as const,
            title: lead.name,
            subtitle: lead.company || lead.email || lead.phone || undefined,
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
        ];

        console.log("[GlobalSearch] Resultados encontrados:", allResults.length, {
          leads: leads.length,
          clientes: clients.length,
          tarefas: tasks.length,
        });

        setResults(allResults);
      } catch (error) {
        console.error("[GlobalSearch] Erro inesperado na busca:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [organizationId],
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
