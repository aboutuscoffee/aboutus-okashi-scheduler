import { RESOURCE_META, makeProcess } from '../lib/schedule.js';

export default function DessertCard({ dessert, onChange, onRemove, onSaveAsTemplate }) {
  function setName(name) {
    onChange({ ...dessert, name });
  }

  function setQuantity(quantity) {
    onChange({ ...dessert, quantity });
  }

  function setStartFrom(idx) {
    onChange({ ...dessert, startFrom: idx });
  }

  function addProcess() {
    onChange({ ...dessert, processes: [...dessert.processes, makeProcess('', 15, 'hand')] });
  }

  function removeProcess(pid) {
    const processes = dessert.processes.filter((p) => p.id !== pid);
    const startFrom = (dessert.startFrom || 0) >= processes.length
      ? Math.max(0, processes.length - 1)
      : dessert.startFrom || 0;
    onChange({ ...dessert, processes, startFrom });
  }

  function updateProcess(pid, field, value) {
    const processes = dessert.processes.map((p) => (p.id === pid ? { ...p, [field]: value } : p));
    onChange({ ...dessert, processes });
  }

  return (
    <div className="dessert-card" style={{ '--dcolor': dessert.color }}>
      <div className="dessert-card-head">
        <span className="dessert-dot" />
        <input
          className="dessert-name-input"
          type="text"
          value={dessert.name}
          placeholder="お菓子の名前"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="dessert-quantity-input"
          type="number"
          min="0"
          step="1"
          value={dessert.quantity || ''}
          placeholder="個数"
          onChange={(e) => setQuantity(e.target.value ? Math.max(0, Number(e.target.value) || 0) : null)}
        />
        <button className="save-template-btn" onClick={onSaveAsTemplate}>
          テンプレートとして保存
        </button>
        <button className="remove-dessert-btn" onClick={onRemove}>
          このお菓子を削除
        </button>
      </div>

      <div className="start-from-row">
        <label>開始工程</label>
        <select value={dessert.startFrom || 0} onChange={(e) => setStartFrom(Number(e.target.value) || 0)}>
          {dessert.processes.length === 0 ? (
            <option value="0">工程なし</option>
          ) : (
            dessert.processes.map((p, i) => (
              <option key={p.id} value={i}>
                {i + 1}. {p.name || '(工程名未設定)'}
              </option>
            ))
          )}
        </select>
        <span className="start-from-hint">前の工程は前日までに完了済みとして扱う</span>
      </div>

      <div className="process-rows">
        {dessert.processes.map((p) => (
          <div className="process-row" key={p.id}>
            <input
              type="text"
              value={p.name}
              placeholder="工程名(例: 生地作り)"
              onChange={(e) => updateProcess(p.id, 'name', e.target.value)}
            />
            <div>
              <input
                type="number"
                min="0"
                step="5"
                value={p.duration}
                onChange={(e) => updateProcess(p.id, 'duration', Math.max(0, Number(e.target.value) || 0))}
              />
              <span className="unit">分</span>
            </div>
            <select value={p.resource} onChange={(e) => updateProcess(p.id, 'resource', e.target.value)}>
              {Object.keys(RESOURCE_META).map((key) => (
                <option key={key} value={key}>
                  {RESOURCE_META[key].icon} {RESOURCE_META[key].label}
                </option>
              ))}
            </select>
            <button className="remove-proc-btn" title="この工程を削除" onClick={() => removeProcess(p.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button className="add-proc-btn" onClick={addProcess}>
        ＋ 工程を追加
      </button>
    </div>
  );
}
