import { supabase } from './supabase.js';
import { makeDessert, makeProcess } from './schedule.js';

const TABLE = 'dessert_templates';

export async function fetchTemplates() {
  const { data, error } = await supabase.from(TABLE).select('*').order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export function interpolateDuration(points, quantity) {
  if (!points || points.length === 0) return 15;
  const sorted = [...points].sort((a, b) => a.quantity - b.quantity);
  if (quantity <= sorted[0].quantity) return sorted[0].duration;
  const last = sorted[sorted.length - 1];
  if (quantity >= last.quantity) return last.duration;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (quantity >= a.quantity && quantity <= b.quantity) {
      if (b.quantity === a.quantity) return a.duration;
      const t = (quantity - a.quantity) / (b.quantity - a.quantity);
      return Math.round(a.duration + t * (b.duration - a.duration));
    }
  }
  return last.duration;
}

export function applyTemplate(template, quantity, colorIndex) {
  const processes = template.processes.map((p) =>
    makeProcess(p.name, interpolateDuration(p.points, quantity), p.resource)
  );
  return makeDessert(template.name, colorIndex, processes, 0, quantity);
}

export async function saveDessertAsTemplate(dessert, quantity) {
  const { data: existing, error: fetchErr } = await supabase
    .from(TABLE)
    .select('*')
    .eq('name', dessert.name)
    .maybeSingle();
  if (fetchErr) throw fetchErr;

  const incoming = dessert.processes.map((p) => ({ name: p.name, resource: p.resource, duration: p.duration }));

  let mergedProcesses;
  if (existing) {
    mergedProcesses = existing.processes.map((tp) => ({ ...tp, points: [...tp.points] }));
    incoming.forEach((ip) => {
      let tp = mergedProcesses.find((x) => x.name === ip.name);
      if (!tp) {
        tp = { name: ip.name, resource: ip.resource, points: [] };
        mergedProcesses.push(tp);
      }
      tp.resource = ip.resource;
      const pointIdx = tp.points.findIndex((pt) => pt.quantity === quantity);
      if (pointIdx >= 0) tp.points[pointIdx] = { quantity, duration: ip.duration };
      else tp.points.push({ quantity, duration: ip.duration });
    });
  } else {
    mergedProcesses = incoming.map((ip) => ({
      name: ip.name,
      resource: ip.resource,
      points: [{ quantity, duration: ip.duration }],
    }));
  }

  const payload = { name: dessert.name, processes: mergedProcesses, updated_at: new Date().toISOString() };
  if (existing) {
    const { data, error } = await supabase.from(TABLE).update(payload).eq('id', existing.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw error;
  return data;
}
