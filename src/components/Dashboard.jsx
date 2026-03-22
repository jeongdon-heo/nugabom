import { useState } from 'react';
import { DOMAIN_COLORS } from '../constants';
import { ObsCard } from './UI';

export default function Dashboard({ students, observations, onNavigate }) {
  const [filter, setFilter] = useState('all');
  const getCount = (sid, dom) => observations.filter(o => o.studentId === sid && (!dom || o.domain === dom)).length;
  const getStatus = t => t >= 6 ? 'good' : t >= 3 ? 'warn' : 'low';
  const sm = { good: { bg: 'bg-green-50', c: 'text-green-800', l: '충분' }, warn: { bg: 'bg-yellow-50', c: 'text-yellow-700', l: '보통' }, low: { bg: 'bg-red-50', c: 'text-red-800', l: '부족' } };

  const filtered = filter === 'all' ? students : students.filter(s => getStatus(getCount(s.id)) === filter);
  const totalObs = observations.length;
  const avg = students.length ? (totalObs / students.length).toFixed(1) : 0;
  const lowCount = students.filter(s => getCount(s.id) < 3).length;
  const recent = [...observations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { l: '총 기록', v: totalObs, u: '건', c: 'text-blue-800' },
          { l: '학생 평균', v: avg, u: '건', c: 'text-green-800' },
          { l: '기록 부족', v: lowCount, u: '명', c: lowCount > 0 ? 'text-red-800' : 'text-gray-400' },
        ].map((x, i) => (
          <div key={i} className="bg-white rounded-xl p-3.5 border border-gray-200 text-center">
            <div className="text-[10px] text-gray-400 mb-0.5">{x.l}</div>
            <div className={`text-2xl font-extrabold font-display ${x.c}`}>
              {x.v}<span className="text-[11px] font-normal text-gray-400 ml-0.5">{x.u}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-3">
        {[['all', '전체'], ['low', '부족'], ['warn', '보통'], ['good', '충분']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`text-[11px] px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer
              ${filter === k ? 'border-[1.5px] border-primary-500 bg-primary-50 text-primary-700' : 'border-[1.5px] border-gray-200 bg-white text-gray-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {['#', '이름', '창체', '교과', '행동', '합계', ''].map(h => (
                  <th key={h} className="p-2.5 text-center text-gray-400 font-semibold text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const c = getCount(s.id, '창체'), su = getCount(s.id, '교과'), b = getCount(s.id, '행동특성'), total = c + su + b;
                const st = sm[getStatus(total)];
                return (
                  <tr key={s.id} className="border-b border-gray-100 cursor-pointer hover:bg-gray-50" onClick={() => onNavigate('detail', s.id)}>
                    <td className="p-2.5 text-center text-gray-400 text-[11px]">{s.number}</td>
                    <td className="p-2.5 text-center font-semibold text-gray-800">{s.name}</td>
                    {[c, su, b].map((v, i) => <td key={i} className={`p-2.5 text-center ${v === 0 ? 'text-gray-200' : 'text-gray-600'}`}>{v || '·'}</td>)}
                    <td className="p-2.5 text-center font-bold">{total}</td>
                    <td className="p-2.5 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${st.bg} ${st.c}`}>{st.l}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <div className="text-sm font-bold text-gray-800 mb-2.5">📝 최근 기록</div>
          <div className="flex flex-col gap-2">
            {recent.map(o => <ObsCard key={o.id} obs={o} studentName={students.find(s => s.id === o.studentId)?.name} />)}
          </div>
        </div>
      )}
    </div>
  );
}
