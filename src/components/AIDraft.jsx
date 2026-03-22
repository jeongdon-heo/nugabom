import { useState } from 'react';
import { DOMAIN_COLORS, fmtDate, checkProhibited, todayStr } from '../constants';
import { Toast, ObsCard, Btn } from './UI';
import { callGemini } from '../gemini';

export default function AIDraft({ students, observations, grade, apiKey }) {
  const [mode, setMode] = useState('single');
  const [sel, setSel] = useState(null);
  const [gen, setGen] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [ek, setEk] = useState(null);
  const [opts, setOpts] = useState({ length: '보통', tone: '객관적' });
  const [items, setItems] = useState({ 창체: true, 교과: true, 행동특성: true });
  const [warns, setWarns] = useState({});
  const [toast, setToast] = useState(null);
  const [batchResults, setBatchResults] = useState({});
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, name: '' });
  const [batchRunning, setBatchRunning] = useState(false);

  const sObs = sel ? observations.filter(o => o.studentId === sel.id).sort((a, b) => a.date.localeCompare(b.date)) : [];

  const buildPrompt = (studentObs, type) => {
    const rel = studentObs.filter(o => o.domain === type || !o.domain);
    const ot = rel.map(o => `- ${fmtDate(o.date)}${o.category ? ` [${o.category}]` : ''}${o.stdCode ? ` {${o.stdCode}}` : ''}: ${o.memo}`).join('\n');
    const g = { '창체': '창의적 체험활동상황 특기사항. 영역별 구분. 1~3문장.', '교과': '교과학습발달상황 세부능력 및 특기사항. 교과별 구분. 성취기준 기반. 2~4문장.', '행동특성': '행동특성 및 종합의견. 종합 서술. 5~10문장.' }[type];
    return `초등${grade}학년 생활기록부 작성 보조.\n\n${g}\n\n[주의] 학교명·사교육 기재금지. 과장지양.\n[분량] ${opts.length}\n[어조] ${opts.tone}\n\n[누가기록]\n${ot || '(없음)'}\n\n초안만 작성.`;
  };

  const callAPI = async (prompt) => {
    const txt = await callGemini(prompt, apiKey);
    return txt || '생성 실패';
  };

  const generate = async () => {
    if (!sel || sObs.length === 0) return;
    setGen(true); setDrafts({}); setWarns({});
    const types = Object.entries(items).filter(([, v]) => v).map(([k]) => k);
    const nd = {}, nw = {};
    for (const t of types) {
      try { const txt = await callAPI(buildPrompt(sObs, t)); nd[t] = { generated: txt, edited: txt }; const pc = checkProhibited(txt); if (pc.length) nw[t] = pc; }
      catch { nd[t] = { generated: 'API 오류', edited: '' }; }
    }
    setDrafts(nd); setWarns(nw); setGen(false);
  };

  const generateBatch = async () => {
    const eligible = students.filter(s => observations.filter(o => o.studentId === s.id).length > 0);
    if (!eligible.length) return;
    setBatchRunning(true); setBatchResults({});
    const types = Object.entries(items).filter(([, v]) => v).map(([k]) => k);
    for (let i = 0; i < eligible.length; i++) {
      const s = eligible[i];
      setBatchProgress({ current: i + 1, total: eligible.length, name: s.name });
      const so = observations.filter(o => o.studentId === s.id).sort((a, b) => a.date.localeCompare(b.date));
      const sd = {};
      for (const t of types) { try { sd[t] = { generated: await callAPI(buildPrompt(so, t)), edited: '' }; sd[t].edited = sd[t].generated; } catch { sd[t] = { generated: 'API 오류', edited: '' }; } }
      setBatchResults(p => ({ ...p, [s.id]: sd }));
    }
    setBatchRunning(false);
  };

  const copyAll = () => { navigator.clipboard?.writeText(Object.entries(drafts).map(([k, d]) => `[${k}]\n${d.edited || d.generated}`).join('\n\n')); setToast('복사 완료!'); setTimeout(() => setToast(null), 1200); };

  const exportBatchCSV = () => {
    const types = Object.entries(items).filter(([, v]) => v).map(([k]) => k);
    let csv = '\uFEFF번호,이름,' + types.join(',') + '\n';
    students.forEach(s => { const d = batchResults[s.id]; if (!d) return; const vals = types.map(t => `"${(d[t]?.edited || d[t]?.generated || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`); csv += `${s.number},"${s.name}",${vals.join(',')}\n`; });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `누가봄_AI초안_${todayStr()}.csv`; a.click();
    setToast('CSV 내보내기 완료!'); setTimeout(() => setToast(null), 1500);
  };

  const OptionBar = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 mb-3.5">
      <div className="flex gap-4 flex-wrap">
        <div>
          <div className="text-[10px] text-gray-400 mb-1">항목</div>
          <div className="flex gap-1">{['창체', '교과', '행동특성'].map(t => (
            <button key={t} onClick={() => setItems(p => ({ ...p, [t]: !p[t] }))}
              className={`text-[10px] px-2.5 py-1 rounded-md font-semibold cursor-pointer ${items[t] ? 'border-[1.5px] border-primary-500 bg-primary-50 text-primary-700' : 'border-[1.5px] border-gray-200 bg-white text-gray-400'}`}>{items[t] ? '✓ ' : ''}{t}</button>
          ))}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-1">분량</div>
          <div className="flex gap-1">{['간결', '보통', '상세'].map(l => (
            <button key={l} onClick={() => setOpts(p => ({ ...p, length: l }))}
              className={`text-[10px] px-2.5 py-1 rounded-md font-semibold cursor-pointer ${opts.length === l ? 'border-[1.5px] border-blue-600 bg-blue-50 text-blue-800' : 'border-[1.5px] border-gray-200 bg-white text-gray-400'}`}>{l}</button>
          ))}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-1">어조</div>
          <div className="flex gap-1">{['객관적', '따뜻한'].map(t => (
            <button key={t} onClick={() => setOpts(p => ({ ...p, tone: t }))}
              className={`text-[10px] px-2.5 py-1 rounded-md font-semibold cursor-pointer ${opts.tone === t ? 'border-[1.5px] border-purple-600 bg-purple-50 text-purple-800' : 'border-[1.5px] border-gray-200 bg-white text-gray-400'}`}>{t}</button>
          ))}</div>
        </div>
      </div>
    </div>
  );

  const DraftCard = ({ type, d }) => {
    const c = DOMAIN_COLORS[type]; const isEdit = ek === type; const w = warns[type];
    return (
      <div className="bg-white rounded-xl mb-3 overflow-hidden" style={{ border: `1.5px solid ${c?.border}` }}>
        <div className="px-3.5 py-2.5 flex justify-between items-center" style={{ background: c?.bg }}>
          <span className="text-xs font-bold" style={{ color: c?.text }}>{type}</span>
          <div className="flex gap-1">
            <button onClick={() => { navigator.clipboard?.writeText(d.edited || d.generated); setToast(`${type} 복사!`); setTimeout(() => setToast(null), 1200); }}
              className="text-[10px] px-2 py-0.5 rounded border bg-white cursor-pointer font-semibold" style={{ borderColor: c?.border, color: c?.text }}>복사</button>
            <button onClick={() => setEk(isEdit ? null : type)}
              className="text-[10px] px-2 py-0.5 rounded border cursor-pointer font-semibold" style={{ borderColor: c?.border, background: isEdit ? c?.text : '#fff', color: isEdit ? '#fff' : c?.text }}>{isEdit ? '완료' : '수정'}</button>
          </div>
        </div>
        {w?.length > 0 && <div className="px-3.5 py-1.5 bg-orange-50">{w.map((x, i) => <div key={i} className="text-[11px] text-orange-800 font-semibold">⚠️ {x}</div>)}</div>}
        <div className="p-3.5">
          {isEdit ? <textarea value={d.edited} onChange={e => { setDrafts(p => ({ ...p, [type]: { ...p[type], edited: e.target.value } })); const pc = checkProhibited(e.target.value); setWarns(p => ({ ...p, [type]: pc.length ? pc : undefined })); }}
            className="w-full min-h-[100px] rounded-lg border-[1.5px] border-gray-200 p-3 text-[13px] leading-relaxed outline-none resize-y font-sans" />
            : <p className="m-0 text-[13px] leading-loose text-gray-800 whitespace-pre-wrap">{d.edited || d.generated}</p>}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Toast msg={toast} />
      {/* Mode toggle */}
      <div className="flex gap-1.5 mb-3.5">
        {[['single', '👤 개별 생성'], ['batch', '👥 일괄 생성']].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)}
            className={`flex-1 p-2.5 rounded-lg text-[13px] font-bold text-center cursor-pointer
              ${mode === k ? 'border-2 border-primary-500 bg-primary-50 text-primary-700' : 'border-[1.5px] border-gray-200 bg-white text-gray-400'}`}>{l}</button>
        ))}
      </div>
      <OptionBar />

      {mode === 'single' ? (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 mb-3.5">
            <select value={sel?.id || ''} onChange={e => { setSel(students.find(s => s.id === e.target.value) || null); setDrafts({}); }}
              className="w-full h-10 rounded-lg border-[1.5px] border-gray-200 px-3 text-sm outline-none">
              <option value="">학생 선택</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.number}번 {s.name} ({observations.filter(o => o.studentId === s.id).length}건)</option>)}
            </select>
          </div>
          {sel && <>
            <button onClick={generate} disabled={gen || sObs.length === 0}
              className={`w-full h-11 rounded-lg border-none text-white text-sm font-bold mb-3.5 flex items-center justify-center gap-1.5
                ${gen ? 'bg-gray-400' : sObs.length === 0 ? 'bg-gray-200' : 'bg-primary-500 cursor-pointer hover:bg-primary-600'}`}>
              {gen ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> 생성 중...</> : '🤖 AI 초안 생성'}
            </button>
            {Object.keys(drafts).length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-sm font-bold">✨ 생성 결과</span>
                  <Btn variant="outline" onClick={copyAll} className="h-7 text-[11px]">📋 복사</Btn>
                </div>
                {Object.entries(drafts).map(([type, d]) => <DraftCard key={type} type={type} d={d} />)}
              </div>
            )}
          </>}
        </>
      ) : (
        <>
          {(() => {
            const eligible = students.filter(s => observations.filter(o => o.studentId === s.id).length > 0);
            const noData = students.filter(s => observations.filter(o => o.studentId === s.id).length === 0);
            return (
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 mb-3.5">
                <div className="text-[13px] font-bold mb-2">👥 일괄 생성 대상</div>
                <div className="flex gap-2 mb-2">
                  <span className="text-xs text-green-700 font-semibold">✅ 생성 가능: {eligible.length}명</span>
                  {noData.length > 0 && <span className="text-xs text-orange-700 font-semibold">⚠️ 기록 없음: {noData.length}명</span>}
                </div>
                {noData.length > 0 && <div className="px-2.5 py-1.5 bg-yellow-50 rounded-lg mb-2 text-[11px] text-yellow-700">기록 없는 학생: {noData.map(s => s.name).join(', ')}</div>}
                <button onClick={generateBatch} disabled={batchRunning || !eligible.length}
                  className={`w-full h-12 rounded-lg border-none text-white text-sm font-bold flex items-center justify-center gap-1.5
                    ${batchRunning ? 'bg-gray-400' : !eligible.length ? 'bg-gray-200' : 'bg-primary-500 cursor-pointer hover:bg-primary-600'}`}>
                  {batchRunning ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> {batchProgress.name} ({batchProgress.current}/{batchProgress.total})</> : `🤖 ${eligible.length}명 일괄 생성`}
                </button>
              </div>
            );
          })()}
          {batchRunning && <div className="mb-3.5 h-1.5 bg-gray-200 rounded overflow-hidden"><div className="h-full bg-primary-500 rounded transition-all" style={{ width: `${batchProgress.total ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }} /></div>}
          {Object.keys(batchResults).length > 0 && (
            <>
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-sm font-bold">✨ 일괄 결과 ({Object.keys(batchResults).length}명)</span>
                <div className="flex gap-1">
                  <Btn variant="outline" onClick={() => { navigator.clipboard?.writeText(students.filter(s => batchResults[s.id]).map(s => { const d = batchResults[s.id]; return `━━━ ${s.number}번 ${s.name} ━━━\n${Object.entries(d).map(([t, v]) => `[${t}]\n${v.edited || v.generated}`).join('\n\n')}`; }).join('\n\n')); setToast('전체 복사!'); setTimeout(() => setToast(null), 1200); }} className="h-7 text-[10px]">📋 전체 복사</Btn>
                  <Btn variant="default" onClick={exportBatchCSV} className="h-7 text-[10px]">📊 CSV</Btn>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {students.filter(s => batchResults[s.id]).map(s => {
                  const d = batchResults[s.id];
                  return (
                    <div key={s.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <details>
                        <summary className="px-3.5 py-3 cursor-pointer flex items-center gap-2" style={{ listStyle: 'none', WebkitAppearance: 'none' }}>
                          <span className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-[10px] font-bold text-primary-700 flex-shrink-0">{s.number}</span>
                          <span className="text-[13px] font-semibold text-gray-800 flex-1">{s.name}</span>
                          <span className="text-[10px] text-primary-600 font-semibold">✓ 완료</span>
                        </summary>
                        <div className="px-3.5 pb-3.5">
                          {Object.entries(d).map(([type, v]) => {
                            const c = DOMAIN_COLORS[type];
                            return (
                              <div key={type} className="mb-2 p-2.5 rounded-lg" style={{ background: c?.bg, border: `1px solid ${c?.border}22` }}>
                                <div className="text-[11px] font-bold mb-1" style={{ color: c?.text }}>{type}</div>
                                <p className="m-0 text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">{v.edited || v.generated}</p>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
