import { useState } from 'react';
import { RESOURCE_META, formatMinutesToTime, formatDurationLabel } from '../lib/schedule.js';

export default function Timeline({ scheduled, startMinutes, validDesserts }) {
  const [logOpen, setLogOpen] = useState(false);

  const endMinutes = Math.max(...scheduled.map((s) => s.end));
  const span = Math.max(30, endMinutes - startMinutes);

  const pxPerMin = span > 8 * 60 ? 2.6 : 4.2;
  const boardWidth = span * pxPerMin;
  const tickStep = span > 6 * 60 ? 60 : 30;

  const ticks = [];
  for (let t = 0; t <= span; t += tickStep) {
    ticks.push(t);
  }

  function blocksFor(resourceKey) {
    return scheduled.filter((s) => s.resource === resourceKey);
  }

  const sortedLog = [...scheduled].sort((a, b) => a.start - b.start);

  return (
    <>
      <div className="finish-readout">
        <span className="label">すべて完成</span>
        <span className="time">{formatMinutesToTime(endMinutes)}</span>
        <span className="span">
          所要時間 {formatDurationLabel(endMinutes - startMinutes)}(開始 {formatMinutesToTime(startMinutes)})
        </span>
      </div>

      <div className="board-scroll">
        <div className="board-inner">
          <div className="ruler" style={{ width: boardWidth }}>
            {ticks.map((t) => (
              <div className="tick" key={t} style={{ left: t * pxPerMin }}>
                {formatMinutesToTime(startMinutes + t)}
              </div>
            ))}
          </div>

          <div className="track-row">
            <div className="track-label">🖐️ 手作業</div>
            <div className="track-lane" style={{ width: boardWidth }}>
              {blocksFor('hand').map((s, i) => (
                <div
                  key={i}
                  className="block"
                  style={{
                    left: (s.start - startMinutes) * pxPerMin,
                    width: Math.max(2, (s.end - s.start) * pxPerMin),
                    background: s.color,
                  }}
                  title={`${s.name}: ${s.stepName}(${formatMinutesToTime(s.start)}–${formatMinutesToTime(s.end)})`}
                >
                  {s.name}
                </div>
              ))}
            </div>
          </div>
          <div className="track-row">
            <div className="track-label">🔥 オーブン</div>
            <div className="track-lane" style={{ width: boardWidth }}>
              {blocksFor('oven').map((s, i) => (
                <div
                  key={i}
                  className="block"
                  style={{
                    left: (s.start - startMinutes) * pxPerMin,
                    width: Math.max(2, (s.end - s.start) * pxPerMin),
                    background: s.color,
                  }}
                  title={`${s.name}: ${s.stepName}(${formatMinutesToTime(s.start)}–${formatMinutesToTime(s.end)})`}
                >
                  {s.name}
                </div>
              ))}
            </div>
          </div>

          <div className="divider-label">お菓子ごとの工程</div>
          {validDesserts.map((d) => {
            const steps = scheduled.filter((s) => s.dessertId === d.id);
            const lastEnd = steps.length ? Math.max(...steps.map((s) => s.end)) : startMinutes;
            return (
              <div key={d.id}>
                <div className="dessert-row">
                  <div className="dessert-row-label">
                    <span className="dot" style={{ background: d.color }} />
                    {d.name || '(名称未設定)'}
                  </div>
                  <div className="dessert-row-lane" style={{ width: boardWidth }}>
                    {steps.map((s, i) => {
                      const meta = RESOURCE_META[s.resource];
                      const label = `${s.stepName} (${formatDurationLabel(s.end - s.start)})`;
                      return (
                        <div
                          key={i}
                          className="step-block"
                          style={{
                            left: (s.start - startMinutes) * pxPerMin,
                            width: Math.max(2, (s.end - s.start) * pxPerMin),
                            background: meta.solid,
                          }}
                          title={`${meta.icon} ${meta.label}: ${s.stepName} ${formatMinutesToTime(s.start)}–${formatMinutesToTime(s.end)}`}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ paddingLeft: 132, fontSize: 11, color: 'var(--ink-faint)', margin: '-2px 0 8px' }}>
                  完成: {formatMinutesToTime(lastEnd)}
                </div>
              </div>
            );
          })}

          <div className="legend">
            <span>
              <span className="swatch" style={{ background: RESOURCE_META.hand.solid }} />手作業
            </span>
            <span>
              <span className="swatch" style={{ background: RESOURCE_META.oven.solid }} />オーブン
            </span>
            <span>
              <span className="swatch" style={{ background: RESOURCE_META.rest.solid }} />放置(発酵・冷却)
            </span>
          </div>

          <button className="log-toggle" onClick={() => setLogOpen((o) => !o)}>
            {logOpen ? '▾ 時系列リストを隠す' : '▸ 時系列リストを表示'}
          </button>
          <ul className={`log-list${logOpen ? ' open' : ''}`}>
            {sortedLog.map((s, i) => {
              const meta = RESOURCE_META[s.resource];
              return (
                <li key={i}>
                  {formatMinutesToTime(s.start)}–{formatMinutesToTime(s.end)}{' '}
                  <span className="tag">
                    {meta.icon}
                    {meta.label}
                  </span>{' '}
                  {s.name}: {s.stepName}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
