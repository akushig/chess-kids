# 2026-10-25 개발 검수

검수 빌드: `2026.10.25.6` · Node 20 · Playwright 1.64.1 / Chromium headless

| 검사 | 결과 |
|---|---|
| Node 회귀 검사 | 37개 통과 |
| 모든 모험의 경로·최단 수·실제 입력 재생 | 48단계 통과 |
| 수집·폭탄의 해결 경로와 최고 보상 | 각 5단계 통과 |
| 성 지키기 승리 경로와 적 중복 점유 | 4단계 통과 |
| 왕 지키기 미래 안전과 깃발 목표 해결 | 4단계 통과 |
| 나이트 짧은 목표·완주·되돌리기·가족 같은 판 | 통과 |
| 독립 라이브러리와 퍼즐 전체 정답 비교 | 15문제 통과 |
| 앱·AI의 합법수 대조 | python-chess로 생성한 98국면 일치 |
| 초기 배치 perft depth 3 | 8,902개 일치 |
| 저장·재개·기록 이관·내용 재배열·애니메이션 중 종료 | 통과 |
| 실제 브라우저 화면과 입력 | 360×780, 768×1024, 1280×900 통과 |
| 게임 진행 중 보드 위치·크기 고정 | 3개 화면 폭 × 52개 시나리오 통과 |
| 오프라인 새로고침·전체 스킨·Worker 컴퓨터 응수 | 통과 |

[게임 중 보드 위치 고정 검수](board-layout/README.md) · [나이트 투어 UX 수정 검수](knight-tour/README.md) · [브라우저 결과 JSON](browser-results.json) · [독립 퍼즐 대조 결과](puzzle-results.txt)

## 검수 화면

[모바일 홈](home-mobile.png) · [모바일 체크 도움](check-mobile.png) · [태블릿 체크 도움](check-tablet.png)

## 재현

프로젝트 루트에서 `npm test`. 브라우저 검수는 개발 서버를 실행한 뒤 `npm run test:browser`를 사용한다. 기존 브라우저 경로를 지정하거나 Playwright의 Chromium을 설치할 수 있다. 자세한 설치 절차는 루트 [README](../../README.md)에 있다.

독립 퍼즐 대조:

```sh
python3 -m venv /tmp/chess-rules
/tmp/chess-rules/bin/python -m pip install chess==1.11.2
node scripts/export-content.cjs | /tmp/chess-rules/bin/python scripts/verify-puzzles.py
```

98국면 데이터는 [chess-positions.json](../../tests/fixtures/chess-positions.json)에 저장했다. 생성기는 [create-rule-fixtures.py](../../scripts/create-rule-fixtures.py)이며 앱의 규칙 구현과 독립적인 python-chess를 사용한다.

## 실제 이용으로 확인할 항목

이 기록은 코드 실행·Chromium 화면·입력 검수다. 실제 어린이나 성인을 관찰한 사용자 테스트, 실물 iOS/Android PWA, 설치된 한국어 음성의 품질과 오프라인 가용성을 검증했다는 의미는 아니다. 초기 설계의 성공률·도움 빈도 목표는 사용성 테스트 후 조정한다.
