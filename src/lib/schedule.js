// お菓子作りスケジューラーのベースHTML（okashi-scheduler.html）から
// スケジューリングアルゴリズムと時間ヘルパーをそのまま移植したもの。ロジックは無改変。

export const RESOURCE_META = {
  hand: { label: '手作業', color: 'var(--hand)', solid: '#C1453D', icon: '🖐️' },
  oven: { label: 'オーブン', color: 'var(--oven)', solid: '#E0A23B', icon: '🔥' },
  rest: { label: '放置(発酵・冷却)', color: 'var(--rest)', solid: '#6F9483', icon: '⏳' },
};

export const DESSERT_COLORS = [
  '#5B7FA6', '#8C6FB0', '#4B9C93', '#B06B8F',
  '#8A9A5B', '#A66B4B', '#6E7FBF', '#B08A4B',
];

export function nextId(prefix) {
  const rand = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}_${rand}`;
}

export function makeProcess(name, duration, resource) {
  return { id: nextId('p'), name, duration, resource };
}

export function makeDessert(name, colorIndex, processes, startFrom, quantity) {
  return {
    id: nextId('d'),
    name,
    color: DESSERT_COLORS[colorIndex % DESSERT_COLORS.length],
    processes,
    startFrom: startFrom || 0,
    quantity: quantity || null,
  };
}

export function parseTimeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatMinutesToTime(mins) {
  const total = Math.round(mins);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export function formatDurationLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h <= 0) return m + '分';
  if (m <= 0) return h + '時間';
  return h + '時間' + m + '分';
}

export function schedule(startMinutes, desserts) {
  const items = desserts
    .map((d, idx) => ({
      id: d.id,
      name: d.name || '(名称未設定)',
      color: d.color,
      priority: idx,
      steps: d.processes.slice(Math.min(d.startFrom || 0, d.processes.length)),
      stepIndex: 0,
      availableAt: startMinutes,
    }))
    .filter((it) => it.steps.length > 0);

  let handFreeAt = startMinutes;
  let ovenFreeAt = startMinutes;
  const scheduled = [];

  function isDone(item) {
    return item.stepIndex >= item.steps.length;
  }

  function cascadeRest(item) {
    while (!isDone(item)) {
      const step = item.steps[item.stepIndex];
      if (step.resource !== 'rest') break;
      const start = item.availableAt;
      const end = start + Math.max(0, Number(step.duration) || 0);
      scheduled.push({
        dessertId: item.id,
        name: item.name,
        color: item.color,
        resource: 'rest',
        stepName: step.name || '(工程名未設定)',
        start,
        end,
      });
      item.availableAt = end;
      item.stepIndex += 1;
    }
  }

  items.forEach(cascadeRest);

  function remaining() {
    return items.some((it) => !isDone(it));
  }

  let safety = 0;
  while (remaining() && safety < 5000) {
    safety += 1;
    let bestHand = null;
    let bestOven = null;

    items.forEach((item) => {
      if (isDone(item)) return;
      const step = item.steps[item.stepIndex];
      if (step.resource === 'hand') {
        const start = Math.max(item.availableAt, handFreeAt);
        if (!bestHand || start < bestHand.start || (start === bestHand.start && item.priority < bestHand.item.priority)) {
          bestHand = { item, step, start };
        }
      } else if (step.resource === 'oven') {
        const start = Math.max(item.availableAt, ovenFreeAt);
        if (!bestOven || start < bestOven.start || (start === bestOven.start && item.priority < bestOven.item.priority)) {
          bestOven = { item, step, start };
        }
      }
    });

    if (!bestHand && !bestOven) break;

    let choice;
    if (bestHand && bestOven) {
      if (bestHand.start < bestOven.start) choice = 'hand';
      else if (bestOven.start < bestHand.start) choice = 'oven';
      else choice = bestHand.item.priority <= bestOven.item.priority ? 'hand' : 'oven';
    } else {
      choice = bestHand ? 'hand' : 'oven';
    }

    const picked = choice === 'hand' ? bestHand : bestOven;
    const { item, step, start } = picked;
    const end = start + Math.max(0, Number(step.duration) || 0);
    scheduled.push({
      dessertId: item.id,
      name: item.name,
      color: item.color,
      resource: step.resource,
      stepName: step.name || '(工程名未設定)',
      start,
      end,
    });
    if (choice === 'hand') handFreeAt = end;
    else ovenFreeAt = end;
    item.availableAt = end;
    item.stepIndex += 1;
    cascadeRest(item);
  }

  return scheduled;
}
