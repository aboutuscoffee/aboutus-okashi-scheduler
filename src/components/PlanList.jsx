import { formatMinutesToTime, parseTimeToMinutes, schedule } from '../lib/schedule.js';

function summarizeDay(day) {
  if (!day) return null;
  const valid = (day.desserts || []).filter((d) => d.processes.length > 0 && (d.startFrom || 0) < d.processes.length);
  if (valid.length === 0) return null;
  try {
    const startMinutes = parseTimeToMinutes(day.startTime || '09:00');
    const scheduled = schedule(startMinutes, valid);
    if (scheduled.length === 0) return null;
    const end = Math.max(...scheduled.map((s) => s.end));
    return { count: valid.length, finish: formatMinutesToTime(end) };
  } catch {
    return null;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
}

export default function PlanList({ plans, error, onOpen, onCreate, onDelete }) {
  return (
    <div className="app">
      <header>
        <p className="eyebrow">菓子工房 工程管理板</p>
        <h1>仕込みTodo表</h1>
        <p>手が空くタイミングとオーブンの空き時間を計算して、複数のお菓子を無理なく同時進行するための工程表を組み立てます。仕込み日ごとにプランを保存して、あとから見返せます。</p>
      </header>

      {error && <div className="error-state" style={{ padding: '14px 18px', textAlign: 'left' }}>プラン一覧の読み込みに失敗しました: {error}</div>}

      <div className="plan-list-header">
        <div className="section-title" style={{ marginBottom: 0 }}>
          仕込みプラン一覧
        </div>
        <button className="btn btn-primary" style={{ flex: 'none' }} onClick={onCreate}>
          ＋ 新しい仕込みプラン
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="plan-empty">まだ仕込みプランがありません。「＋ 新しい仕込みプラン」から作成してください。</div>
      ) : (
        <div className="plan-cards">
          {plans.map((plan) => {
            const day1 = summarizeDay(plan.data?.day1);
            const day2 = summarizeDay(plan.data?.day2);
            const dateLabel = formatDate(plan.plan_date);
            return (
              <div className="plan-card" key={plan.id} onClick={() => onOpen(plan)}>
                <div>
                  <p className="plan-card-title">{plan.title || '(無題の仕込みプラン)'}</p>
                  <div className="plan-card-meta">
                    {dateLabel && <span>{dateLabel}</span>}
                    {day1 && <span>1日目: {day1.count}品 / 完成 {day1.finish}</span>}
                    {day2 && <span>2日目: {day2.count}品 / 完成 {day2.finish}</span>}
                    {!day1 && !day2 && <span>まだ工程が未入力です</span>}
                  </div>
                </div>
                <div className="plan-card-actions">
                  <button
                    className="plan-card-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('この仕込みプランを削除しますか？')) onDelete(plan.id);
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
