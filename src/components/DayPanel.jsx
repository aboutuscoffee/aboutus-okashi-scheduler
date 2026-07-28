import { useEffect, useState } from 'react';
import { makeDessert, makeProcess, parseTimeToMinutes, schedule } from '../lib/schedule.js';
import { applyTemplate, saveDessertAsTemplate } from '../lib/templates.js';
import DessertCard from './DessertCard.jsx';
import Timeline from './Timeline.jsx';

export default function DayPanel({ value, onChange, dayLabel, templates, onTemplatesChanged }) {
  const { startTime, desserts } = value;
  const [results, setResults] = useState(null);
  const [templateSelectValue, setTemplateSelectValue] = useState('');

  function calcNow() {
    const validDesserts = desserts.filter((d) => d.processes.length > 0 && (d.startFrom || 0) < d.processes.length);
    if (validDesserts.length === 0) {
      setResults({ empty: true, message: 'お菓子と工程を1つ以上追加してから計算してください。' });
      return;
    }
    const startMinutes = parseTimeToMinutes(startTime || '09:00');
    const scheduled = schedule(startMinutes, validDesserts);
    if (scheduled.length === 0) {
      setResults({ empty: true, message: '工程が空です。各お菓子に工程を入力してください。' });
      return;
    }
    setResults({ scheduled, startMinutes, validDesserts });
  }

  // 読み込み時に一度だけ自動計算する（ベースHTMLの初期表示と同じ挙動）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { calcNow(); }, []);

  function setStartTime(t) {
    onChange({ ...value, startTime: t });
  }

  function addDessert() {
    onChange({
      ...value,
      desserts: [...desserts, makeDessert('新しいお菓子', desserts.length, [makeProcess('生地作り', 15, 'hand')])],
    });
  }

  function updateDessert(id, next) {
    onChange({ ...value, desserts: desserts.map((d) => (d.id === id ? next : d)) });
  }

  function removeDessert(id) {
    onChange({ ...value, desserts: desserts.filter((d) => d.id !== id) });
  }

  function handlePickTemplate(templateId) {
    setTemplateSelectValue('');
    if (!templateId) return;
    const template = templates.find((t) => String(t.id) === templateId);
    if (!template) return;
    const input = window.prompt(`「${template.name}」を何個分作りますか？`, '');
    const quantity = Number(input);
    if (!input || !Number.isFinite(quantity) || quantity <= 0) return;
    onChange({ ...value, desserts: [...desserts, applyTemplate(template, quantity, desserts.length)] });
  }

  async function handleSaveAsTemplate(dessert) {
    let quantity = dessert.quantity;
    if (!quantity) {
      const input = window.prompt('この工程表は何個分の分量ですか？', '');
      quantity = Number(input);
      if (!input || !Number.isFinite(quantity) || quantity <= 0) return;
    }
    try {
      await saveDessertAsTemplate(dessert, quantity);
      if (!dessert.quantity) {
        updateDessert(dessert.id, { ...dessert, quantity });
      }
      await onTemplatesChanged();
      window.alert(`テンプレート「${dessert.name}」を保存しました(${quantity}個)`);
    } catch (e) {
      window.alert(`テンプレートの保存に失敗しました: ${e.message || e}`);
    }
  }

  return (
    <div className="day-panel">
      <section>
        <div className="section-title">
          開始時刻<span className="sub">この時間から工程がスタートします</span>
        </div>
        <div className="start-row">
          <label>スタート</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
      </section>
      <section>
        <div className="section-title">
          作るお菓子と工程<span className="sub">工程は追加した順に進みます</span>
        </div>
        <div className="dessert-list">
          {desserts.map((d) => (
            <DessertCard
              key={d.id}
              dessert={d}
              onChange={(next) => updateDessert(d.id, next)}
              onRemove={() => removeDessert(d.id)}
              onSaveAsTemplate={() => handleSaveAsTemplate(d)}
            />
          ))}
        </div>
        <div className="controls-actions">
          <button className="btn btn-ghost" onClick={addDessert}>
            ＋ お菓子を追加
          </button>
          <select
            className="template-select"
            value={templateSelectValue}
            onChange={(e) => handlePickTemplate(e.target.value)}
          >
            <option value="">テンプレートから追加...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={calcNow}>
            {dayLabel}の内容でスケジュールを計算
          </button>
        </div>
      </section>
      <section>
        <div className="section-title">
          タイムスケジュール<span className="sub">手・オーブンの占有状況と、各お菓子の工程</span>
        </div>
        {!results ? null : results.empty ? (
          <div className="empty-state">{results.message}</div>
        ) : (
          <Timeline scheduled={results.scheduled} startMinutes={results.startMinutes} validDesserts={results.validDesserts} />
        )}
      </section>
    </div>
  );
}
