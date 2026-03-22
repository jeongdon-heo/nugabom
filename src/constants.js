export const GRADE_SUBJECTS = {
  1: ['국어', '수학', '바른생활', '슬기로운생활', '즐거운생활'],
  2: ['국어', '수학', '바른생활', '슬기로운생활', '즐거운생활'],
  3: ['국어', '수학', '사회', '과학', '도덕', '체육', '음악', '미술', '영어'],
  4: ['국어', '수학', '사회', '과학', '도덕', '체육', '음악', '미술', '영어'],
  5: ['국어', '수학', '사회', '과학', '도덕', '체육', '음악', '미술', '영어', '실과'],
  6: ['국어', '수학', '사회', '과학', '도덕', '체육', '음악', '미술', '영어', '실과'],
};

export const DOMAIN_COLORS = {
  '창체': { bg: '#E8F5E9', border: '#66BB6A', text: '#2E7D32' },
  '교과': { bg: '#E3F2FD', border: '#42A5F5', text: '#1565C0' },
  '행동특성': { bg: '#FFF3E0', border: '#FFA726', text: '#E65100' },
};

export const TAG_MAP = {};
['국어','수학','사회','과학','영어','도덕','체육','음악','미술','실과','바른생활','슬기로운생활','즐거운생활']
  .forEach(s => TAG_MAP['#' + s] = { domain: '교과', category: s });
Object.assign(TAG_MAP, {
  '#자율': { domain: '창체', category: '자율자치' },
  '#자치': { domain: '창체', category: '자율자치' },
  '#동아리': { domain: '창체', category: '동아리' },
  '#진로': { domain: '창체', category: '진로' },
  '#협동': { domain: '행동특성', category: '교우관계' },
  '#리더십': { domain: '행동특성', category: '리더십' },
  '#발표': { domain: '행동특성', category: '학습태도' },
  '#배려': { domain: '행동특성', category: '교우관계' },
  '#성장': { domain: '행동특성', category: '기타' },
  '#노력': { domain: '행동특성', category: '학습태도' },
  '#태도': { domain: '행동특성', category: '학습태도' },
  '#교우': { domain: '행동특성', category: '교우관계' },
  '#생활': { domain: '행동특성', category: '생활습관' },
  '#정서': { domain: '행동특성', category: '정서' },
});

export const TEMPLATES = [
  { group: '📚 학습', items: ['적극 발표','또래 도움','과제 성실','심화 탐구','창의적 표현','문제 해결','집중력 우수','자기주도 학습'] },
  { group: '🤝 사회성', items: ['갈등 조절','양보 배려','모둠 주도','경청 존중','규칙 준수','협동 참여'] },
  { group: '🌱 성장', items: ['자신감 향상','참여도 개선','꾸준한 노력','태도 변화','흥미 증가','책임감 성장'] },
];

export const PROHIBITED = [
  { re: /[가-힣]+초등학교|[가-힣]+학교/, msg: '학교명 기재 불가' },
  { re: /학원|과외|사교육|학습지/, msg: '사교육 관련 기재 불가' },
  { re: /아버지.*직업|어머니.*직업|부모.*직위/, msg: '부모 사회·경제적 지위 관련 기재 불가' },
  { re: /교외.*대회|외부.*수상|전국.*대회/, msg: '교외 수상 실적 기재 불가' },
  { re: /천재|최고의|가장 뛰어|압도적|완벽한/, msg: '과장된 표현 지양' },
];

export const DEFAULT_STUDENTS = [
  '김민준','이서연','박지호','최수아','정예준','강하은','조도윤','윤시우',
  '임서윤','한주원','오지민','장하린','송민서','류건우','홍채원','문태현',
  '배유나','신지안','권서현','양현우','구은서','전승민','남다은','황지율','백서준',
].map((name, i) => ({
  id: `s${i + 1}`,
  number: i + 1,
  name,
  gender: i % 2 === 0 ? '남' : '여',
}));

// Utility functions
export function parseHashtags(text) {
  let domain = null, category = null, cleanText = text;
  const keys = Object.keys(TAG_MAP).sort((a, b) => b.length - a.length);
  for (const tag of keys) {
    if (text.includes(tag)) {
      domain = TAG_MAP[tag].domain;
      category = TAG_MAP[tag].category;
      cleanText = cleanText.replace(tag, '').trim();
      break;
    }
  }
  return { domain, category, memo: cleanText };
}

export function fmtDate(d) {
  const x = new Date(d);
  return `${x.getMonth() + 1}/${x.getDate()}`;
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function checkProhibited(text) {
  return PROHIBITED.filter(p => p.re.test(text)).map(p => p.msg);
}
