import { useCallback, useEffect, useState } from 'react';
import { deletePlan, fetchPlans, upsertPlan } from './lib/db.js';
import PlanList from './components/PlanList.jsx';
import PlanEditor from './components/PlanEditor.jsx';

function emptyPlan() {
  return {
    id: null,
    title: '',
    plan_date: new Date().toISOString().slice(0, 10),
    data: {
      day1: { startTime: '09:00', desserts: [] },
      day2: { startTime: '09:00', desserts: [] },
    },
  };
}

export default function App() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePlan, setActivePlan] = useState(null);

  const reload = useCallback(async () => {
    try {
      const data = await fetchPlans();
      setPlans(data);
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleSave(payload) {
    const saved = await upsertPlan(payload);
    reload();
    return saved;
  }

  async function handleDelete(id) {
    await deletePlan(id);
    await reload();
    setActivePlan(null);
  }

  if (loading) {
    return (
      <div className="app">
        <p className="loading-state">読み込み中...</p>
      </div>
    );
  }

  if (activePlan) {
    return (
      <PlanEditor
        plan={activePlan}
        onBack={() => setActivePlan(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <PlanList
      plans={plans}
      error={error}
      onOpen={(plan) => setActivePlan(plan)}
      onCreate={() => setActivePlan(emptyPlan())}
      onDelete={handleDelete}
    />
  );
}
