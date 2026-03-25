import { useCallback, useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";

type SearchResultType = "lead" | "client" | "task";

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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !organizationId) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: leads, error: leadsError } = await supabase
          .from("leads")
          .select("id, name, email, phone")
          .eq("organization_id", organizationId)
          .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(5);

        if (leadsError) {
          console.error("[useSearch] Erro ao buscar leads:", leadsError);
        }

        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select("id, name, email")
          .eq("organization_id", organizationId)
          .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(5);

        if (clientsError) {
          console.error("[useSearch] Erro ao buscar clients:", clientsError);
        }

        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select("id, title, description")
          .eq("organization_id", organizationId)
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5);

        if (tasksError) {
          console.error("[useSearch] Erro ao buscar tasks:", tasksError);
        }

        const searchResults: SearchResult[] = [
          ...(leads?.map((lead) => ({
            id: lead.id,
            type: "lead",
            title: lead.name,
            subtitle: lead.email || lead.phone,
            organizationId,
          })) || []),
          ...(clients?.map((client) => ({
            id: client.id,
            type: "client",
            title: client.name,
            subtitle: client.email,
            organizationId,
          })) || []),
          ...(tasks?.map((task) => ({
            id: task.id,
            type: "task",
            title: task.title,
            subtitle: task.description,
            organizationId,
          })) || []),
        ];

        setResults(searchResults);
        console.log("[useSearch] Resultados encontrados:", searchResults.length);
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
      performSearch(query);
    },
    [performSearch]
  );

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    results,
    loading,
  };
};
