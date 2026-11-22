# 무료 체스 스킨 10종

기본 스킨은 **로열 클래식**이다. 홈 → 꾸미기 → 말에서 아래 10종과 로열 클래식을 모두 별 0개부터 무료로 선택한다. 각 스킨을 선택한 뒤 **♞ 말 모션 보기**로 이동·공격·피격을 미리 볼 수 있다. 별이나 경험치에 따른 스킨 해금은 추가하지 않았다.

기존 SVG 스킨 7종은 공방·스킨 컬렉션·보상 목록에서 숨긴다. 해당 스킨을 사용하던 프로필, 프로필 전환, 기존 백업 불러오기는 로열 클래식으로 옮긴다. 기물 코드와 예전 스킨 ID는 백업 호환을 위해 보존한다. 이미 선택한 새 테마는 다시 열어도 유지한다.

[전체 갤러리](gallery.html) · [전체 미리보기 이미지](gallery.jpg) · [모바일 공방](workshop-mobile.png)

| 스킨 | 생성 요청문 | 백·흑 기물 미리보기 |
|---|---|---|
| 우주 탐사대 | [프롬프트](cosmic/image-prompt.txt) | [이미지](cosmic/preview.jpg) |
| 드래곤 왕국 | [프롬프트](dragon/image-prompt.txt) | [이미지](dragon/preview.jpg) |
| 심해 왕국 | [프롬프트](ocean/image-prompt.txt) | [이미지](ocean/preview.jpg) |
| 마법의 숲 | [프롬프트](forest/image-prompt.txt) | [이미지](forest/preview.jpg) |
| 동물 기사단 | [프롬프트](animals/image-prompt.txt) | [이미지](animals/preview.jpg) |
| 과자 왕국 | [프롬프트](sweets/image-prompt.txt) | [이미지](sweets/preview.jpg) |
| 얼음과 불꽃 | [프롬프트](elements/image-prompt.txt) | [이미지](elements/preview.jpg) |
| 고대 이집트 | [프롬프트](egypt/image-prompt.txt) | [이미지](egypt/preview.jpg) |
| 유령의 성 | [프롬프트](ghosts/image-prompt.txt) | [이미지](ghosts/preview.jpg) |
| 종이접기 왕국 | [프롬프트](origami/image-prompt.txt) | [이미지](origami/preview.jpg) |

## 제작

내장 `image_gen` 도구로 테마당 1회씩 **총 10회** 생성했다. 각 요청에 백·흑 12종 × 기본·공격·피격 3포즈를 6×6 시트 한 장으로 구성했다. 총 360포즈이며 추가 생성·API 호출은 없다. 각 폴더의 `source-atlas.png`에 1254×1254 투명 원본을 보존했다.

`node scripts/prepare-theme-sprites.cjs`는 ImageMagick으로 투명한 칸 경계를 측정하고, 기물 크기·받침 높이를 맞춰 1536×1536 WebP로 만든다. 생성 API는 호출하지 않는다. 테마별 런타임 시트는 `icons/skins/<id>/atlas.webp`에 있고 약 400~535 KiB다. `atlas-layout.json`은 분리 경계와 측정값을 기록한다. 기존 로열 클래식은 다시 생성하지 않았다.

공유 모션은 `js/skin-royal.js`, 새 테마 등록은 `js/skin-themes.js`에서 관리한다. SVG는 래스터 시트의 해당 칸을 잘라 보여 주는 창으로 사용한다. 기본·공격·피격 이미지를 바꾸고, 이동·점프·착지와 테마별 충격 색상·이동 흔적을 코드로 더한다. 과자는 탄성, 유령은 부유, 바다는 물결, 종이접기는 접힘 변형을 적용한다. 모션 끄기와 OS 동작 줄이기를 따른다.

## 검증

- 단위 테스트: 기본 스킨, 무료 선택, 기존 스킨 숨김, 예전 저장·백업 이행, 오프라인 자산.
- `tests/theme-skins-browser.cjs`: 360/768/1280px × 11종 = **33조합**, 36칸 이미지 확인, 무료 선택, 미리보기·실제 공격·피격, 숨김 목록, 프로필 기본값·기존 스킨 이행, 오프라인 11종. [결과](qa-results.json)
- 기존 `royal-browser`의 캐슬링·앙파상·승격·대면/뒤집힌 판·모션 끄기·화면 이탈 검사, `profiles-browser`의 백업·복원, `browser-smoke`의 학습·미니게임 회귀 검사.
