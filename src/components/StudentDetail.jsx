import { useState } from 'react';
import { DOMAIN_COLORS } from '../constants';
import { ObsCard } from './UI';

export default function StudentDetail({ student, observations, onBack, onEdit, onDelete }) {
  const [df, setDf] = useState('all');
  const obs = observations.filter(o => o.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const filtered = df === 'all' ? obs : obs.filter(o => o.domain === df);
  const counts = { '창체': obs.filter(o => o.domain === '창체').length, '교과': obs.filter(o => o.domain === '교과').length, '행동특성': obs.filter(o => o.domain === '행동특성').length };

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 cursor-pointer pb-3 flex items-center gap-1 border-none bg-transparent">← 돌아가기</button>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 text-center">
        <div className="w-13 h-13 rounded-full bg-primary-50 mx-auto mb-2 flex items-center justify-center text-xl font-extrabold text-primary-700">{student.number}</div>
        <div className="text-lg font-extrabold text-gray-800">{student.name}</div>
        <div className="text-xs text-gray-400 mt-0.5">{student.gender} · 총 {obs.length}건</div>
        <div className="flex justify-center gap-2 mt-3">
          {Object.entries(counts).map(([d, c]) => (
            <span key={d} className="text-[11px] px-2.5 py-1 rounded-lg font-semibold"
              style={{ background: DOMAIN_COLORS[d]?.bg, color: DOMAIN_COLORS[d]?.text }}>{d} {c}</span>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 mb-3">
        {[['all', '전체'], ['창체', '창체'], ['교과', '교과'], ['행동특성', '행동']].map(([k, l]) => (
          <button key={k} onClick={() => setDf(k)}
            className={`text-[11px] px-3 py-1 rounded-lg font-semibold cursor-pointer
              ${df === k ? 'border-[1.5px] border-primary-500 bg-primary-50 text-primary-700' : 'border-[1.5px] border-gray-200 bg-white text-gray-400'}`}>
            {l}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-300 text-sm">해당 영역의 기록이 없습니다</div>
      ) : (
        <div className="flex flex-col gap-2">{filtered.map(o => <ObsCard key={o.id} obs={o} onEdit={onEdit} onDelete={onDelete} />)}</div>
      )}
    </div>
  );
}
