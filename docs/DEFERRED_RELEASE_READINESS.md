# 별도 보관: 스토어·Android 출시 준비

2026-11-04 사용자 요청에 따라 제품 완성도 작업에서 분리했다. 삭제/완료 처리한 항목이 아니다. 원래 근거와 링크는 [전체 검토 5~8절](PUBLIC_RELEASE_REVIEW.md)에 있다. 정책·버전 요건은 실제 착수 시 최신 공식 자료로 다시 확인한다.

- [ ] 스킨·캐릭터·명칭·스토어 이미지의 사용 권한 증빙 확인 또는 공개 자산 교체 방침 결정. (2026-11-08: 헬로카봇·티니핑·배달의민족 스킨은 앱 판(`window.ChessKidsStore`가 있을 때)에서 숨기도록 했다. 출시 전 파일 자체를 빼거나 권리를 확인한다.)
- [ ] 인앱 결제: `docs/PREMIUM_COURSE.md` §5의 `window.ChessKidsStore` 다리 구현, 스토어 상품 5개 등록(course_all·course_stage1~3·coach_full)과 가격, 구매 복원 확인, 보호자 확인(곱셈) 화면 실기기 확인.
- [ ] 대상 연령/Families/IARC, 개인정보처리방침·문의처·Data safety, 실제 외부 통신/SDK 검토.
- [ ] 두 기기 대전(`docs/TWO_DEVICE_PLAY.md` §6): 웹뷰 카메라 권한(Android·iOS), `#net=` 링크 딥 링크, 공유 시트, 개인정보처리방침에 공개 STUN(Google·Cloudflare)과 기기 간 직접 연결·주고받는 정보(이름·아이콘·수) 설명, 외부 코드 고지(qrcode-generator MIT, jsQR Apache-2.0), 실제 휴대폰 두 대로 같은 방·멀리서(와이파이/LTE) 확인.
- [ ] 개발자 계정 요건, 서명·패키지 ID·AAB·대상 API·비공개 테스트·스토어 자료.
- [ ] Capacitor 포함형 번들 또는 TWA 선택. TWA라면 도메인 루트 Digital Asset Links 권한 확인.
- [ ] 네이티브 Preferences/기록 이동, 시스템 뒤로가기, 생명주기와 AI·타이머·승격·안내 복원.
- [ ] 첫 설치 오프라인, 번들/SW 업데이트 분리, 로컬 폰트, insets·회전·분할 화면·WebView 하한.
- [ ] Android TTS, 저사양 AI 성능·발열, 강제 종료/업데이트 후 기록, TalkBack 및 실기기 검수.

이 체크리스트가 미완료인 동안 Google Play 출시 가능/승인 완료로 표현하지 않는다. 온라인 대전·채팅·랭킹·계정은 별도 후속 기획이며 이번 제품 개선의 필수 의존성이 아니다.
