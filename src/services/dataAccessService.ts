import { supabase } from '@/integrations/supabase/client';

interface DataAccessOptions {
  organizationId: string;
  userId: string;
}

export class DataAccessService {
  private orgId: string;
  private userId: string;

  constructor(options: DataAccessOptions) {
    this.orgId = options.organizationId;
    this.userId = options.userId;
    console.log('[DataAccessService] Inicializado para org:', this.orgId);
  }

  // ── LEADS ──────────────────────────────────────────────
  async getLeads(filters?: { search?: string; interestLevel?: string; pipelineStage?: string }) {
    let query = supabase
      .from('leads')
      .select('*')
      .eq('organization_id', this.orgId);

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    if (filters?.interestLevel) {
      query = query.eq('interest_level', filters.interestLevel);
    }
    if (filters?.pipelineStage) {
      query = query.eq('pipeline_stage', filters.pipelineStage);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) { console.error('[DataAccessService] getLeads error:', error); throw error; }
    return data || [];
  }

  async getLeadById(leadId: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('organization_id', this.orgId)
      .single();
    if (error) { console.error('[DataAccessService] getLeadById error:', error); throw error; }
    return data;
  }

  async createLead(leadData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...leadData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createLead error:', error); throw error; }
    return data;
  }

  async updateLead(leadId: string, leadData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...leadData, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .eq('organization_id', this.orgId)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateLead error:', error); throw error; }
    return data;
  }

  async deleteLead(leadId: string) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] deleteLead error:', error); throw error; }
    return true;
  }

  // ── SALES ──────────────────────────────────────────────
  async getSales(filters?: { status?: string }) {
    let query = supabase
      .from('sales')
      .select('*, leads(name)')
      .eq('organization_id', this.orgId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) { console.error('[DataAccessService] getSales error:', error); throw error; }
    return data || [];
  }

  async createSale(saleData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('sales')
      .insert({ ...saleData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createSale error:', error); throw error; }
    return data;
  }

  async updateSale(saleId: string, saleData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('sales')
      .update({ ...saleData, updated_at: new Date().toISOString() })
      .eq('id', saleId)
      .eq('organization_id', this.orgId)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateSale error:', error); throw error; }
    return data;
  }

  async deleteSale(saleId: string) {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId)
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] deleteSale error:', error); throw error; }
    return true;
  }

  // ── TASKS ──────────────────────────────────────────────
  async getTasks(filters?: { completed?: boolean }) {
    let query = supabase
      .from('tasks')
      .select('*, leads(name)')
      .eq('organization_id', this.orgId);

    if (filters?.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }

    const { data, error } = await query.order('due_date', { ascending: true });
    if (error) { console.error('[DataAccessService] getTasks error:', error); throw error; }
    return data || [];
  }

  async createTask(taskData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...taskData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createTask error:', error); throw error; }
    return data;
  }

  async updateTask(taskId: string, taskData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', taskId)
      .eq('organization_id', this.orgId)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateTask error:', error); throw error; }
    return data;
  }

  async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] deleteTask error:', error); throw error; }
    return true;
  }

  // ── INTERACTIONS ───────────────────────────────────────
  async getInteractions(filters?: { leadId?: string }) {
    let query = supabase
      .from('interactions')
      .select('*, leads(name)')
      .eq('organization_id', this.orgId);

    if (filters?.leadId) {
      query = query.eq('lead_id', filters.leadId);
    }

    const { data, error } = await query.order('interaction_date', { ascending: false });
    if (error) { console.error('[DataAccessService] getInteractions error:', error); throw error; }
    return data || [];
  }

  async createInteraction(interactionData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('interactions')
      .insert({ ...interactionData, organization_id: this.orgId })
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createInteraction error:', error); throw error; }
    return data;
  }

  async deleteInteraction(interactionId: string) {
    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('id', interactionId)
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] deleteInteraction error:', error); throw error; }
    return true;
  }

  // ── PRODUCTS ───────────────────────────────────────────
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_sales_stages(*)')
      .eq('organization_id', this.orgId)
      .order('created_at', { ascending: false });
    if (error) { console.error('[DataAccessService] getProducts error:', error); throw error; }
    return data || [];
  }

  async createProduct(productData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...productData, organization_id: this.orgId })
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createProduct error:', error); throw error; }
    return data;
  }

  async updateProduct(productId: string, productData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .eq('organization_id', this.orgId)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateProduct error:', error); throw error; }
    return data;
  }

  async deleteProduct(productId: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] deleteProduct error:', error); throw error; }
    return true;
  }

  // ── TAGS ───────────────────────────────────────────────
  async getTags() {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('organization_id', this.orgId)
      .order('name');
    if (error) { console.error('[DataAccessService] getTags error:', error); throw error; }
    return data || [];
  }

  async createTag(tagData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('tags')
      .insert({ ...tagData, organization_id: this.orgId })
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createTag error:', error); throw error; }
    return data;
  }

  async updateTag(tagId: string, tagData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('tags')
      .update(tagData)
      .eq('id', tagId)
      .eq('organization_id', this.orgId)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateTag error:', error); throw error; }
    return data;
  }

  async deleteTag(tagId: string) {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] deleteTag error:', error); throw error; }
    return true;
  }

  // ── CONFIG TABLES ──────────────────────────────────────
  async getPipelineStages() {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('organization_id', this.orgId)
      .order('sort_order');
    if (error) { console.error('[DataAccessService] getPipelineStages error:', error); throw error; }
    return data || [];
  }

  async getInterestLevels() {
    const { data, error } = await supabase
      .from('interest_levels')
      .select('*')
      .eq('organization_id', this.orgId)
      .eq('active', true);
    if (error) { console.error('[DataAccessService] getInterestLevels error:', error); throw error; }
    return data || [];
  }

  async getLeadOrigins() {
    const { data, error } = await supabase
      .from('lead_origins')
      .select('*')
      .eq('organization_id', this.orgId)
      .eq('active', true)
      .order('name');
    if (error) { console.error('[DataAccessService] getLeadOrigins error:', error); throw error; }
    return data || [];
  }

  async getPaymentMethods() {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('organization_id', this.orgId)
      .eq('active', true)
      .order('name');
    if (error) { console.error('[DataAccessService] getPaymentMethods error:', error); throw error; }
    return data || [];
  }

  async getOrgMembers() {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*, profiles(full_name, email, phone, avatar_url)')
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] getOrgMembers error:', error); throw error; }
    return data || [];
  }

  async getRolePermissions() {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] getRolePermissions error:', error); throw error; }
    return data || [];
  }
}

// Hook-friendly factory
export function createDataAccessService(organizationId: string, userId: string): DataAccessService {
  if (!organizationId) {
    throw new Error('[DataAccessService] organizationId é obrigatório');
  }
  return new DataAccessService({ organizationId, userId });
}
