import { useEffect, useState } from 'react';
import { makeDessert, makeProcess, parseTimeToMinutes, schedule } from '../lib/schedule.js';
import DessertCard from './DessertCard.jsx';
import Timeline from './Timeline.jsx';

export default function DayPanel({ value, onChange, dayLabel }) {
  const { startTime, desserts } = value;
  const [results, setResults] = useState(null);

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
            />
          ))}
        </div>
        <div className="controls-actions">
          <button className="btn btn-ghost" onClick={addDessert}>
            ＋ お菓子を追加
          </button>
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
