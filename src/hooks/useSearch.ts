import { useCallback, useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";

type SearchResultType = "lead" | "client" | "task";
type SearchType = "all" | SearchResultType;

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  organizationId: string;
}

export const useSearch = () => {
  const { organizationId } = useOrganization();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<SearchType>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(
    async (query: string, filter: SearchType) => {
      if (!query.trim() || !organizationId) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const searchResults: SearchResult[] = [];

        if (filter === "all" || filter === "lead") {
          const { data: leads, error: leadsError } = await supabase
            .from("leads")
            .select("id, name, email, phone")
            .eq("organization_id", organizationId)
            .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
            .limit(5);

          if (leadsError) {
            console.error("[useSearch] Erro ao buscar leads:", leadsError);
          }

          if (leads) {
            searchResults.push(
              ...leads.map((lead) => ({
                id: lead.id,
                type: "lead",
                title: lead.name,
                subtitle: lead.email || lead.phone,
                organizationId,
              }))
            );
          }
        }

        if (filter === "all" || filter === "client") {
          const { data: clients, error: clientsError } = await supabase
            .from("clients")
            .select("id, name, email")
            .eq("organization_id", organizationId)
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5);

          if (clientsError) {
            console.error("[useSearch] Erro ao buscar clients:", clientsError);
          }

          if (clients) {
            searchResults.push(
              ...clients.map((client) => ({
                id: client.id,
                type: "client",
                title: client.name,
                subtitle: client.email,
                organizationId,
              }))
            );
          }
        }

        if (filter === "all" || filter === "task") {
          const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select("id, title, description")
            .eq("organization_id", organizationId)
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(5);

          if (tasksError) {
            console.error("[useSearch] Erro ao buscar tasks:", tasksError);
          }

          if (tasks) {
            searchResults.push(
              ...tasks.map((task) => ({
                id: task.id,
                type: "task",
                title: task.title,
                subtitle: task.description,
                organizationId,
              }))
            );
          }
        }

        setResults(searchResults);
        console.log("[useSearch] Resultados encontrados:", searchResults.length, "Filtro:", filter);
      } catch (error) {
        console.error("[useSearch] Erro ao buscar:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [organizationId]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      performSearch(query, selectedFilter);
    },
    [performSearch, selectedFilter]
  );

  const handleFilterChange = useCallback(
    (filter: SearchType) => {
      setSelectedFilter(filter);
      performSearch(searchQuery, filter);
    },
    [performSearch, searchQuery]
  );

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    selectedFilter,
    setSelectedFilter: handleFilterChange,
    results,
    loading,
  };
};
