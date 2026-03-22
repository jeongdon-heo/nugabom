import { DOMAIN_COLORS, fmtDate } from '../constants';

export function Badge({ domain, category }) {
  const c = DOMAIN_COLORS[domain] || { bg: '#F5F5F5', text: '#888' };
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: c.bg, color: c.text }}>
      {domain}{category ? ` · ${category}` : ''}
    </span>
  );
}

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed top-[60px] left-1/2 -translate-x-1/2 bg-primary-600 text-white px-5 py-2 rounded-full text-sm font-semibold z-[200] shadow-lg"
      style={{ animation: 'fadeIn .25s ease' }}>
      ✓ {msg}
    </div>
  );
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/35" />
      <div onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl w-[92%] max-w-[420px] max-h-[85vh] overflow-auto shadow-2xl">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <span className="text-[15px] font-bold text-gray-800">{title}</span>
          <button onClick={onClose} className="text-lg text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ObsCard({ obs, studentName, onEdit, onDelete }) {
  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-gray-400 tabular-nums">{fmtDate(obs.date)}</span>
          {studentName && <span className="text-xs font-semibold text-gray-600">{studentName}</span>}
          {obs.domain && <Badge domain={obs.domain} category={obs.category} />}
          {obs.stdCode && <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{obs.stdCode}</span>}
        </div>
        <div className="flex gap-1">
          {onEdit && <button onClick={() => onEdit(obs)} className="text-sm text-gray-400 hover:text-gray-600 p-0.5">✏️</button>}
          {onDelete && <button onClick={() => onDelete(obs.id)} className="text-sm text-gray-300 hover:text-red-400 p-0.5">🗑</button>}
        </div>
      </div>
      <p className="m-0 text-[13px] text-gray-800 leading-relaxed">{obs.memo}</p>
    </div>
  );
}

export function Btn({ children, variant = 'default', className = '', ...props }) {
  const base = 'h-9 rounded-lg px-4 text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1 transition-all';
  const variants = {
    primary: 'bg-primary-500 text-white border-none hover:bg-primary-600',
    outline: 'bg-white text-primary-500 border-[1.5px] border-primary-500 hover:bg-primary-50',
    danger: 'bg-white text-red-600 border-[1.5px] border-red-500 hover:bg-red-50',
    default: 'bg-white text-gray-500 border-[1.5px] border-gray-200 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-500 border-none hover:bg-gray-100',
  };
  return (
    <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function StudentScroller({ students, observations, selected, onSelect }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
      {students.map(s => {
        const sel = selected?.id === s.id;
        const cnt = observations.filter(o => o.studentId === s.id).length;
        return (
          <button key={s.id} onClick={() => onSelect(s)}
            className={`flex-shrink-0 w-[54px] h-[58px] rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer relative transition-all
              ${sel ? 'border-2 border-primary-500 bg-primary-50 shadow-md' : 'border-[1.5px] border-gray-200 bg-white'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
              ${sel ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{s.number}</div>
            <div className={`text-[9px] max-w-[48px] truncate ${sel ? 'font-bold text-primary-700' : 'font-medium text-gray-500'}`}>{s.name}</div>
            {cnt > 0 && (
              <div className={`absolute -top-0.5 -right-0.5 w-[14px] h-[14px] rounded-full text-white text-[7px] font-bold flex items-center justify-center
                ${cnt >= 6 ? 'bg-primary-500' : cnt >= 3 ? 'bg-amber-500' : 'bg-red-500'}`}>{cnt}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
