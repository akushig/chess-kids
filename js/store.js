// 유료 콘텐츠 권한 (docs/PREMIUM_COURSE.md §6)
// 실제 판매는 앱(인앱 결제)으로 감쌀 때 연결한다. 앱 쪽은 window.ChessKidsStore를 제공한다:
//   getProducts(): Promise<[{id, price, title}]>   getOwned(): Promise<string[]>(상품 ID)
//   purchase(id): Promise<{owned: string[]}>       restore(): Promise<{owned: string[]}>
// 웹(지금 공개 주소)에는 결제가 없다. 웹은 '미리보기'로 모든 콘텐츠를 열어 두고, 앱에서 잠기는 모습은 보호자 화면에서 켜 볼 수 있다.
// 구매 권한은 프로필 파일(백업)에 넣지 않는다. 이 기기의 모든 프로필이 함께 쓴다(전역 저장 키).
const STORE_PRODUCTS = {
  course_all: { title: '승급 과정 전체 (1~3단계)', detail: '세 단계 12주제 180판 · 무한 연습 · 승급 시험과 수료증', grants: ['course_stage1', 'course_stage2', 'course_stage3'], best: true },
  course_stage1: { title: '승급 과정 1단계 · 두 수로 이기기', detail: '두 수 메이트 3주제 · 두 수로 말 얻기 · 1단계 시험', grants: ['course_stage1'] },
  course_stage2: { title: '승급 과정 2단계 · 끝내기 달인', detail: '퀸·룩·두 룩·폰 끝내기 · 2단계 시험', grants: ['course_stage2'] },
  course_stage3: { title: '승급 과정 3단계 · 첫 수부터 잘 두기', detail: '가운데·말 꺼내기·캐슬링·초반 함정 · 3단계 시험', grants: ['course_stage3'] },
  coach_full: { title: '내 대국 코치', detail: '대국마다 살펴볼 장면 모두 · 지난 대국 20판 다시 보기', grants: ['coach_full'] },
};
const STORE_OWNED_KEY = 'chess_store_owned_v1', STORE_PREVIEW_KEY = 'chess_store_preview_locked';
let storeOwnedCache = null, storePrices = {};
function storeBridge() { return typeof window !== 'undefined' && window.ChessKidsStore && typeof window.ChessKidsStore.purchase === 'function' ? window.ChessKidsStore : null; }
// native: 앱 안(인앱 결제) · preview: 웹 미리보기(모두 열림) · locked: 웹에서 앱의 잠금 모습 보기
function storeMode() {
  if (storeBridge()) return 'native';
  let locked = false;
  try { locked = /[?&]store=locked\b/.test(window.location?.search || '') || localStorage.getItem(STORE_PREVIEW_KEY) === '1'; } catch {}
  return locked ? 'locked' : 'preview';
}
function storeOwnedProducts() {
  if (storeOwnedCache) return storeOwnedCache;
  let list = [];
  try { const v = JSON.parse(localStorage.getItem(STORE_OWNED_KEY) || '[]'); if (Array.isArray(v)) list = v.filter(id => Object.hasOwn(STORE_PRODUCTS, id)); } catch {}
  return storeOwnedCache = list;
}
function storeSetOwned(list) {
  storeOwnedCache = [...new Set((list || []).filter(id => Object.hasOwn(STORE_PRODUCTS, id)))];
  try { localStorage.setItem(STORE_OWNED_KEY, JSON.stringify(storeOwnedCache)); } catch {}
}
// 권한(entitlement): course_stage1~3, coach_full
function storeOwns(entitlement) {
  const mode = storeMode();
  if (mode === 'preview') return true;
  if (mode === 'locked') return false;
  return storeOwnedProducts().some(id => STORE_PRODUCTS[id].grants.includes(entitlement));
}
function storeProductsFor(entitlement) { return Object.keys(STORE_PRODUCTS).filter(id => STORE_PRODUCTS[id].grants.includes(entitlement)); }
// 앱을 열 때 한 번: 앱이 알려 주는 구매 목록과 가격을 받아 둔다(인터넷이 없으면 지난 목록을 쓴다).
function storeRefresh() {
  const bridge = storeBridge(); if (!bridge) return Promise.resolve();
  return Promise.all([bridge.getOwned?.().then(storeSetOwned).catch(() => {}), bridge.getProducts?.().then(list => { storePrices = Object.fromEntries((list || []).filter(p => STORE_PRODUCTS[p?.id]).map(p => [p.id, String(p.price || '')])); }).catch(() => {})]);
}
function storePriceLabel(id) { return storeMode() === 'native' ? storePrices[id] || '가격 확인 중' : '앱에서 표시'; }

// ===== 보호자 확인 =====
// 구매·복원·잠금 미리보기 같은 보호자 기능은 어른만 풀 수 있는 곱셈 문제를 먼저 낸다(아동용 앱 스토어 정책).
let storeGateAnswer = 0, storeGateNext = null;
function storeParentGate(next, purpose = '보호자 화면') {
  const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
  storeGateAnswer = a * b; storeGateNext = next;
  showActivityDialog('보호자 확인', `<p>${purpose}은 보호자가 열어 주세요.</p><form id="store-gate" class="store-gate" onsubmit="event.preventDefault();storeGateCheck()"><label for="store-gate-input"><b>${a} × ${b}</b> = ?</label><input id="store-gate-input" inputmode="numeric" autocomplete="off" maxlength="3" aria-describedby="store-gate-error" /><p id="store-gate-error" role="alert"></p><button class="action-btn green" type="submit">확인</button></form>`, [{ label: '닫기', action: () => {} }], 'store-gate-overlay');
  document.getElementById('store-gate-input')?.focus?.({ preventScroll: true });
}
function storeGateCheck() {
  const input = document.getElementById('store-gate-input'), value = Number(String(input?.value || '').trim());
  if (value !== storeGateAnswer) { const e = document.getElementById('store-gate-error'); if (e) e.textContent = '답이 달라요. 보호자에게 부탁해 주세요.'; return; }
  const next = storeGateNext; storeGateNext = null; closeActivityDialog(false); next?.();
}

// ===== 구매 화면 =====
// focus: 보여 줄 권한(예: course_stage2). 그 권한을 주는 상품을 위에 둔다.
function openStoreSheet(focus) { storeParentGate(() => storeSheet(focus), '구매 화면'); }
function storeSheet(focus) {
  const mode = storeMode(), ids = Object.keys(STORE_PRODUCTS).sort((a, b) => (focus && STORE_PRODUCTS[b].grants.includes(focus)) - (focus && STORE_PRODUCTS[a].grants.includes(focus)));
  const owned = id => storeOwnedProducts().includes(id) || STORE_PRODUCTS[id].grants.every(g => mode === 'native' && storeOwns(g));
  const note = mode === 'native' ? '결제는 앱 스토어 계정으로 처리돼요. 한 번 사면 이 기기의 모든 프로필에서 쓸 수 있어요. 구독이 아니라 한 번 구매예요.'
    : '지금은 웹 미리보기라 결제가 없어요. 앱으로 출시하면 이 화면에서 구매해요. 웹에서는 모든 콘텐츠를 미리 써 볼 수 있어요.';
  const rows = ids.map(id => { const p = STORE_PRODUCTS[id]; return `<div class="store-row${p.best ? ' best' : ''}"><div class="store-row-text"><strong>${p.title}${p.best ? ' <b class="store-best">추천</b>' : ''}</strong><small>${p.detail}</small></div><button class="action-btn ${owned(id) ? 'secondary' : 'green'}" onclick="storeBuy('${id}')" ${owned(id) || mode !== 'native' ? 'disabled' : ''}>${owned(id) ? '구매함' : mode === 'native' ? storePriceLabel(id) : '앱에서 구매'}</button></div>`; }).join('');
  showActivityDialog('보호자 · 구매와 복원', `<p class="store-note">${note}</p><div class="store-list">${rows}</div><p class="section-note">무료: 체스 수업 15주제 전체, 대전·놀이터·모험, 승급 과정 단계마다 첫 주제와 주제마다 처음 3판, 대국 코치의 첫 장면.</p>`,
    [{ label: '닫기', action: () => {} }, { label: '구매 복원', action: storeRestoreRequest }], 'store-overlay');
}
function storeBuy(id) {
  const bridge = storeBridge(); if (!bridge || !STORE_PRODUCTS[id]) return;
  bridge.purchase(id).then(r => { if (r?.owned) storeSetOwned(r.owned); storeAfterChange('구매가 완료됐어요. 고마워요!'); }).catch(() => storeAfterChange('구매를 마치지 못했어요. 결제되지 않았다면 다시 시도해 주세요.'));
}
function storeRestoreRequest() {
  const bridge = storeBridge();
  if (!bridge) return showActivityDialog('구매 복원', '<p>웹 미리보기에는 구매 기록이 없어요. 앱에서 같은 스토어 계정으로 복원할 수 있어요.</p>', [{ label: '닫기', action: () => {} }]);
  bridge.restore().then(r => { storeSetOwned(r?.owned || []); storeAfterChange('구매 기록을 다시 불러왔어요.'); }).catch(() => storeAfterChange('복원하지 못했어요. 인터넷 연결을 확인해 주세요.'));
}
function storeAfterChange(message) {
  showActivityDialog('보호자 · 구매와 복원', `<p>${message}</p>`, [{ label: '확인', action: () => { if (state.screen === 'course') renderCourseHome?.(); else if (state.screen === 'home') renderHome(); } }]);
}
// 웹 미리보기에서 앱의 잠금 모습을 켜고 끈다(보호자 화면에서).
function storeTogglePreview() {
  try { if (localStorage.getItem(STORE_PREVIEW_KEY) === '1') localStorage.removeItem(STORE_PREVIEW_KEY); else localStorage.setItem(STORE_PREVIEW_KEY, '1'); } catch {}
  storeOwnedCache = null;
}
// 잠긴 콘텐츠를 눌렀을 때: 무엇이 들어 있는지 보여 주고, 보호자에게 부탁하게 한다(아이에게 바로 결제 버튼을 보이지 않는다).
function storeLockedDialog(entitlement, what) {
  const ids = storeProductsFor(entitlement), product = STORE_PRODUCTS[ids.find(id => STORE_PRODUCTS[id].grants.length === 1) || ids[0]];
  showActivityDialog('🔒 보호자와 함께 열어요', `<p><b>${what}</b>은 ${product ? product.title : '유료 콘텐츠'}에 들어 있어요.</p><p class="section-note">무료로 할 수 있는 판도 많아요. 열고 싶으면 보호자에게 보여 주세요.</p>`,
    [{ label: '보호자에게 보여 주기', action: () => openStoreSheet(entitlement) }, { label: '닫기', action: () => {} }], 'store-locked-overlay');
}
