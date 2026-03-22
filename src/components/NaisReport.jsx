import { useState } from 'react';
import { DOMAIN_COLORS, fmtDate, todayStr } from '../constants';
import { Toast } from './UI';

export default function NaisReport({ students, observations }) {
  const [sel, setSel] = useState(null);
  const [domain, setDomain] = useState('교과');
  const [toast, setToast] = useState(null);

  const sObs = sel ? observations.filter(o => o.studentId === sel.id) : [];
  const selIdx = sel ? students.findIndex(s => s.id === sel.id) : -1;

  // Group by domain
  const grouped = { '창체': {}, '교과': {}, '행동특성': [] };
  sObs.forEach(o => {
    if (o.domain === '창체') { const c = o.category || '기타'; if (!grouped['창체'][c]) grouped['창체'][c] = []; grouped['창체'][c].push(o); }
    else if (o.domain === '교과') { const c = o.category || '기타'; if (!grouped['교과'][c]) grouped['교과'][c] = []; grouped['교과'][c].push(o); }
    else if (o.domain === '행동특성') grouped['행동특성'].push(o);
  });
  Object.values(grouped['창체']).forEach(a => a.sort((a, b) => a.date.localeCompare(b.date)));
  Object.values(grouped['교과']).forEach(a => a.sort((a, b) => a.date.localeCompare(b.date)));
  grouped['행동특성'].sort((a, b) => a.date.localeCompare(b.date));

  const buildText = (dom) => {
    if (dom === '교과' || dom === '창체') {
      const data = grouped[dom];
      const cats = Object.keys(data).sort();
      if (cats.length === 0) return '(기록 없음)';
      return cats.map(cat => {
        const lines = data[cat].map(o => `${fmtDate(o.date)} ${o.stdCode ? `[${o.stdCode}] ` : ''}${o.memo}`);
        return `[${cat}]\n${lines.join('\n')}`;
      }).join('\n\n');
    }
    const items = grouped['행동특성'];
    return items.length === 0 ? '(기록 없음)' : items.map(o => `${fmtDate(o.date)} ${o.memo}`).join('\n');
  };

  const copySection = (dom, cat) => {
    let text;
    if (cat) { const items = (grouped[dom] || {})[cat] || []; text = items.map(o => `${fmtDate(o.date)} ${o.stdCode ? `[${o.stdCode}] ` : ''}${o.memo}`).join('\n'); }
    else text = buildText(dom);
    navigator.clipboard?.writeText(text);
    setToast('복사 완료!'); setTimeout(() => setToast(null), 1200);
  };

  const exportAllCSV = () => {
    let csv = '\uFEFF번호,이름,영역,세부영역,날짜,성취기준,메모\n';
    students.forEach(s => {
      observations.filter(o => o.studentId === s.id).sort((a, b) => a.date.localeCompare(b.date)).forEach(o => {
        csv += `${s.number},"${s.name}","${o.domain || ''}","${o.category || ''}","${o.date}","${o.stdCode || ''}","${(o.memo || '').replace(/"/g, '""')}"\n`;
      });
    });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `누가봄_전체기록_${todayStr()}.csv`; a.click();
    setToast('CSV 내보내기 완료!'); setTimeout(() => setToast(null), 1500);
  };

  const domainData = domain === '행동특성' ? null : grouped[domain];
  const totalCount = domain === '행동특성' ? grouped['행동특성'].length : Object.values(domainData || {}).reduce((s, a) => s + a.length, 0);

  return (
    <div>
      <Toast msg={toast} />
      <button onClick={exportAllCSV} className="w-full p-2.5 rounded-lg text-xs font-semibold border-[1.5px] border-blue-600 bg-blue-50 text-blue-800 cursor-pointer mb-3.5">📊 전체 학생 CSV 내보내기</button>

      {/* Student selector with nav */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 mb-3.5">
        <div className="text-[11px] text-gray-400 font-semibold mb-2">👤 학생 선택</div>
        <div className="flex gap-1.5 items-center">
          <button onClick={() => selIdx > 0 && setSel(students[selIdx - 1])} disabled={selIdx <= 0}
            className={`w-9 h-10 rounded-lg border border-gray-200 text-base flex items-center justify-center flex-shrink-0 ${selIdx <= 0 ? 'bg-gray-50 text-gray-200' : 'bg-white text-gray-500 cursor-pointer'}`}>‹</button>
          <select value={sel?.id || ''} onChange={e => setSel(students.find(s => s.id === e.target.value) || null)}
            className="flex-1 h-10 rounded-lg border-[1.5px] border-gray-200 px-3 text-sm outline-none">
            <option value="">선택하세요</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.number}번 {s.name} ({observations.filter(o => o.studentId === s.id).length}건)</option>)}
          </select>
          <button onClick={() => selIdx < students.length - 1 && selIdx >= 0 && setSel(students[selIdx + 1])} disabled={selIdx >= students.length - 1 || selIdx < 0}
            className={`w-9 h-10 rounded-lg border border-gray-200 text-base flex items-center justify-center flex-shrink-0 ${selIdx >= students.length - 1 || selIdx < 0 ? 'bg-gray-50 text-gray-200' : 'bg-white text-gray-500 cursor-pointer'}`}>›</button>
        </div>
      </div>

      {sel && <>
        {/* Domain tabs */}
        <div className="flex gap-1.5 mb-3.5">
          {[['창체', '창체'], ['교과', '교과'], ['행동특성', '행동']].map(([k, label]) => {
            const active = domain === k;
            const cnt = k === '행동특성' ? grouped['행동특성'].length : Object.values(grouped[k]).reduce((s, a) => s + a.length, 0);
            const c = DOMAIN_COLORS[k];
            return (
              <button key={k} onClick={() => setDomain(k)}
                className={`flex-1 p-2.5 rounded-lg text-center cursor-pointer transition-all
                  ${active ? 'border-2' : 'border-[1.5px] border-gray-200 bg-white'}`}
                style={active ? { borderColor: c.border, background: c.bg } : {}}>
                <div className={`text-xs font-bold ${active ? '' : 'text-gray-500'}`} style={active ? { color: c.text } : {}}>{label}</div>
                <div className={`text-[10px] mt-0.5 ${active ? '' : 'text-gray-300'}`} style={active ? { color: c.text } : {}}>{cnt}건</div>
              </button>
            );
          })}
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-2.5">
          <div>
            <span className="text-sm font-bold text-gray-800">{domain === '창체' ? '창의적 체험활동상황' : domain === '교과' ? '교과학습발달상황' : '행동특성 및 종합의견'}</span>
            <span className="text-[11px] text-gray-400 ml-1.5">{totalCount}건</span>
          </div>
          <button onClick={() => copySection(domain)} className="text-[11px] px-3 py-1 rounded-md border-[1.5px] border-primary-500 bg-white text-primary-600 font-semibold cursor-pointer">📋 전체 복사</button>
        </div>

        {/* Content */}
        {domain === '행동특성' ? (
          grouped['행동특성'].length === 0 ? <div className="text-center py-10 text-gray-300 text-sm">기록이 없습니다</div> : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b" style={{ background: DOMAIN_COLORS['행동특성'].bg, borderColor: DOMAIN_COLORS['행동특성'].border + '33' }}>
                <span className="text-xs font-bold" style={{ color: DOMAIN_COLORS['행동특성'].text }}>행동특성 및 종합의견</span>
              </div>
              <div className="p-3.5 flex flex-col gap-2">
                {grouped['행동특성'].map(o => (
                  <div key={o.id} className="flex gap-2.5 items-start">
                    <div className="flex-shrink-0 w-11 text-[11px] text-gray-400 tabular-nums pt-0.5">{fmtDate(o.date)}</div>
                    <div className="flex-1">
                      {o.category && <span className="text-[9px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mr-1">{o.category}</span>}
                      <span className="text-[13px] text-gray-800 leading-relaxed">{o.memo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          Object.keys(domainData || {}).length === 0 ? <div className="text-center py-10 text-gray-300 text-sm">{domain} 기록이 없습니다</div> : (
            <div className="flex flex-col gap-3">
              {Object.entries(domainData).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => {
                const c = DOMAIN_COLORS[domain];
                return (
                  <div key={cat} className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${c?.border || '#e5e7eb'}` }}>
                    <div className="px-4 py-2.5 flex justify-between items-center" style={{ background: c?.bg, borderBottom: `1px solid ${c?.border}22` }}>
                      <div>
                        <span className="text-[13px] font-bold" style={{ color: c?.text }}>{cat}</span>
                        <span className="text-[10px] ml-1.5" style={{ color: c?.text, opacity: 0.7 }}>{items.length}건</span>
                      </div>
                      <button onClick={() => copySection(domain, cat)} className="text-[10px] px-2 py-0.5 rounded border bg-white cursor-pointer font-semibold" style={{ borderColor: c?.border, color: c?.text }}>복사</button>
                    </div>
                    <div className="p-3.5 flex flex-col gap-2">
                      {items.map(o => (
                        <div key={o.id} className="flex gap-2.5 items-start">
                          <div className="flex-shrink-0 w-11 text-[11px] text-gray-400 tabular-nums pt-0.5">{fmtDate(o.date)}</div>
                          <div className="flex-1">
                            {o.stdCode && <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mr-1">{o.stdCode}</span>}
                            <span className="text-[13px] text-gray-800 leading-relaxed">{o.memo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Full text preview */}
        {totalCount > 0 && (
          <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-500">📄 나이스 입력용 텍스트</span>
              <button onClick={() => copySection(domain)} className="text-[10px] px-2.5 py-0.5 rounded border border-primary-500 bg-primary-50 text-primary-700 cursor-pointer font-semibold">복사</button>
            </div>
            <pre className="m-0 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words font-sans">{buildText(domain)}</pre>
          </div>
        )}
      </>}
    </div>
  );
}
