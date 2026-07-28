import { supabase } from './supabase.js';

const TABLE = 'bake_plans';

export async function fetchPlans() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('plan_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertPlan(plan) {
  const payload = {
    title: plan.title || '',
    plan_date: plan.plan_date || null,
    data: plan.data,
    updated_at: new Date().toISOString(),
  };
  if (plan.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', plan.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deletePlan(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
