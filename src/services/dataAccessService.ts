import { supabase } from '@/integrations/supabase/client';

interface DataAccessOptions {
  organizationId: string;
  userId: string;
}

export class DataAccessService {
  private _orgId: string;
  private userId: string;

  get orgId(): string {
    return this._orgId;
  }

  constructor(options: DataAccessOptions) {
    this._orgId = options.organizationId;
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
      .insert({ ...interactionData, organization_id: this.orgId } as any)
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
      .insert({ ...productData, organization_id: this.orgId } as any)
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

  // ── PRODUCT SALES STAGES ──────────────────────────────
  async upsertProductStages(productId: string, stages: { id?: string; name: string; value: number; link?: string }[]) {
    // Delete existing stages for this product
    const { error: deleteError } = await supabase
      .from('product_sales_stages')
      .delete()
      .eq('product_id', productId);
    if (deleteError) { console.error('[DataAccessService] deleteProductStages error:', deleteError); throw deleteError; }

    if (stages.length === 0) return [];

    const rows = stages.map(s => ({
      product_id: productId,
      name: s.name,
      value: s.value,
      link: s.link || '',
    }));

    const { data, error } = await supabase
      .from('product_sales_stages')
      .insert(rows as any)
      .select();
    if (error) { console.error('[DataAccessService] insertProductStages error:', error); throw error; }
    return data || [];
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
      .insert({ ...tagData, organization_id: this.orgId } as any)
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

  // ── TASK STATUSES ───────────────────────────────────────
  async getTaskStatuses() {
    const { data, error } = await supabase
      .from('task_statuses')
      .select('*')
      .eq('organization_id', this.orgId)
      .order('order_index');
    if (error) { console.error('[DataAccessService] getTaskStatuses error:', error); throw error; }
    return data || [];
  }

  async createTaskStatus(statusData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('task_statuses')
      .insert({ ...statusData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createTaskStatus error:', error); throw error; }
    return data;
  }

  async updateTaskStatus(statusId: string, statusData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('task_statuses')
      .update(statusData)
      .eq('id', statusId)
      .eq('organization_id', this.orgId)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateTaskStatus error:', error); throw error; }
    return data;
  }

  async deleteTaskStatus(statusId: string) {
    const { error } = await supabase
      .from('task_statuses')
      .delete()
      .eq('id', statusId)
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] deleteTaskStatus error:', error); throw error; }
    return true;
  }


  async getPipelineStages() {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('organization_id', this.orgId)
      .order('sort_order');
    if (error) { console.error('[DataAccessService] getPipelineStages error:', error); throw error; }
    return data || [];
  }

  async createPipelineStage(name: string, sortOrder: number) {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert({ name, sort_order: sortOrder, organization_id: this.orgId, active: true } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createPipelineStage error:', error); throw error; }
    return data;
  }

  async updatePipelineStage(id: string, updates: { name?: string; sort_order?: number; active?: boolean }) {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', this.orgId)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updatePipelineStage error:', error); throw error; }
    return data;
  }

  async deletePipelineStage(id: string) {
    const { error } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', id)
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] deletePipelineStage error:', error); throw error; }
    return true;
  }

  async reorderPipelineStages(stages: Array<{ id: string; sort_order: number }>) {
    const promises = stages.map(s =>
      supabase
        .from('pipeline_stages')
        .update({ sort_order: s.sort_order })
        .eq('id', s.id)
        .eq('organization_id', this.orgId)
    );
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('[DataAccessService] reorderPipelineStages errors:', errors);
      throw errors[0].error;
    }
    console.log('[DataAccessService] reorderPipelineStages: reordered', stages.length, 'stages');
  }

  async getInterestLevels() {
    const { data, error } = await supabase
      .from('interest_levels')
      .select('*')
      .eq('organization_id', this.orgId)
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) { console.error('[DataAccessService] getInterestLevels error:', error); throw error; }
    return data || [];
  }

  async getLeadOrigins() {
    const { data, error } = await supabase
      .from('lead_origins')
      .select('*')
      .eq('organization_id', this.orgId)
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) { console.error('[DataAccessService] getLeadOrigins error:', error); throw error; }
    return data || [];
  }

  async createLeadOrigin(name: string, sortOrder: number) {
    const { data, error } = await supabase
      .from('lead_origins')
      .insert({ name, sort_order: sortOrder, organization_id: this.orgId, active: true } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createLeadOrigin error:', error); throw error; }
    return data;
  }

  async updateLeadOrigin(id: string, updates: { name?: string; sort_order?: number; active?: boolean }) {
    const { data, error } = await supabase
      .from('lead_origins')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', this.orgId)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateLeadOrigin error:', error); throw error; }
    return data;
  }

  async deleteLeadOrigin(id: string) {
    const { error } = await supabase
      .from('lead_origins')
      .delete()
      .eq('id', id)
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] deleteLeadOrigin error:', error); throw error; }
    return true;
  }

  async reorderLeadOrigins(origins: Array<{ id: string; sort_order: number }>) {
    const promises = origins.map(o =>
      supabase
        .from('lead_origins')
        .update({ sort_order: o.sort_order })
        .eq('id', o.id)
        .eq('organization_id', this.orgId)
    );
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0].error;
  }

  // ── INTEREST LEVELS CRUD ──────────────────────────────────
  async createInterestLevel(value: string, label: string, sortOrder: number) {
    const { data, error } = await supabase
      .from('interest_levels')
      .insert({ value, label, sort_order: sortOrder, organization_id: this.orgId, active: true } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createInterestLevel error:', error); throw error; }
    return data;
  }

  async updateInterestLevel(id: string, updates: { value?: string; label?: string; sort_order?: number; active?: boolean }) {
    const { data, error } = await supabase
      .from('interest_levels')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', this.orgId)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateInterestLevel error:', error); throw error; }
    return data;
  }

  async deleteInterestLevel(id: string) {
    const { error } = await supabase
      .from('interest_levels')
      .delete()
      .eq('id', id)
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] deleteInterestLevel error:', error); throw error; }
    return true;
  }

  async reorderInterestLevels(levels: Array<{ id: string; sort_order: number }>) {
    const promises = levels.map(l =>
      supabase
        .from('interest_levels')
        .update({ sort_order: l.sort_order })
        .eq('id', l.id)
        .eq('organization_id', this.orgId)
    );
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0].error;
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
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('id, user_id, organization_id, role, created_at')
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] getOrgMembers error:', error); throw error; }
    if (!members || members.length === 0) return [];

    // Fetch profiles for these members
    const userIds = members.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    return members.map(m => ({
      ...m,
      profiles: profileMap.get(m.user_id) || null,
    }));
  }

  async getRolePermissions() {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('organization_id', this.orgId);
    if (error) { console.error('[DataAccessService] getRolePermissions error:', error); throw error; }
    return data || [];
  }

  // ── CRM FIELD ORDER ──────────────────────────────────────
  async getCRMFieldOrder() {
    const { data, error } = await supabase
      .from('crm_field_order')
      .select('field_name, sort_order')
      .eq('organization_id', this.orgId)
      .order('sort_order', { ascending: true });
    if (error) { console.error('[DataAccessService] getCRMFieldOrder error:', error); throw error; }
    return data || [];
  }

  async reorderCRMFields(fields: Array<{ name: string; order: number }>) {
    const promises = fields.map(f =>
      supabase
        .from('crm_field_order')
        .upsert({
          organization_id: this.orgId,
          field_name: f.name,
          sort_order: f.order,
          updated_at: new Date().toISOString()
        }, { onConflict: 'organization_id,field_name' })
    );
    await Promise.all(promises);
    console.log('[DataAccessService] reorderCRMFields:', fields.length);
  }
}

// Hook-friendly factory
export function createDataAccessService(organizationId: string, userId: string): DataAccessService {
  if (!organizationId) {
    throw new Error('[DataAccessService] organizationId é obrigatório');
  }
  return new DataAccessService({ organizationId, userId });
}
