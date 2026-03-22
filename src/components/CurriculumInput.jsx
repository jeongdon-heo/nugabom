import { useState, useRef } from 'react';
import { GRADE_SUBJECTS, TEMPLATES, parseHashtags, todayStr, uid } from '../constants';
import { Toast, ObsCard, StudentScroller } from './UI';
import { callGemini } from '../gemini';

export default function CurriculumInput({ students, observations, onSave, grade, curriculum, apiKey }) {
  const [selStudent, setSelStudent] = useState(null);
  const [mode, setMode] = useState('curriculum');
  const [selSubject, setSelSubject] = useState(null);
  const [selUnit, setSelUnit] = useState(null);
  const [selStd, setSelStd] = useState(null);
  const [phrases, setPhrases] = useState([]);
  const [loadingPhrases, setLoadingPhrases] = useState(false);
  const [selectedPhrases, setSelectedPhrases] = useState([]);
  const [extraMemo, setExtraMemo] = useState('');
  const [toast, setToast] = useState(null);
  const [freeText, setFreeText] = useState('');
  const [showTpl, setShowTpl] = useState(false);
  const inputRef = useRef(null);

  const curData = curriculum || {};
  const allSubjects = GRADE_SUBJECTS[grade] || [];
  const units = selSubject && curData[selSubject] ? curData[selSubject].units : [];
  const standards = selUnit ? units.find(u => u.id === selUnit.id)?.standards || [] : [];
  const studentObs = selStudent ? observations.filter(o => o.studentId === selStudent.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3) : [];
  const quickTags = [...allSubjects.slice(0, 5).map(s => '#' + s), '#자율', '#동아리', '#협동', '#발표', '#성장'];

  const generatePhrases = async (std) => {
    setLoadingPhrases(true); setPhrases([]); setSelectedPhrases([]);
    try {
      const prompt = `초등학교 ${grade}학년 ${selSubject} 교과의 성취기준에 대한 관찰 문구를 생성해주세요.\n\n성취기준: ${std.code} - ${std.text}\n\n이 성취기준을 달성한 학생에 대해 교사가 누가기록에 사용할 수 있는 짧은 관찰 문구 8~10개를 생성해주세요.\n\n규칙:\n- 각 문구는 10~25자 내외\n- 성취 수준별로 다양하게 (우수/보통/노력필요)\n- 구체적인 학습 행동 서술\n- JSON 배열로만 응답 (다른 텍스트 없이)\n- 형식: [{"phrase":"문구","level":"상"},{"phrase":"문구","level":"중"},{"phrase":"문구","level":"하"}]\n- level은 "상","중","하" 중 하나`;
      const txt = await callGemini(prompt, apiKey);
      setPhrases(JSON.parse(txt.replace(/```json|```/g, '').trim()));
    } catch {
      setPhrases([
        { phrase: '개념을 정확히 이해함', level: '상' }, { phrase: '문제를 스스로 해결함', level: '상' },
        { phrase: '친구에게 설명할 수 있음', level: '상' }, { phrase: '기본 개념을 이해함', level: '중' },
        { phrase: '교사 도움으로 문제 해결', level: '중' }, { phrase: '추가 연습이 필요함', level: '하' },
      ]);
    }
    setLoadingPhrases(false);
  };

  const togglePhrase = (phrase) => setSelectedPhrases(p => p.includes(phrase) ? p.filter(x => x !== phrase) : [...p, phrase]);

  const sendRecord = () => {
    if (!selStudent) return;
    if (mode === 'free') {
      if (!freeText.trim()) return;
      const parsed = parseHashtags(freeText);
      onSave({ id: uid(), studentId: selStudent.id, date: todayStr(), domain: parsed.domain, category: parsed.category, memo: parsed.memo, stdCode: null });
      setFreeText('');
    } else {
      if (selectedPhrases.length === 0 && !extraMemo.trim()) return;
      const memo = [...selectedPhrases, extraMemo.trim()].filter(Boolean).join(', ');
      onSave({ id: uid(), studentId: selStudent.id, date: todayStr(), domain: '교과', category: selSubject, memo, stdCode: selStd?.code || null });
      setSelectedPhrases([]); setExtraMemo('');
    }
    setToast(`${selStudent.name} 기록 저장!`); setTimeout(() => setToast(null), 1500);
  };

  const levelColors = { '상': { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-800' }, '중': { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-800' }, '하': { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-800' } };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      <Toast msg={toast} />

      {/* Student + Mode toggle */}
      <div className="pb-2 border-b border-gray-100 flex-shrink-0">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] text-gray-400 font-semibold">👤 학생 선택</span>
          <div className="flex gap-1">
            {[['curriculum', '📚 교과'], ['free', '✏️ 자유']].map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)}
                className={`text-[10px] px-2.5 py-1 rounded-md font-semibold cursor-pointer
                  ${mode === k ? 'border-[1.5px] border-primary-500 bg-primary-50 text-primary-700' : 'border-[1.5px] border-gray-200 bg-white text-gray-400'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <StudentScroller students={students} observations={observations} selected={selStudent} onSelect={setSelStudent} />
      </div>

      {!selStudent ? (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">위에서 학생을 선택해 주세요</div>
      ) : mode === 'free' ? (
        /* FREE MODE */
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto py-3">
            {studentObs.length === 0 ? <div className="text-center py-8 text-gray-300 text-sm">아직 기록이 없어요 ✏️</div> : (
              <div className="flex flex-col gap-1.5">{studentObs.map(o => <ObsCard key={o.id} obs={o} />)}</div>
            )}
          </div>
          {showTpl && (
            <div className="bg-white border-t border-gray-200 px-3 py-2.5 max-h-[180px] overflow-y-auto flex-shrink-0">
              {TEMPLATES.map(g => (
                <div key={g.group} className="mb-2">
                  <div className="text-[10px] text-gray-400 font-semibold mb-1">{g.group}</div>
                  <div className="flex flex-wrap gap-1">{g.items.map(t => (
                    <button key={t} onClick={() => { setFreeText(p => (p ? `${p} ${t} - ` : `${t} - `)); setShowTpl(false); }}
                      className="border border-gray-200 bg-gray-50 rounded-md px-2 py-1 text-[11px] cursor-pointer hover:bg-primary-50">{t}</button>
                  ))}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-1.5 py-1.5 overflow-x-auto border-t border-gray-100 flex-shrink-0">
            {quickTags.map(tag => (
              <button key={tag} onClick={() => { setFreeText(p => p ? `${tag} ${p}` : `${tag} `); }}
                className="flex-shrink-0 border border-gray-200 bg-white rounded-md px-2 py-0.5 text-[10px] text-gray-500 cursor-pointer">{tag}</button>
            ))}
          </div>
          <div className="flex gap-1.5 items-center py-1.5 flex-shrink-0">
            <button onClick={() => setShowTpl(!showTpl)} className={`w-9 h-9 rounded-lg border border-gray-200 ${showTpl ? 'bg-primary-50' : 'bg-white'} cursor-pointer flex items-center justify-center text-[15px] flex-shrink-0`}>📋</button>
            <input ref={inputRef} value={freeText} onChange={e => setFreeText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) sendRecord(); }}
              placeholder={`${selStudent.name}에 대한 자유 메모...`}
              className="flex-1 h-9 rounded-lg border-[1.5px] border-gray-200 px-3 text-[13px] outline-none focus:border-primary-400" />
            <button onClick={sendRecord} disabled={!freeText.trim()}
              className={`w-9 h-9 rounded-lg border-none text-white flex items-center justify-center text-base flex-shrink-0 ${freeText.trim() ? 'bg-primary-500 cursor-pointer' : 'bg-gray-200'}`}>↑</button>
          </div>
        </div>
      ) : (
        /* CURRICULUM MODE */
        <div className="flex-1 overflow-y-auto py-2.5">
          {/* Subject */}
          <div className="mb-3">
            <div className="text-[11px] text-gray-400 font-semibold mb-1.5">📂 교과 선택</div>
            <div className="flex gap-1 flex-wrap">
              {allSubjects.map(s => {
                const has = !!curData[s]; const sel = selSubject === s;
                return (
                  <button key={s} onClick={() => { setSelSubject(s); setSelUnit(null); setSelStd(null); setPhrases([]); setSelectedPhrases([]); }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all
                      ${sel ? 'border-[1.5px] border-blue-600 bg-blue-50 text-blue-800' : 'border-[1.5px] border-gray-200 bg-white'}
                      ${has ? '' : 'opacity-40'} ${!sel && has ? 'text-gray-600' : ''} ${!sel && !has ? 'text-gray-300' : ''}`}>
                    {s}{!has && ' ⌛'}
                  </button>
                );
              })}
            </div>
            {selSubject && !curData[selSubject] && (
              <div className="mt-2 px-3 py-2 bg-yellow-50 rounded-lg text-[11px] text-yellow-700">⚠️ {selSubject} 교과의 성취기준 데이터는 아직 준비 중입니다. 자유 입력 모드를 이용해 주세요.</div>
            )}
          </div>

          {/* Unit */}
          {selSubject && curData[selSubject] && (
            <div className="mb-3">
              <div className="text-[11px] text-gray-400 font-semibold mb-1.5">📖 단원 선택</div>
              <div className="flex flex-col gap-1">
                {units.map(u => {
                  const sel = selUnit?.id === u.id;
                  return (
                    <button key={u.id} onClick={() => { setSelUnit(u); setSelStd(null); setPhrases([]); setSelectedPhrases([]); }}
                      className={`text-left px-3.5 py-2.5 rounded-lg cursor-pointer transition-all text-[13px]
                        ${sel ? 'border-[1.5px] border-blue-600 bg-blue-50 text-blue-800 font-semibold' : 'border border-gray-200 bg-white text-gray-600'}`}>
                      {u.name}<span className="text-[11px] text-gray-400 ml-1.5">({u.standards.length}개)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standards */}
          {selUnit && (
            <div className="mb-3">
              <div className="text-[11px] text-gray-400 font-semibold mb-1.5">🎯 성취기준</div>
              <div className="flex flex-col gap-1.5">
                {standards.map(st => {
                  const sel = selStd?.code === st.code;
                  return (
                    <button key={st.code} onClick={() => { setSelStd(st); setSelectedPhrases([]); setExtraMemo(''); generatePhrases(st); }}
                      className={`text-left px-3.5 py-3 rounded-lg cursor-pointer transition-all
                        ${sel ? 'border-2 border-primary-500 bg-primary-50' : 'border border-gray-200 bg-white'}`}>
                      <div className={`text-[10px] font-bold mb-0.5 ${sel ? 'text-primary-700' : 'text-gray-400'}`}>{st.code}</div>
                      <div className={`text-[12.5px] leading-relaxed ${sel ? 'text-primary-700' : 'text-gray-600'}`}>{st.text}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Phrases */}
          {selStd && (
            <div className="mb-3">
              <div className="text-[11px] text-gray-400 font-semibold mb-1.5">💡 관찰 문구 선택 <span className="font-normal text-gray-300">(클릭하여 추가)</span></div>
              {loadingPhrases ? (
                <div className="text-center py-5 text-gray-400 text-xs">
                  <span className="inline-block" style={{ animation: 'spin 1s linear infinite' }}>⏳</span> AI가 관찰 문구를 생성하고 있어요...
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {['상', '중', '하'].map(level => {
                    const items = phrases.filter(p => p.level === level);
                    if (items.length === 0) return null;
                    const lc = levelColors[level];
                    return (
                      <div key={level}>
                        <div className={`text-[10px] font-semibold mb-0.5 mt-1 ${lc.text}`}>{level === '상' ? '🟢 우수' : level === '중' ? '🔵 보통' : '🟠 노력 필요'}</div>
                        <div className="flex flex-wrap gap-1">
                          {items.map((p, i) => {
                            const sel = selectedPhrases.includes(p.phrase);
                            return (
                              <button key={i} onClick={() => togglePhrase(p.phrase)}
                                className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all
                                  ${sel ? `border-2 ${lc.border} ${lc.bg} ${lc.text} font-semibold` : 'border-[1.5px] border-gray-200 bg-white text-gray-600'}`}>
                                {sel ? '✓ ' : ''}{p.phrase}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-2 flex gap-1.5 items-center">
                    <button onClick={() => generatePhrases(selStd)} className="text-[11px] px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-500 cursor-pointer">🔄 다시 생성</button>
                  </div>
                  <input value={extraMemo} onChange={e => setExtraMemo(e.target.value)} placeholder="+ 추가 메모 (선택)"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) sendRecord(); }}
                    className="mt-1.5 w-full h-9 rounded-lg border-[1.5px] border-gray-200 px-3 text-xs outline-none focus:border-primary-400" />
                  {(selectedPhrases.length > 0 || extraMemo.trim()) && (
                    <div className="mt-2 p-3 bg-green-50/50 rounded-lg border-[1.5px] border-green-200">
                      <div className="text-[10px] text-gray-400 mb-1">📝 기록 미리보기</div>
                      <div className="text-[12.5px] text-gray-800 leading-relaxed">
                        <span className="text-gray-400 text-[10px]">[{selStd.code}]</span>{' '}
                        {[...selectedPhrases, extraMemo.trim()].filter(Boolean).join(', ')}
                      </div>
                      <button onClick={sendRecord}
                        className="w-full h-10 rounded-lg border-none bg-primary-500 text-white text-sm font-bold cursor-pointer mt-2.5 flex items-center justify-center gap-1.5 hover:bg-primary-600">
                        ✓ {selStudent.name} 기록 저장
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent (when no standard selected) */}
          {studentObs.length > 0 && !selStd && (
            <div className="mt-2">
              <div className="text-[11px] text-gray-400 font-semibold mb-1.5">최근 기록</div>
              <div className="flex flex-col gap-1.5">{studentObs.map(o => <ObsCard key={o.id} obs={o} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
