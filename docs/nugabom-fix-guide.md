# 누가봄 수정 요청사항 (Claude Code 참고 문서)

배포 주소: https://nugabom.vercel.app
프로젝트: Vite + React + Tailwind CSS + Dexie(IndexedDB) + Gemini 2.0 Flash API

---

## 수정 1: 자유 모드 빠른 해시태그 버튼 확장

### 현재 문제
`src/components/CurriculumInput.jsx`의 quickTags가 10개만 하드코딩되어 있음:
```js
const quickTags = [...allSubjects.slice(0, 5).map(s => '#' + s), '#자율', '#동아리', '#협동', '#발표', '#성장'];
```
→ 화면에 국어, 수학, 사회, 과학, 도덕, #자율, #동아리, #협동, #발표, #성장 만 표시됨

### 수정 요청
quickTags를 다음과 같이 변경:
- **교과 태그**: 해당 학년의 전체 교과 (allSubjects 전체 사용, .slice(0,5) 제거)
- **창체 태그**: #자율, #동아리, #진로
- **행동특성 태그**: #협동, #리더십, #발표, #배려, #노력, #태도, #성장, #교우관계

### 수정할 코드
**파일: `src/components/CurriculumInput.jsx`**
```js
// 변경 전
const quickTags = [...allSubjects.slice(0, 5).map(s => '#' + s), '#자율', '#동아리', '#협동', '#발표', '#성장'];

// 변경 후
const quickTags = [
  ...allSubjects.map(s => '#' + s),
  '#자율', '#동아리', '#진로',
  '#협동', '#리더십', '#발표', '#배려', '#노력', '#태도', '#성장', '#교우관계'
];
```

### 추가: TAG_MAP에 #교우관계 등록
**파일: `src/constants.js`**
TAG_MAP에 `#교우관계` 추가 필요 (현재는 `#교우`만 있음):
```js
// 기존 항목에 추가
'#교우관계': { domain: '행동특성', category: '교우관계' },
```

### 빠른 태그 UI 개선 (선택사항)
태그 수가 많아지므로, 영역별로 시각적 구분이 있으면 좋음:
- 교과 태그: 기본 스타일 (현재와 동일)
- 창체 태그: 초록 계열 배경 (#E8F5E9 등)
- 행동특성 태그: 주황 계열 배경 (#FFF3E0 등)

또는 태그가 2줄로 줄바꿈되도록 `flex-wrap: wrap` 적용 검토.

---

## 수정 2: 매뉴얼과 실제 앱의 일관성 확인

아래는 매뉴얼에 기재된 내용과 실제 앱 동작이 일치하는지 확인해야 할 항목들입니다.

### 해시태그 전체 목록 (매뉴얼 기준, 앱에서도 동일하게 동작해야 함)
| 해시태그 | 영역 | 세부 카테고리 |
|---------|------|-------------|
| #국어, #수학, #사회, #과학, #영어, #도덕, #체육, #음악, #미술, #실과 | 교과 | 각 교과명 |
| #바른생활, #슬기로운생활, #즐거운생활 | 교과 | 각 교과명 (1~2학년) |
| #자율, #자치 | 창체 | 자율자치 |
| #동아리 | 창체 | 동아리 |
| #진로 | 창체 | 진로 |
| #협동 | 행동특성 | 교우관계 |
| #리더십 | 행동특성 | 리더십 |
| #발표 | 행동특성 | 학습태도 |
| #배려 | 행동특성 | 교우관계 |
| #노력 | 행동특성 | 학습태도 |
| #태도 | 행동특성 | 학습태도 |
| #성장 | 행동특성 | 기타 |
| #교우 | 행동특성 | 교우관계 |
| #교우관계 | 행동특성 | 교우관계 ← **신규 추가** |
| #생활 | 행동특성 | 생활습관 |
| #정서 | 행동특성 | 정서 |

### 확인 포인트
1. **자유 모드 해시태그 버튼**: 위 태그 중 주요 항목이 빠른 태그 버튼으로 표시되는지
2. **해시태그 파싱**: 자유 모드에서 메모에 해시태그를 입력하면 자동 분류가 정상 동작하는지
3. **설정 탭 API 키**: Gemini API 키 입력란이 정상 표시되는지
4. **학년 변경 시**: 설정에서 학년을 변경하면 교과 목록과 성취기준이 해당 학년으로 전환되는지
5. **CSV 내보내기**: 나이스 정리 탭과 AI 초안 탭 양쪽에서 CSV 다운로드가 동작하는지

---

## 파일 구조 참고

```
src/
├── App.jsx                    # 메인 앱 (라우팅, 상태, apiKey 관리)
├── main.jsx                   # 엔트리포인트
├── index.css                  # Tailwind + 애니메이션
├── db.js                      # Dexie IndexedDB (observations, students, settings)
├── gemini.js                  # Gemini 2.0 Flash API 호출 헬퍼
├── constants.js               # TAG_MAP, TEMPLATES, PROHIBITED, 유틸리티
├── data/
│   └── curriculum.json        # 전학년(1~6) 성취기준 데이터
└── components/
    ├── UI.jsx                 # 공통 UI (Badge, Toast, Modal, Btn, StudentScroller)
    ├── Dashboard.jsx          # 📊 대시보드
    ├── StudentDetail.jsx      # 학생 상세 (대시보드에서 이동)
    ├── CurriculumInput.jsx    # ✏️ 기록 (교과 모드 + 자유 모드) ← quickTags 수정 필요
    ├── NaisReport.jsx         # 📋 나이스 정리
    ├── AIDraft.jsx            # 🤖 AI 초안 (개별 + 일괄)
    └── Settings.jsx           # ⚙️ 설정 (학급, 학생, API키, 데이터)
```

---

## 기술 스택
- React 18 + Vite 6
- Tailwind CSS 3
- Dexie.js (IndexedDB)
- Gemini 2.0 Flash API (`generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash`)
- vite-plugin-pwa (PWA / Service Worker)
- Vercel 배포
