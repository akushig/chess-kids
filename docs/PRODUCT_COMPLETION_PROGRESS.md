# 제품 완성도 작업 진행 기록

2026-11-04 · 빌드 `2026.11.04.1`. [설계](PRODUCT_COMPLETION_DESIGN.md), [콘텐츠 명세](PRODUCT_CONTENT_CATALOG.md), [별도 출시 준비](DEFERRED_RELEASE_READINESS.md).

## 구현 상태

| 단계 | 상태 | 변경과 근거 |
|---|---|---|
| 설계/보관 | 완료 | 코드 변경 전에 설계·호환 계약·완료 기준·보관 범위 작성 |
| A 진행 신뢰성 | 구현·단위 검증 완료 | 메뉴 기본 이어하기, 별도 새 판 확인, 선택 화면은 저장을 유지. 없는 종류의 저장판이 다른 마지막 놀이로 대체되던 기본 인자 버그도 수정. 기본 다음은 선택 도전을 건너뜀 |
| B 보드/공통 팝업 | 구현·브라우저 검증 완료 | 실제 깃발·목표 말 배지, 이동 점과 분리. 모험 완료/선택/가족/꾸미기를 공통 반응형 팝업으로 통일. 배경 inert·Tab·Escape·초점 복원. 캐슬링 확인 후 중복 토스트 제거, 말 두 개 표시와 다시 보기 유지 |
| C 시작/메뉴/도움 | 구현·브라우저 검증 완료 | 경험 3종 선택, 신규 나이트 3점프, 기존 설정/판과 전체 투어 보존. 길찾기 기본/목표별 이동 수 도전으로 구분. 자동 음성과 독립된 수동 듣기. 음성 미지원 안내 |
| D 콘텐츠 편집 | 구현·풀이 검증 완료 | 룩 포함 48과제 전체 기술 메타데이터. 나머지 5기물의 첫 6단계 4×4→이후 5×5, 처음 3단계 한 수 성공. 기본/선택 도전 분리. 모험 파/해결 가능성/실제 입력 재생 검사. 한 수 발견 15+반대 배치 15=30. 연습 상대의 현재/다음 그림과 실제 대전과의 차이 설명 |
| E 성장/연결 | 구현·단위 검증 완료 | 가족/보상 화면 기술별 도움·함께·혼자 완료 요약. 퍼즐 미완료 장면 추천, 모험 다음/연관 놀이. 공통 미니게임 완료·다음·종료·보상 연결. 첫 잡기 피드백, 초보 짧은 대전 추천, 신규 어른 표준 꾸미기 |
| F 통합 검수 | 자동·화면 검수 완료 | 단위 68/68 및 전체 8개 브라우저 검사 묶음 통과. 360/768/1280 화면과 오프라인 검수, 신규 이용 동선·수동 음성·미지원 음성·취소 후 시계 재개 포함 |

## 수정 파일과 재개 지점

- 저장/다음 활동/기술 요약: `js/app-session.js`. `activitySaved(kind)`는 저장이 없으면 반드시 `null`을 전달해야 한다. `getSavedSession(undefined)`는 마지막 판으로 폴백하므로 구별한다.
- 교육 데이터: `js/content-curriculum.js`. `missions.js` 적용 후 원래 명세를 `LEGACY_MISSIONS`에 보관한다. `missionSpec`과 `curriculumVersion:2`로 새/이전 판을 구분하며 undo에도 이관한다. 기존 별/ID를 삭제하지 않는다.
- 공통 팝업/보드 고정: `app-core.js`, `style.css`. 대전 이벤트는 타이머/AI 정지 계약 때문에 별도 유지한다. 공통 확인 창 Escape/X 취소 시 가족 대전 시계도 재개한다.
- 진입/성장/설정: `app-home.js`, `mini-menu.js`; 과제/완료/표시: `app-adventure.js`, `app-puzzle.js`, 각 미니게임; 듣기/키보드: `app-accessibility.js`.
- 신규 검사: `tests/product-completion.test.cjs`, `tests/product-completion-browser.cjs`. 기존 나이트 새 사용자 기본값과 편집된 왕 위험 과제 좌표, 캐슬링 확인 후 중복 토스트 제거에 해당하는 기대값만 새 계약으로 변경했다.

## 최종 검증 결과

- `npm test`: 68/68 통과, 모험 48개 및 퍼즐 30개 풀이 포함.
- 기존 브라우저: 스모크, 360/768/1280+오프라인, 나이트 전체 경로/갈림길, 보드 고정 156상황 통과. 캐슬링 24가지 실행 조합, 막힘/짧은 판/안내, 10단계 AI Worker, 대전 필수 안내/종료/타이머 정지 검사도 통과했다.
- 신규 제품 동선은 360×780/768×1024/1280×900 통과. 과제 시작→완료→기본 경로 종료 후 관련 놀이→나이트 짧은 산책→메뉴 복귀→새 판 취소→동일 판 재시도→전체 경로→가족/꾸미기 팝업→퍼즐 목표/다음 장면. 메뉴 카드 너비 통일·제목/버튼 대비 보강 후에도 통과했다. 자동 음성 꺼짐에서 수동 듣기, 음성 미지원 안내, 가족 대전 되돌리기 창을 Escape로 취소할 때 시계 재개도 확인했다.
- Chromium 경로: `/Users/akushi/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell`.
- 명령: `CHESS_BROWSER_EXECUTABLE=<위 경로> npm run test:browser` (로컬 서버 `127.0.0.1:8765`). 화면 증거는 `/tmp/chess-product-qa`, 기존 검사는 각각 `/tmp/chess-*-qa`.
- 작업 전 main HEAD는 `3896ef4`. 설계 커밋 `896ace4`, 구현 커밋 `1ebeec4`. 2026-11-04 사용자 배포 요청에 따라 `08aca5b`까지 origin/main에 푸시했다. [GitHub Pages 빌드·배포](https://github.com/akushig/chess-kids/actions/runs/41818112899)가 성공했고, [공개 사이트](https://akushig.github.io/chess-kids/)에서 `2026.11.04.1` 제공을 확인했다. 공개 주소를 대상으로 신규 이용 흐름을 360×780/768×1024/1280×900에서 재검사하여 모두 통과했다.

## 화면 증거

[첫 룩 과제](product-review/product-completion/rook-mobile.png), [완료 팝업](product-review/product-completion/completion-mobile.png), [놀이터 메뉴](product-review/product-completion/playground-mobile.png), [3개 화면 결과](product-review/product-completion/results.json). 최종 빌드 `2026.11.04.1`. 코드 수정 전 증거는 `product-review/public-release/`에 별도로 보관한다.

## 남은 외부 검증

기능 구현과 실제 어린이가 즐겁게 쓰는지의 검증은 구분한다. 아이 혼자 첫 성공·막힘 복구·이어하기·체크 해결·다음/종료 선택, 부모 시범 후 같은 판, 성인의 반복 도전을 관찰하고 실제 이탈 지점을 바탕으로 조정해야 한다. 아동 관찰·장기 교육 효과·Android 실기기·Play 제출을 수행했다고 보고하지 않는다.

기존 미추적 `icons/skins/`는 사용자 자산이므로 수정/스테이징하지 않았다. 별도 출시 준비는 보관 문서의 미완료 항목으로 남겨둔다.
