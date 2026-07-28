import { useRef, useState } from 'react';
import DayPanel from './DayPanel.jsx';

function snapshotOf(title, planDate, data) {
  return JSON.stringify({ title, plan_date: planDate, data });
}

export default function PlanEditor({ plan, onBack, onSave, onDelete }) {
  const [id, setId] = useState(plan.id);
  const [title, setTitle] = useState(plan.title || '');
  const [planDate, setPlanDate] = useState(plan.plan_date || '');
  const [data, setData] = useState(plan.data);
  const [activeDay, setActiveDay] = useState('1');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedAt, setSavedAt] = useState(plan.updated_at || null);
  const [saveError, setSaveError] = useState(null);

  const lastSavedRef = useRef(snapshotOf(plan.title || '', plan.plan_date || '', plan.data));
  const dirty = snapshotOf(title, planDate, data) !== lastSavedRef.current;

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await onSave({ id, title, plan_date: planDate || null, data });
      setId(saved.id);
      setSavedAt(saved.updated_at);
      lastSavedRef.current = snapshotOf(title, planDate, data);
    } catch (e) {
      setSaveError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm('この仕込みプランを削除しますか？')) return;
    setDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="app">
      <header>
        <p className="eyebrow">菓子工房 工程管理板</p>
        <h1>お菓子作りスケジューラー</h1>
        <p>手が空くタイミングとオーブンの空き時間を計算して、複数のお菓子を無理なく同時進行するための工程表を組み立てます。1日目・2日目をタブで切り替えて、2日がかりの作り置きにも対応できます。</p>
      </header>

      <div className="editor-header">
        <div className="editor-header-row">
          <button className="back-link" onClick={onBack}>
            ← 一覧へ戻る
          </button>
        </div>
        <div className="editor-header-row">
          <input
            className="editor-title-input"
            type="text"
            value={title}
            placeholder="仕込みプラン名(例: 7/28の仕込み)"
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="editor-date-input"
            type="date"
            value={planDate}
            onChange={(e) => setPlanDate(e.target.value)}
          />
          <span className={`editor-save-state${dirty ? ' dirty' : ''}`}>
            {dirty ? '未保存の変更があります' : savedAt ? `保存済み (${new Date(savedAt).toLocaleString('ja-JP')})` : '未保存'}
          </span>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty} style={{ flex: 'none' }}>
            {saving ? '保存中...' : '保存'}
          </button>
          {id && (
            <button className="delete-link" onClick={handleDelete} disabled={deleting}>
              {deleting ? '削除中...' : 'このプランを削除'}
            </button>
          )}
        </div>
        {saveError && <div className="error-state" style={{ padding: '8px 0 0', textAlign: 'left' }}>保存に失敗しました: {saveError}</div>}
      </div>

      <div className="day-tabs">
        <button className={`day-tab${activeDay === '1' ? ' active' : ''}`} onClick={() => setActiveDay('1')}>
          1日目
        </button>
        <button className={`day-tab${activeDay === '2' ? ' active' : ''}`} onClick={() => setActiveDay('2')}>
          2日目
        </button>
      </div>

      <div style={{ display: activeDay === '1' ? '' : 'none' }}>
        <DayPanel dayLabel="1日目" value={data.day1} onChange={(day1) => setData((d) => ({ ...d, day1 }))} />
      </div>
      <div style={{ display: activeDay === '2' ? '' : 'none' }}>
        <DayPanel dayLabel="2日目" value={data.day2} onChange={(day2) => setData((d) => ({ ...d, day2 }))} />
      </div>
    </div>
  );
}
