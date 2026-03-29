import { useState, useEffect, useCallback } from 'react';
import { db, getSetting, setSetting } from './db';
import { DEFAULT_STUDENTS } from './constants';
import { Modal, Btn } from './components/UI';
import Dashboard from './components/Dashboard';
import StudentDetail from './components/StudentDetail';
import CurriculumInput from './components/CurriculumInput';
import NaisReport from './components/NaisReport';
import AIDraft from './components/AIDraft';
import Settings from './components/Settings';
import curriculumData from './data/curriculum.json';

// Remove _meta key from curriculum data
const { _meta, ...rawCurriculum } = curriculumData;

export default function App() {
  const [page, setPage] = useState('home');
  const [subPage, setSubPage] = useState(null);
  const [classroom, setClassroom] = useState({ grade: 4, className: '2반', year: 2026, semester: 1 });
  const [students, setStudents] = useState(DEFAULT_STUDENTS);
  const [observations, setObservations] = useState([]);
  const [curriculum, setCurriculum] = useState(rawCurriculum);
  const [loaded, setLoaded] = useState(false);
  const [editObs, setEditObs] = useState(null);
  const [apiKey, setApiKey] = useState('');

  // Load from Dexie
  useEffect(() => {
    (async () => {
      try {
        const savedClass = await getSetting('classroom');
        const savedStudents = await getSetting('students');
        const savedCurriculum = await getSetting('curriculum');
        const savedApiKey = await getSetting('apiKey');
        const allObs = await db.observations.toArray();

        if (savedClass) setClassroom(savedClass);
        if (savedStudents) setStudents(savedStudents);
        if (savedCurriculum) setCurriculum(savedCurriculum);
        if (savedApiKey) setApiKey(savedApiKey);
        if (allObs.length) setObservations(allObs);
      } catch (e) {
        console.error('Load error:', e);
      }
      setLoaded(true);
    })();
  }, []);

  // Save classroom & students
  useEffect(() => {
    if (!loaded) return;
    setSetting('classroom', classroom);
    setSetting('students', students);
  }, [classroom, students, loaded]);

  // Save observations — sync IndexedDB with in-memory state
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const obsIds = new Set(observations.map(o => o.id));
        const dbKeys = await db.observations.toCollection().primaryKeys();
        const toDelete = dbKeys.filter(k => !obsIds.has(k));
        await db.transaction('rw', db.observations, async () => {
          if (toDelete.length) await db.observations.bulkDelete(toDelete);
          if (observations.length) await db.observations.bulkPut(observations);
        });
      } catch (e) { console.error('Save obs error:', e); }
    })();
  }, [observations, loaded]);

  // Save curriculum edits
  useEffect(() => {
    if (!loaded) return;
    setSetting('curriculum', curriculum);
  }, [curriculum, loaded]);

  // Save API key
  useEffect(() => {
    if (!loaded) return;
    setSetting('apiKey', apiKey);
  }, [apiKey, loaded]);

  const addObs = useCallback(obs => setObservations(p => [...p, obs]), []);
  const deleteObs = useCallback(id => {
    if (confirm('이 기록을 삭제할까요?')) setObservations(p => p.filter(o => o.id !== id));
  }, []);
  const startEditObs = useCallback(obs => setEditObs({ ...obs }), []);
  const saveEditObs = () => {
    setObservations(p => p.map(o => o.id === editObs.id ? editObs : o));
    setEditObs(null);
  };

  const navigate = (type, id) => {
    if (type === 'detail') { setSubPage({ id }); setPage('detail'); }
  };

  const currentStudent = subPage?.id ? students.find(s => s.id === subPage.id) : null;
  const gradeCurriculum = curriculum[classroom.grade] || {};

  const navItems = [
    { key: 'home', icon: '📊', label: '대시보드' },
    { key: 'input', icon: '✏️', label: '기록' },
    { key: 'report', icon: '📋', label: '정리' },
    { key: 'ai', icon: '🤖', label: 'AI초안' },
    { key: 'settings', icon: '⚙️', label: '설정' },
  ];

  return (
    <div className="max-w-[480px] mx-auto min-h-screen font-sans bg-[#F5F6F8]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/[0.93] backdrop-blur-xl border-b border-gray-200 px-4 py-2.5">
        <div className="flex justify-between items-center">
          <div onClick={() => { setPage('home'); setSubPage(null); }} className="cursor-pointer">
            <span className="text-[17px] font-extrabold text-primary-600 tracking-tight font-display">
              <span className="text-[19px] mr-0.5">🌱</span>누가봄
            </span>
          </div>
          <div className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md font-semibold">
            {classroom.grade}-{classroom.className} · {classroom.semester}학기
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3.5 pt-3.5 pb-20">
        {page === 'home' && <Dashboard students={students} observations={observations} onNavigate={navigate} />}
        {page === 'detail' && currentStudent && (
          <StudentDetail student={currentStudent} observations={observations}
            onBack={() => { setPage('home'); setSubPage(null); }}
            onEdit={startEditObs} onDelete={deleteObs} />
        )}
        {page === 'input' && (
          <CurriculumInput students={students} observations={observations}
            onSave={addObs} grade={classroom.grade} curriculum={gradeCurriculum} apiKey={apiKey} />
        )}
        {page === 'report' && <NaisReport students={students} observations={observations} />}
        {page === 'ai' && <AIDraft students={students} observations={observations} grade={classroom.grade} apiKey={apiKey} />}
        {page === 'settings' && (
          <Settings classroom={classroom} setClassroom={setClassroom}
            students={students} setStudents={setStudents}
            observations={observations} setObservations={setObservations}
            apiKey={apiKey} setApiKey={setApiKey} />
        )}
      </div>

      {/* Edit observation modal */}
      {editObs && (
        <Modal title="✏️ 기록 수정" onClose={() => setEditObs(null)}>
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">날짜</label>
              <input type="date" value={editObs.date} onChange={e => setEditObs(p => ({ ...p, date: e.target.value }))}
                className="w-full h-9 rounded-lg border-[1.5px] border-gray-200 px-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">영역</label>
              <select value={editObs.domain || ''} onChange={e => setEditObs(p => ({ ...p, domain: e.target.value || null }))}
                className="w-full h-9 rounded-lg border-[1.5px] border-gray-200 px-2 text-[13px]">
                <option value="">미분류</option>
                <option value="창체">창체</option>
                <option value="교과">교과</option>
                <option value="행동특성">행동특성</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">세부 영역</label>
              <input value={editObs.category || ''} onChange={e => setEditObs(p => ({ ...p, category: e.target.value || null }))}
                placeholder="예: 수학, 자율자치" className="w-full h-9 rounded-lg border-[1.5px] border-gray-200 px-2 text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">메모</label>
              <textarea value={editObs.memo} onChange={e => setEditObs(p => ({ ...p, memo: e.target.value }))}
                className="w-full min-h-[80px] rounded-lg border-[1.5px] border-gray-200 p-2 text-[13px] leading-relaxed resize-y font-sans" />
            </div>
            <div className="flex gap-2 mt-1">
              <Btn variant="default" onClick={() => setEditObs(null)} className="flex-1">취소</Btn>
              <Btn variant="primary" onClick={saveEditObs} className="flex-1">저장</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-xl border-t border-gray-200 flex justify-around py-1 pb-2.5 z-50">
        {navItems.map(n => {
          const active = page === n.key || (page === 'detail' && n.key === 'home');
          return (
            <button key={n.key} onClick={() => { setPage(n.key); if (n.key !== 'home') setSubPage(null); }}
              className="border-none bg-transparent cursor-pointer flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg">
              <span className={`text-[19px] ${active ? '' : 'grayscale-[0.6] opacity-50'}`}>{n.icon}</span>
              <span className={`text-[9px] ${active ? 'font-bold text-primary-600' : 'font-medium text-gray-400'}`}>{n.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
