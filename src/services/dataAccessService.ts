import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

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

  get isConsolidated(): boolean {
    return this._orgId === 'consolidado';
  }

  constructor(options: DataAccessOptions) {
    this._orgId = options.organizationId;
    this.userId = options.userId;
    console.log('[DataAccessService] Inicializado para org:', this.orgId, 'consolidado:', this.isConsolidated);
  }

  // ── HELPER ──────────────────────────────────────────
  private applyOrgFilter(query: any) {
    if (this.isConsolidated) return query;
    return query.eq('organization_id', this.orgId);
  }

  private checkConsolidated() {
    if (this.isConsolidated) {
      throw new Error("Não é possível realizar esta operação no modo consolidado. Selecione uma organização específica.");
    }
  }


  // ── LEADS ──────────────────────────────────────────────
  async getLeads(filters?: { search?: string; interestLevel?: string; pipelineStage?: string }) {
    let query = supabase.from('leads').select('*');
    query = this.applyOrgFilter(query);

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
    let query = supabase
      .from('leads')
      .select('*')
      .eq('id', leadId);
    
    query = this.applyOrgFilter(query);

    const { data, error } = await query.single();
    if (error) { console.error('[DataAccessService] getLeadById error:', error); throw error; }
    return data;
  }

  async createLead(leadData: Record<string, unknown>) {
    this.checkConsolidated();
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...leadData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createLead error:', error); throw error; }
    return data;
  }

  async updateLead(leadId: string, leadData: Record<string, unknown>) {
    let query = supabase
      .from('leads')
      .update({ ...leadData, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    
    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateLead error:', error); throw error; }
    return data;
  }

  async deleteLead(leadId: string) {
    let query = supabase
      .from('leads')
      .delete()
      .eq('id', leadId);
    
    query = this.applyOrgFilter(query);

    const { error } = await query;
    if (error) { console.error('[DataAccessService] deleteLead error:', error); throw error; }
    return true;
  }

  // ── SALES ──────────────────────────────────────────────
  async getSales(filters?: { status?: string }) {
    let query = supabase.from('sales').select('*, leads(name)');
    query = this.applyOrgFilter(query);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) { console.error('[DataAccessService] getSales error:', error); throw error; }
    return data || [];
  }

  async createSale(saleData: Record<string, unknown>) {
    this.checkConsolidated();
    const { data, error } = await supabase
      .from('sales')
      .insert({ ...saleData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createSale error:', error); throw error; }
    return data;
  }

  async updateSale(saleId: string, saleData: Record<string, unknown>) {
    let query = supabase
      .from('sales')
      .update({ ...saleData, updated_at: new Date().toISOString() })
      .eq('id', saleId);
    
    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateSale error:', error); throw error; }
    return data;
  }

  async deleteSale(saleId: string) {
    let query = supabase
      .from('sales')
      .delete()
      .eq('id', saleId);
    
    query = this.applyOrgFilter(query);

    const { error } = await query;
    if (error) { console.error('[DataAccessService] deleteSale error:', error); throw error; }
    return true;
  }

  // ── TASKS ──────────────────────────────────────────────
  async getTasks(filters?: { completed?: boolean }) {
    let query = supabase.from('tasks').select('*, leads(name)');
    query = this.applyOrgFilter(query);

    if (filters?.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }

    const { data, error } = await query.order('due_date', { ascending: true });
    if (error) { console.error('[DataAccessService] getTasks error:', error); throw error; }
    return data || [];
  }

  async createTask(taskData: Record<string, unknown>) {
    this.checkConsolidated();
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...taskData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createTask error:', error); throw error; }
    return data;
  }

  async updateTask(taskId: string, taskData: Record<string, unknown>) {
    type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
    const taskUpdates: TaskUpdate = {};
    if (taskData.title) taskUpdates.title = taskData.title as string;
    if (taskData.description) taskUpdates.description = taskData.description as string;
    if (taskData.status_id) taskUpdates.status_id = taskData.status_id as string;
    if (taskData.due_date) taskUpdates.due_date = taskData.due_date as string;
    if (taskData.assigned_to) taskUpdates.assigned_to = taskData.assigned_to as string;
    if (taskData.completed !== undefined) taskUpdates.completed = taskData.completed as boolean;

    let query = supabase
      .from('tasks')
      .update(taskUpdates)
      .eq('id', taskId);

    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateTask error:', error); throw error; }
    return data;
  }

  async deleteTask(taskId: string) {
    let query = supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    query = this.applyOrgFilter(query);

    const { error } = await query;
    if (error) { console.error('[DataAccessService] deleteTask error:', error); throw error; }
    return true;
  }

  // ── INTERACTIONS ───────────────────────────────────────
  async getInteractions(filters?: { leadId?: string }) {
    let query = supabase.from('interactions').select('*, leads(name)');
    query = this.applyOrgFilter(query);

    if (filters?.leadId) {
      query = query.eq('lead_id', filters.leadId);
    }

    const { data, error } = await query.order('interaction_date', { ascending: false });
    if (error) { console.error('[DataAccessService] getInteractions error:', error); throw error; }
    return data || [];
  }

  async createInteraction(interactionData: Record<string, unknown>) {
    this.checkConsolidated();
    const { data, error } = await supabase
      .from('interactions')
      .insert({ ...interactionData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createInteraction error:', error); throw error; }
    return data;
  }

  async deleteInteraction(interactionId: string) {
    let query = supabase
      .from('interactions')
      .delete()
      .eq('id', interactionId);
    
    query = this.applyOrgFilter(query);

    const { error } = await query;
    if (error) { console.error('[DataAccessService] deleteInteraction error:', error); throw error; }
    return true;
  }

  // ── PRODUCTS ───────────────────────────────────────────
  async getProducts() {
    let query = supabase.from('products').select('*, product_sales_stages(*)');
    query = this.applyOrgFilter(query);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) { console.error('[DataAccessService] getProducts error:', error); throw error; }
    return data || [];
  }

  async createProduct(productData: Record<string, unknown>) {
    this.checkConsolidated();
    const { data, error } = await supabase
      .from('products')
      .insert({ ...productData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createProduct error:', error); throw error; }
    return data;
  }

  async updateProduct(productId: string, productData: Record<string, unknown>) {
    type ProductUpdate = Database['public']['Tables']['products']['Update'];
    const productUpdates: ProductUpdate = {};
    if (productData.name) productUpdates.name = productData.name as string;
    if (productData.description) productUpdates.description = productData.description as string;
    if (productData.type) productUpdates.type = productData.type as string;
    if (productData.notes) productUpdates.notes = productData.notes as string;

    let query = supabase
      .from('products')
      .update(productUpdates)
      .eq('id', productId);

    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateProduct error:', error); throw error; }
    return data;
  }

  async deleteProduct(productId: string) {
    let query = supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    query = this.applyOrgFilter(query);

    const { error } = await query;
    if (error) { console.error('[DataAccessService] deleteProduct error:', error); throw error; }
    return true;
  }

  // ── PRODUCT SALES STAGES ──────────────────────────────
  async upsertProductStages(productId: string, stages: { id?: string; name: string; value: number; link?: string; sale_type?: 'unica' | 'mensalidade' }[]) {
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
      sale_type: s.sale_type || 'unica',
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
    let query = supabase.from('tags').select('*');
    query = this.applyOrgFilter(query);

    const { data, error } = await query.order('name');
    if (error) { console.error('[DataAccessService] getTags error:', error); throw error; }
    return data || [];
  }

  async createTag(tagData: Record<string, unknown>) {
    this.checkConsolidated();
    const { data, error } = await supabase
      .from('tags')
      .insert({ ...tagData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createTag error:', error); throw error; }
    return data;
  }

  async updateTag(tagId: string, tagData: Record<string, unknown>) {
    type TagUpdate = Database['public']['Tables']['tags']['Update'];
    const tagUpdates: TagUpdate = {};
    if (tagData.name) tagUpdates.name = tagData.name as string;
    if (tagData.color) tagUpdates.color = tagData.color as string;

    let query = supabase
      .from('tags')
      .update(tagUpdates)
      .eq('id', tagId);

    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateTag error:', error); throw error; }
    return data;
  }

  async deleteTag(tagId: string) {
    let query = supabase
      .from('tags')
      .delete()
      .eq('id', tagId);
    
    query = this.applyOrgFilter(query);

    const { error } = await query;
    if (error) { console.error('[DataAccessService] deleteTag error:', error); throw error; }
    return true;
  }

  // ── TASK STATUSES ───────────────────────────────────────
  async getTaskStatuses() {
    let query = supabase.from('task_statuses').select('*');
    query = this.applyOrgFilter(query);

    const { data, error } = await query.order('order_index');
    if (error) { console.error('[DataAccessService] getTaskStatuses error:', error); throw error; }
    return data || [];
  }

  async createTaskStatus(statusData: Record<string, unknown>) {
    this.checkConsolidated();
    const { data, error } = await supabase
      .from('task_statuses')
      .insert({ ...statusData, organization_id: this.orgId } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createTaskStatus error:', error); throw error; }
    return data;
  }

  async updateTaskStatus(statusId: string, statusData: Record<string, unknown>) {
    type TaskStatusUpdate = Database['public']['Tables']['task_statuses']['Update'];
    const statusUpdates: TaskStatusUpdate = {};
    if (statusData.name) statusUpdates.name = statusData.name as string;
    if (statusData.color) statusUpdates.color = statusData.color as string;
    if (statusData.order_index !== undefined) statusUpdates.order_index = statusData.order_index as number;

    let query = supabase
      .from('task_statuses')
      .update(statusUpdates)
      .eq('id', statusId);

    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateTaskStatus error:', error); throw error; }
    return data;
  }

  async deleteTaskStatus(statusId: string) {
    let query = supabase
      .from('task_statuses')
      .delete()
      .eq('id', statusId);
    
    query = this.applyOrgFilter(query);

    const { error } = await query;
    if (error) { console.error('[DataAccessService] deleteTaskStatus error:', error); throw error; }
    return true;
  }


  async getPipelineStages() {
    let query = supabase.from('pipeline_stages').select('*');
    query = this.applyOrgFilter(query);

    const { data, error } = await query.order('sort_order');
    if (error) { console.error('[DataAccessService] getPipelineStages error:', error); throw error; }
    return data || [];
  }

  async createPipelineStage(name: string, sortOrder: number) {
    this.checkConsolidated();
    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert({ name, sort_order: sortOrder, organization_id: this.orgId, active: true } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createPipelineStage error:', error); throw error; }
    return data;
  }

  async updatePipelineStage(id: string, updates: { name?: string; sort_order?: number; active?: boolean }) {
    let query = supabase
      .from('pipeline_stages')
      .update(updates)
      .eq('id', id);
    
    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updatePipelineStage error:', error); throw error; }
    return data;
  }

  async deletePipelineStage(id: string) {
    let query = supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', id);
    
    query = this.applyOrgFilter(query);

    const { error } = await query;
    if (error) { console.error('[DataAccessService] deletePipelineStage error:', error); throw error; }
    return true;
  }

  async reorderPipelineStages(stages: Array<{ id: string; sort_order: number }>) {
    const promises = stages.map(s =>
      this.applyOrgFilter(
        supabase
          .from('pipeline_stages')
          .update({ sort_order: s.sort_order })
          .eq('id', s.id)
      )
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
    let query = supabase.from('interest_levels').select('*');
    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) { console.error('[DataAccessService] getInterestLevels error:', error); throw error; }
    return data || [];
  }

  async getLeadOrigins() {
    let query = supabase.from('lead_origins').select('*');
    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) { console.error('[DataAccessService] getLeadOrigins error:', error); throw error; }
    return data || [];
  }

  async createLeadOrigin(name: string, sortOrder: number) {
    this.checkConsolidated();
    const { data, error } = await supabase
      .from('lead_origins')
      .insert({ name, sort_order: sortOrder, organization_id: this.orgId, active: true } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createLeadOrigin error:', error); throw error; }
    return data;
  }

  async updateLeadOrigin(id: string, updates: { name?: string; sort_order?: number; active?: boolean }) {
    let query = supabase
      .from('lead_origins')
      .update(updates)
      .eq('id', id);
    
    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateLeadOrigin error:', error); throw error; }
    return data;
  }

  async deleteLeadOrigin(id: string) {
    let query = supabase
      .from('lead_origins')
      .delete()
      .eq('id', id);
    
    query = this.applyOrgFilter(query);

    const { error } = await query;
    if (error) { console.error('[DataAccessService] deleteLeadOrigin error:', error); throw error; }
    return true;
  }

  async reorderLeadOrigins(origins: Array<{ id: string; sort_order: number }>) {
    const promises = origins.map(o =>
      this.applyOrgFilter(
        supabase
          .from('lead_origins')
          .update({ sort_order: o.sort_order })
          .eq('id', o.id)
      )
    );
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0].error;
  }

  // ── INTEREST LEVELS CRUD ──────────────────────────────────
  async createInterestLevel(value: string, label: string, sortOrder: number) {
    this.checkConsolidated();
    const { data, error } = await supabase
      .from('interest_levels')
      .insert({ value, label, sort_order: sortOrder, organization_id: this.orgId, active: true } as any)
      .select()
      .single();
    if (error) { console.error('[DataAccessService] createInterestLevel error:', error); throw error; }
    return data;
  }

  async updateInterestLevel(id: string, updates: { value?: string; label?: string; sort_order?: number; active?: boolean }) {
    let query = supabase
      .from('interest_levels')
      .update(updates)
      .eq('id', id);
    
    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .select()
      .single();
    if (error) { console.error('[DataAccessService] updateInterestLevel error:', error); throw error; }
    return data;
  }

  async deleteInterestLevel(id: string) {
    let query = supabase
      .from('interest_levels')
      .delete()
      .eq('id', id);
    
    query = this.applyOrgFilter(query);

    const { error } = await query;
    if (error) { console.error('[DataAccessService] deleteInterestLevel error:', error); throw error; }
    return true;
  }

  async reorderInterestLevels(levels: Array<{ id: string; sort_order: number }>) {
    const promises = levels.map(l =>
      this.applyOrgFilter(
        supabase
          .from('interest_levels')
          .update({ sort_order: l.sort_order })
          .eq('id', l.id)
      )
    );
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) throw errors[0].error;
  }

  async getPaymentMethods() {
    let query = supabase.from('payment_methods').select('*');
    query = this.applyOrgFilter(query);

    const { data, error } = await query
      .eq('active', true)
      .order('name');
    if (error) { console.error('[DataAccessService] getPaymentMethods error:', error); throw error; }
    return data || [];
  }

  async getOrgMembers() {
    let query = supabase.from('organization_members').select('id, user_id, organization_id, role, created_at');
    query = this.applyOrgFilter(query);

    const { data: members, error } = await query;
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
    let query = supabase.from('role_permissions').select('*');
    query = this.applyOrgFilter(query);

    const { data, error } = await query;
    if (error) { console.error('[DataAccessService] getRolePermissions error:', error); throw error; }
    return data || [];
  }

  // ── CRM FIELD ORDER ──────────────────────────────────────
  async getCRMFieldOrder() {
    let query = supabase.from('crm_field_order').select('field_name, sort_order');
    query = this.applyOrgFilter(query);

    const { data, error } = await query.order('sort_order', { ascending: true });
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
