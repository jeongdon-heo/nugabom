import { useState, useRef } from 'react';
import { todayStr, uid } from '../constants';
import { Toast, Btn, Modal } from './UI';

export default function Settings({ classroom, setClassroom, students, setStudents, observations, setObservations, apiKey, setApiKey }) {
  const [ec, setEc] = useState(false);
  const [tg, setTg] = useState(classroom.grade);
  const [tc, setTc] = useState(classroom.className);
  const [es, setEs] = useState(false);
  const [ts, setTs] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [toast, setToast] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const fr = useRef(null);

  const handleSaveClass = () => { setClassroom({ ...classroom, grade: tg, className: tc }); setEc(false); };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ classroom, students, observations, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `누가봄_${classroom.grade}-${classroom.className}_${todayStr()}.json`; a.click();
    setToast('내보내기 완료!'); setTimeout(() => setToast(null), 1500);
  };

  const importData = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.classroom) setClassroom(data.classroom);
        if (data.students) setStudents(data.students);
        if (data.observations) setObservations(data.observations);
        setShowImport(false);
        setToast('가져오기 완료!'); setTimeout(() => setToast(null), 1500);
      } catch { alert('잘못된 파일 형식입니다.'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  return (
    <div>
      <Toast msg={toast} />

      {/* Classroom */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3.5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-gray-800">🏫 학급 정보</span>
          <Btn variant={ec ? 'primary' : 'outline'} onClick={() => ec ? handleSaveClass() : setEc(true)} className="h-7 text-[11px]">{ec ? '저장' : '수정'}</Btn>
        </div>
        {ec ? (
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="text-[11px] text-gray-400 block mb-1">학년</label>
              <select value={tg} onChange={e => setTg(Number(e.target.value))} className="w-full h-9 rounded-lg border-[1.5px] border-gray-200 px-2 text-[13px]">
                {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>{g}학년</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-gray-400 block mb-1">반</label>
              <input value={tc} onChange={e => setTc(e.target.value)} className="w-full h-9 rounded-lg border-[1.5px] border-gray-200 px-2 text-[13px] box-border" />
            </div>
          </div>
        ) : (
          <div className="flex gap-4 text-[13px]">
            <span className="text-gray-400">학년</span><span className="font-semibold">{classroom.grade}학년</span>
            <span className="text-gray-400 ml-2">반</span><span className="font-semibold">{classroom.className}</span>
            <span className="text-gray-400 ml-2">학생</span><span className="font-semibold">{students.length}명</span>
          </div>
        )}
      </div>

      {/* Students */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3.5">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-800">👥 학생 명단</span>
          {es ? (
            <div className="flex gap-1">
              <Btn variant="ghost" onClick={() => setEs(false)} className="h-7 text-[11px]">취소</Btn>
              <Btn variant="primary" onClick={() => { setStudents(ts); setEs(false); }} className="h-7 text-[11px]">저장</Btn>
            </div>
          ) : <Btn variant="outline" onClick={() => { setTs(students.map(s => ({ ...s }))); setEs(true); }} className="h-7 text-[11px]">수정</Btn>}
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {(es ? ts : students).map(s => (
            <div key={s.id} className="flex items-center gap-2 px-4 py-2 border-b border-gray-50">
              <span className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-[10px] font-bold text-primary-700 flex-shrink-0">{s.number}</span>
              {es ? (
                <>
                  <input value={s.name} onChange={e => setTs(p => p.map(x => x.id === s.id ? { ...x, name: e.target.value } : x))}
                    className="flex-1 h-7 rounded-md border-[1.5px] border-gray-200 px-2 text-[13px] outline-none" />
                  <select value={s.gender} onChange={e => setTs(p => p.map(x => x.id === s.id ? { ...x, gender: e.target.value } : x))}
                    className="w-[50px] h-7 rounded-md border-[1.5px] border-gray-200 text-[11px]">
                    {['남', '여', '미정'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <button onClick={() => setTs(p => p.filter(x => x.id !== s.id).map((x, i) => ({ ...x, number: i + 1 })))} className="border-none bg-transparent text-red-500 cursor-pointer text-sm">✕</button>
                </>
              ) : (
                <><span className="flex-1 text-[13px] font-medium text-gray-800">{s.name}</span><span className="text-[11px] text-gray-400">{s.gender}</span></>
              )}
            </div>
          ))}
        </div>
        {es && (
          <div className="p-3 border-t border-gray-100">
            <Btn variant="outline" onClick={() => setTs(p => [...p, { id: `s${uid()}`, number: p.length + 1, name: `학생${p.length + 1}`, gender: '미정' }])} className="w-full h-8">+ 학생 추가</Btn>
          </div>
        )}
      </div>

      {/* API Key */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3.5">
        <div className="text-sm font-bold text-gray-800 mb-3">🔑 Gemini API 키</div>
        <div className="flex gap-1.5 items-center">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="AIzaSy... (Google AI Studio에서 발급)"
            className="flex-1 h-9 rounded-lg border-[1.5px] border-gray-200 px-3 text-[13px] outline-none focus:border-primary-400 font-mono"
          />
          <button onClick={() => setShowKey(!showKey)}
            className="w-9 h-9 rounded-lg border border-gray-200 bg-white cursor-pointer flex items-center justify-center text-sm flex-shrink-0">
            {showKey ? '🙈' : '👁'}
          </button>
        </div>
        <div className="mt-2 text-[11px] text-gray-400 leading-relaxed">
          AI 관찰 문구 생성, 초안 생성에 사용됩니다.
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-primary-600 ml-1">키 발급 →</a>
        </div>
        {apiKey && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-[11px] text-green-700 font-semibold">키 설정됨</span>
          </div>
        )}
      </div>

      {/* Data */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm font-bold text-gray-800 mb-3">💾 데이터 관리</div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Btn variant="outline" onClick={exportData} className="flex-1 h-9">📥 내보내기</Btn>
            <Btn variant="default" onClick={() => setShowImport(true)} className="flex-1 h-9">📤 가져오기</Btn>
          </div>
          <Btn variant="danger" onClick={() => setShowReset(true)} className="w-full h-9">🗑 기록 초기화</Btn>
        </div>
        <div className="mt-2.5 text-[11px] text-gray-400 leading-relaxed">내보내기: 모든 데이터를 JSON 파일로 저장 · 가져오기: JSON 파일에서 복원</div>
      </div>

      {showImport && (
        <Modal title="📤 데이터 가져오기" onClose={() => setShowImport(false)}>
          <p className="text-[13px] text-gray-600 leading-relaxed mt-0">이전에 내보낸 JSON 파일을 선택하면 현재 데이터를 덮어씁니다.</p>
          <p className="text-xs text-red-600 font-semibold">⚠️ 현재 데이터가 모두 교체됩니다.</p>
          <input type="file" ref={fr} accept=".json" onChange={importData} className="hidden" />
          <div className="flex gap-2 mt-3">
            <Btn variant="default" onClick={() => setShowImport(false)} className="flex-1">취소</Btn>
            <Btn variant="primary" onClick={() => fr.current?.click()} className="flex-1">파일 선택</Btn>
          </div>
        </Modal>
      )}
      {showReset && (
        <Modal title="🗑 기록 초기화" onClose={() => setShowReset(false)}>
          <p className="text-[13px] text-gray-600 leading-relaxed mt-0">모든 누가기록이 삭제됩니다. 학급·학생 정보는 유지됩니다.</p>
          <p className="text-[13px] text-red-600 font-bold">이 작업은 되돌릴 수 없습니다.</p>
          <div className="flex gap-2 mt-4">
            <Btn variant="default" onClick={() => setShowReset(false)} className="flex-1">취소</Btn>
            <Btn variant="danger" onClick={() => { setObservations([]); setShowReset(false); setToast('초기화 완료'); setTimeout(() => setToast(null), 1500); }} className="flex-1">삭제하기</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
