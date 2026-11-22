# Codex CLI 이미지 생성과 스프라이트 아틀라스 재사용 가이드

여러 자산을 **한 번의 이미지 생성 요청으로 한 장에 배치한 뒤**, 로컬에서 분리해 재사용하는 방법이다. 이 프로젝트의 체스 스킨은 **스킨당 1회 → 백·흑 12종 × 기본·공격·피격 3포즈 = 36칸**으로 제작했다. 생성 요청문과 투명 원본을 보존해, 크기 조정·압축·미리보기 변경에는 다시 생성하지 않았다.

확인일: **2026-11-22**. 로컬 `codex-cli 0.171.0`의 도움말과 `image_generation` 기능 표시, 설치된 `imagegen` 스킬, 실제 저장소 코드를 확인했다. 버전·계정·실행 환경에 따라 제공 도구가 달라질 수 있으므로 새 세션에서는 도구 사용 가능 여부부터 확인한다. 문서 작성 중 새 이미지 생성이나 유료 API 요청은 실행하지 않았다.

## 1. 다음 세션에 바로 전달할 지시

프로젝트 루트에서 Codex를 실행하고 다음을 붙여 넣는다. 생성할 테마와 새 ID는 실제 작업에 맞게 바꾼다.

```text
docs/IMAGE_GENERATION_WORKFLOW.md를 읽고 같은 방식으로 작업해줘.
새 체스 스킨의 ID는 demo-v1, 주제는 ‘파스텔 종이 공예’야.
imagegen 스킬과 세션의 내장 이미지 생성 도구를 사용해줘.
생성 요청은 최대 1회, 결과는 투명한 6열×6행 아틀라스 한 장으로 구성해줘.
docs/imagegen/prompts/chess-atlas-template.txt를 바탕으로 그림체와 두 진영의
팔레트를 바꾸되, 36칸의 순서와 역할·포즈 규칙은 유지해줘.
호출 전에 최종 요청문을 docs/theme-skins/demo-v1/image-prompt.txt에 저장하고,
생성 후 원본을 같은 폴더의 source-atlas.png로 복사해줘.
먼저 전체 36칸을 검수한 뒤 로컬에서 분리·정렬·WebP 변환해줘.
기존 자산을 덮어쓰지 말고, 생성이 실패하거나 도구가 없으면 상태를 알려줘.
추가 생성이나 별도 API 비용이 드는 방식으로 자동 전환하지 마.
```

이미 생성한 자산의 재가공만 필요하다면 “이미지 생성 없이 기존 원본만 사용”이라고 명시한다. 다른 프로젝트에서는 이 문서와 [요청문 템플릿 폴더](imagegen/prompts/)를 함께 복사하고 저장 경로·분리 코드를 바꾼다.

## 2. Codex CLI에서 생성 요청하기

### 실행 환경 확인

```sh
codex --version
codex --help
codex exec --help
codex features list
```

이 환경에서는 `image_generation stable true`가 표시됐다. 이 표시나 `imagegen` 스킬 파일의 존재만으로 모든 세션에 실제 생성 도구가 제공된다고 단정할 수는 없다. Codex에게 사용 가능한 도구를 확인하게 한다. 스킬은 작업 지침이고, 생성 도구는 실제 실행 수단이다.

로그인이 필요하면 `codex login`을 사용한다. 설치·로그인과 일반 사용법은 [공식 Codex CLI 문서](https://learn.chatgpt.com/docs/codex/cli)를 참고한다.

### 대화형 요청

프로젝트 루트에서 실행한다. 작은따옴표를 사용해야 셸이 `$imagegen`을 환경변수로 해석하지 않는다.

```sh
codex -C . '$imagegen docs/IMAGE_GENERATION_WORKFLOW.md를 읽고, 먼저 내장 이미지 생성 도구의 사용 가능 여부를 확인해줘. 새 체스 스킨 demo-v1을 파스텔 종이 공예 스타일로 만들어줘. 최대 1회 생성으로 투명한 6x6 아틀라스 한 장을 만들고 요청문과 원본을 보존해줘. 기존 파일 덮어쓰기나 추가 생성은 하지 마.'
```

`codex image generate` 같은 전용 하위 명령을 가정하지 않는다. 여기서는 Codex 에이전트에게 자연어로 요청하고 에이전트가 생성 도구를 사용한다. `-i` / `--image`는 **입력 참고 이미지 첨부** 옵션이다.

```sh
codex -C . -i docs/theme-skins/pixel/preview.png \
  '$imagegen 첨부 이미지는 색감 참고용이야. 기존 캐릭터를 복제하지 말고, docs/IMAGE_GENERATION_WORKFLOW.md의 6x6 규격으로 새로운 스킨 demo-reference-v1을 설계해줘. 생성은 최대 1회로 제한하고 원본과 최종 요청문을 보존해줘.'
```

참고 이미지를 사용할 때는 색감·그림체 참고인지, 일부만 수정할 편집 대상인지 명시한다. 편집은 유지할 요소도 함께 적는다.

### 파일/표준 입력으로 반복 실행

긴 프롬프트는 파일이나 작은따옴표로 감싼 here-document로 전달하면 줄바꿈과 `$`를 보존할 수 있다. 다음 명령을 실행하면 **실제 생성 작업이 시작될 수 있다**.

```sh
codex exec -C . --sandbox workspace-write - <<'PROMPT'
$imagegen
docs/IMAGE_GENERATION_WORKFLOW.md를 읽어줘.
docs/imagegen/prompts/chess-atlas-template.txt를 사용해 demo-cli-v1 스킨을 만들어줘.
내장 이미지 생성 도구 사용 가능 여부를 먼저 확인해줘.
생성 요청은 최대 1회, 투명한 6x6 시트 한 장으로 제한해줘.
최종 요청문과 원본을 docs/theme-skins/demo-cli-v1/에 저장하고 전체 36칸을 검수해줘.
기존 파일이 있으면 덮어쓰지 말고 새 버전 경로를 사용해줘.
도구가 없거나 실패하면 추가 생성 또는 별도 API로 자동 전환하지 마.
PROMPT
```

같은 지시를 `task.txt`에 저장했다면 `codex exec -C . --sandbox workspace-write - < task.txt`로 전달한다. `codex exec` 한 번과 이미지 생성 호출 한 번은 다르다. 에이전트가 반복 생성하지 않도록 **이미지 도구 호출 횟수**를 요청에 적는다. 셸 실행 허용 범위는 환경 정책을 따르며, 예제 때문에 권한 제한을 해제할 필요는 없다. 표준 입력 방식은 [공식 비대화형 실행 문서](https://learn.chatgpt.com/docs/non-interactive-mode#advanced-stdin-piping)에 설명되어 있다.

## 3. 내장 도구와 별도 API 방식 구분

| 방식 | 실행 | 비용/인증 | 이 프로젝트에서의 사용 |
|---|---|---|---|
| Codex 내장 이미지 생성 | Codex가 세션의 `image_gen` 도구 사용 | 별도 `OPENAI_API_KEY` 없이 사용 가능한 환경이 있음. Codex 사용량에 반영 | 실제 스킨 원본 생성에 사용 |
| `imagegen` 스킬의 Python CLI | 설치된 `scripts/image_gen.py` 실행 | API 키·네트워크 필요, 별도 API 사용량 | 이번 스킨 제작에는 사용하지 않음 |
| 로컬 후처리 | ImageMagick + Node 스크립트 | 이미지 생성 호출 없음 | 분리·정렬·WebP·미리보기 제작 |

공식 문서는 CLI에서 `$imagegen`으로 스킬을 호출하는 방법과 내장 생성의 Codex 사용량 반영을 설명한다. **무료로 무제한 생성된다는 뜻은 아니다.** [공식 이미지 생성 안내](https://learn.chatgpt.com/docs/image-generation)

내장 도구를 사용하는 에이전트의 호출 개념은 아래와 같다. 셸 명령이나 모든 환경에 동일한 SDK 함수라는 뜻은 아니다. 이 세션에 제공된 도구 인자는 `prompt`와 `transparent_background`이며, 정확한 도구 이름과 지원 인자는 해당 세션의 정의를 따른다.

```json
{
  "prompt": "완성한 6x6 스프라이트 시트 요청문 전체",
  "transparent_background": true
}
```

신규 생성에는 편집용 참고 이미지 인자를 넣지 않는다. 픽셀 크기·모델·출력 경로 등 API용 옵션을 내장 도구에 임의로 추가하지 않는다.

내장 결과는 기본적으로 `$CODEX_HOME/generated_images/...` 아래에 저장될 수 있다. **도구가 실제로 돌려준 경로를 확인한 뒤** 프로젝트로 복사한다. 도구의 파일 경로 저장을 요청하는 것과 실제 도구에 출력 경로 인자가 존재하는 것은 다르다. 게임이 개인 Codex 폴더를 직접 참조하지 않도록 한다.

### 별도 API CLI가 필요한 경우

사용자가 API 방식과 비용을 명시적으로 선택했을 때만 진행한다. 아래는 설치 경로·인자 확인과 **요청을 보내지 않는 dry-run** 예제다. API 실행·추가 패키지 설치는 하지 않는다.

```sh
IMAGEGEN_CLI="${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/image_gen.py"
python3 "$IMAGEGEN_CLI" generate --help
python3 "$IMAGEGEN_CLI" generate \
  --prompt 'One 4x4 contact sheet of sixteen simple fruit icons on a plain light background, each isolated in its own cell, no text.' \
  --n 1 \
  --out output/imagegen/fruit-sheet.png \
  --dry-run
```

스킬 설치 위치가 다르면 `SKILL.md`에서 실제 스크립트를 찾는다. 실제 실행에는 로컬 환경의 `OPENAI_API_KEY`와 필요한 패키지가 필요하며, 키를 채팅이나 저장소에 붙여 넣지 않는다. `--dry-run`을 빼면 API 호출이 발생한다.

모델·투명 배경·크기 지원은 내장 도구와 Python 래퍼에서 다르다. 확인 시점의 번들 스크립트는 `gpt-image-2`의 투명 배경 옵션을 거부하므로, 공식 API의 새 기능을 그대로 사용할 수 있다고 가정하지 않는다. 투명 아틀라스가 목적이면 현재 스킬·스크립트의 검증 규칙과 [공식 API 가이드](https://developers.openai.com/api/docs/guides/image-generation)를 확인한다. 모델을 자동으로 바꾸거나 래퍼를 임의로 수정하지 않는다.

## 4. 한 이미지에 여러 자산을 넣는 설계

### 아틀라스와 여러 이미지 출력은 다르다

| 요청 | 결과 | 적합한 용도 |
|---|---|---|
| “6×6 시트 한 장, 정확히 36개 스프라이트” | 여러 자산을 담은 이미지 **1장** | 동일 테마의 기물·아이콘·포즈를 함께 제작 |
| `n=36` | 별도의 출력 이미지 여러 장을 요청 | 한 프롬프트의 여러 후보 생성 |
| `generate-batch`에 여러 작업 입력 | 여러 생성 작업 | 서로 다른 주제·프롬프트를 각각 생성 |

아틀라스에는 **한 테마 안에서 관련된 자산**을 묶는다. 다섯 테마를 한 시트에 모두 밀어 넣으면 칸당 해상도가 줄고 그림체가 섞일 수 있다. 이 프로젝트에서는 테마당 한 장이 품질·일관성·요청 횟수를 함께 관리하기 좋았다. 36칸은 실제 사용 사례이지 모델의 최대 지원 개수가 아니다.

### 반드시 고정할 요소

1. **행·열·총 개수:** `C × R = N`. “여러 개” 대신 정확한 개수를 적는다.
2. **칸별 목록:** 각 행의 왼쪽→오른쪽 순서와 행의 위→아래 의미를 적는다.
3. **공통 그림체:** 매체, 선, 재질, 시점, 조명, 팔레트를 구체적으로 지정한다.
4. **정렬:** 칸 가운데 정렬, 발/받침 기준선, 기물별 높이 차이를 지정한다.
5. **안전 여백:** 왕관·귀·발·잔광·기울어진 자세까지 칸 안에 들어오게 한다.
6. **실제 투명도:** 알파 배경을 요구하고, 체크무늬를 그림으로 그리지 않게 한다.
7. **금지 요소:** 글자·칸 번호·격자선·판·바닥·장면·분리된 소품·외부 파티클을 제외한다.
8. **포즈 일관성:** 같은 기물의 얼굴·형태·색을 유지하고 포즈만 바꾼다.

상세 시트는 실제 표시 크기로 검수한다. 높은 해상도의 원본에서도 40px로 줄였을 때 킹과 퀸을 구분하지 못하면 게임 자산으로는 부족하다.

## 5. 체스용 6×6 규격과 요청문

열 순서는 모든 행에서 **킹(K)·퀸(Q)·룩(R)·비숍(B)·나이트(N)·폰(P)**이다.

| 위에서부터 행 | 진영 | 포즈 | 코드의 행 번호 |
|---|---|---|---|
| 1 | 백 / 밝은 팀 | 기본 idle | 0 |
| 2 | 흑 / 어두운 팀 | 기본 idle | 1 |
| 3 | 백 | 공격 attack, 오른쪽으로 기울임 | 2 |
| 4 | 흑 | 공격 attack, 오른쪽으로 기울임 | 3 |
| 5 | 백 | 피격 hit, 왼쪽으로 물러남 | 4 |
| 6 | 흑 | 피격 hit, 왼쪽으로 물러남 | 5 |

복사해서 사용할 기본 요청문은 [chess-atlas-template.txt](imagegen/prompts/chess-atlas-template.txt)에 있다. 먼저 `STYLE`과 진영 팔레트를 고치고, 역할의 구별 표식과 위 배치는 유지한다. 다양한 매체의 실제 요청문은 [픽셀](theme-skins/pixel/image-prompt.txt)·[네온](theme-skins/neon/image-prompt.txt)·[수묵](theme-skins/ink/image-prompt.txt)·[탱그램](theme-skins/tangram/image-prompt.txt)·[팝아트](theme-skins/comic/image-prompt.txt)를 참고한다.

다른 용도의 예제는 [4×4 아이콘 시트 템플릿](imagegen/prompts/icon-atlas-template.txt)이다. 이 템플릿의 16개 과일 목록을 필요한 아이콘 목록으로 바꾸되, 행별 개수와 총 개수를 맞춘다. **4×4 시트에는 이 프로젝트의 6×6 체스 분리 스크립트를 그대로 사용하지 않는다.**

새 테마를 확실히 다르게 만들려면 색만 바꾸지 말고 **매체·윤곽·재질·비례·얼굴 유무·그림자·동작**까지 바꾼다. 예를 들어 픽셀은 각진 가장자리와 제한된 색, 네온은 속이 비치는 발광 선, 수묵은 거친 먹선과 여백, 탱그램은 도형 조합을 지정한다. “더 예쁘게”보다 이런 시각적 조건을 적는 것이 재사용하기 쉽다.

## 6. 생성 후 보존·분리·정렬

### 보존할 파일

```text
docs/theme-skins/<id>/
  image-prompt.txt       # 도구에 전달한 최종 요청문
  source-atlas.png       # 실제 생성 원본, 알파 보존
  atlas-layout.json     # 분리 경계와 기물 측정값
  preview.jpg           # 백·흑 기본 12종, 확인용 배경 포함
icons/skins/<id>/
  atlas.webp            # 게임이 사용하는 정규화 시트
```

원본은 유지하고 파생 파일을 만든다. 생성 요청에서 2048px를 희망해도 실제 도구 결과가 그 크기라고 가정하지 않는다. 기존 스킨의 원본은 **1254×1254**, 정규화한 런타임은 **1536×1536 = 256px × 6칸**이었다. 원본을 확대해도 새로운 세부 묘사가 생기는 것은 아니다.

```sh
magick identify -format '%wx%h %[channels] opaque=%[opaque]\n' \
  docs/theme-skins/pixel/source-atlas.png
```

PNG 확장자나 체크무늬 미리보기만으로 알파가 있다고 판단하지 않는다. 투명 영역과 실제 기물 픽셀이 모두 존재하는지 확인한다. 그림으로 그린 격자 배경, 전체가 빈 이미지, 일부만 불투명한 실패 결과도 직접 검수한다.

### 이 저장소의 로컬 후처리

Node.js와 ImageMagick의 `magick` 명령이 필요하다. 프로젝트 루트에서 **기존 원본으로 다시 처리할 테마만 명시**한다. 아래 명령은 기존 파생 자산을 다시 쓰지만 이미지 생성은 하지 않는다.

```sh
node scripts/prepare-theme-sprites.cjs pixel
```

[prepare-theme-sprites.cjs](../scripts/prepare-theme-sprites.cjs)는 다음을 수행한다.

1. 원본 크기와 알파를 읽고, 행 사이 투명 여백으로 행 경계를 찾는다.
2. **각 행마다 따로 열 경계**를 찾는다. AI가 그린 칸은 완전한 등간격이 아닐 수 있다.
3. 칸의 알파 경계로 실루엣을 측정하고, 여백을 남겨 잘라낸다.
4. 기물별 크기와 받침 위치를 맞춰 256×256 셀에 놓는다. 기본 포즈를 기준으로 공격·피격 크기를 맞춘다.
5. 6×6 WebP, 기본 12종 미리보기, 측정 JSON을 저장한다.

단순히 원본을 6등분하면 발이나 왕관이 잘리거나 옆 칸 조각이 섞일 수 있다. 이전 제작에서 이 문제를 줄이기 위해 전역 열 경계 대신 **행별 열 경계**를 사용했다. 빈 여백 탐지도 완벽한 기물 인식은 아니므로 전체 시트를 육안으로 확인한다.

픽셀 테마는 최근접 보간과 무손실 WebP를 사용한다. 네온은 발광 외곽 여백을 넓힌다. JPEG 미리보기는 확인용이고, 투명도가 필요한 게임 원본으로 쓰지 않는다. 새 테마의 재질에 따라 크기·여백·필터 설정을 조정한다.

정규화 후에는 셀 위치가 정확해진다. 예를 들어 백 나이트 기본 포즈는 열 4·행 0이다.

```sh
magick icons/skins/pixel/atlas.webp \
  -crop 256x256+1024+0 +repage /tmp/chess-pixel-white-knight.png
```

### 새 ID를 연결할 때

- 분리 스크립트는 허용 ID를 검사한다. 새 ID를 해당 배열에 추가하고 크기·미리보기 배경을 정한 뒤 실행한다. `node scripts/prepare-theme-sprites.cjs new-id`만으로 자동 등록되지는 않는다.
- [skin-themes.js](../js/skin-themes.js)의 `registerSpriteThemes()`를 사용하는 테마 목록에 추가한다. [skin-graphic.js](../js/skin-graphic.js)가 예제다. 별도 목록이면 `index.html`의 스크립트 로딩과 `FREE_SPRITE_THEMES` 집계에도 연결한다.
- [skin-royal.js](../js/skin-royal.js)는 래스터 시트의 칸을 SVG `viewBox`로 보여 준다. `col × 256`, `row × 256`, `256 × 256`으로 선택하고, 새 기물 벡터를 다시 그리지 않는다.
- `sw.js`에 새 시트·새 스크립트를 추가하고 캐시 버전을 갱신한다. 이 프로젝트에서는 모든 스킨을 무료로 등록하고 로열 클래식을 기본값으로 유지한다.
- 스킨 수를 늘리면 `tests/theme-skins.test.cjs`, `tests/theme-skins-browser.cjs`, `tests/coach-store.test.cjs`의 목록·개수도 갱신한다.

## 7. 적은 포즈로 움직임 만들기

한 시트의 기본·공격·피격 3포즈는 매끄러운 영상의 모든 프레임이 아니다. 게임에서는 **위치 이동·점프·회전·크기 변화·잔상·충격 효과를 코드로 만들고**, 공격·피격 순간에 해당 포즈로 바꾼다. 이 방식으로 수십 장의 프레임을 각각 생성하는 일을 줄였다.

기본 구현은 `animateRoyalMove()`와 `royalSetPose()`다. 픽셀·탱그램은 단계적 이동과 단단한 형태, 젤리는 탄성, 구름은 부유처럼 매체에 맞춰 움직인다. 단단한 도형을 젤리처럼 찌그러뜨리지 않는다. 앱의 모션 끄기와 OS의 동작 줄이기를 적용하고, 화면 이동·모달 닫기·되돌리기 때 임시 애니메이션을 정리한다.

## 8. 검수와 요청 횟수 관리

검수 순서는 **생성 원본 전체 → 분리된 36칸 → 실제 40px 기물 → 공방의 12종 → 실제 잡기 모션 → 오프라인**이다.

- 6열·6행에 모두 올바른 기물이 있는가? 킹/퀸, 비숍/폰을 서로 바꿔 그리지 않았는가?
- 두 진영이 구분되고, 같은 기물의 3포즈에서 정체성이 유지되는가?
- 왕관·발·귀·잔광이 잘리지 않고 옆 칸 조각이나 분리된 파티클이 섞이지 않는가?
- 흰색·검은색·실제 체스판 배경에서 외곽과 색이 읽히는가?
- 공격·피격 전환과 취소 후에 원래 포즈로 돌아오고 임시 요소가 남지 않는가?

현재 테마를 재가공한 경우의 검증 예:

```sh
npm test
# npm run dev로 개발 서버를 실행한 뒤, 별도 터미널에서:
CHESS_THEME_IDS='pixel,neon,ink,tangram,comic' node tests/theme-skins-browser.cjs
npm run test:workshop
```

브라우저 검사는 Playwright와 Chromium이 필요하다. 기존 브라우저를 쓰면 `CHESS_BROWSER_EXECUTABLE`, 서버를 바꾸면 `CHESS_TEST_URL`을 지정한다. 자세한 환경 설정은 [프로젝트 README](../README.md#검증)를 따른다.

| 발견한 문제 | 먼저 할 일 |
|---|---|
| 크기·받침 높이·파일 용량·미리보기 배경 | 원본으로 로컬 재가공 |
| 이웃 조각이 섞임, 발·왕관이 잘림 | 행별 경계와 여백 측정 확인 |
| 기물 자체가 누락되거나 역할을 잘못 그림 | 실패 내용을 기록하고 필요한 경우에만 제한된 추가 생성/편집 |
| 작은 화면에서 너무 복잡함 | 실루엣·표식·장식을 단순화한 요청문으로 수정 |
| 생성 도구가 없음 | 세션의 도구·스킬·버전 확인, 별도 API는 사용자 선택 후 사용 |

“한 시트에 많이 넣기”는 호출 횟수를 줄이는 전략이다. 해상도·품질·재시도와 서비스의 과금 방식까지 포함한 실제 비용 절감률을 보장하지는 않는다. **최대 호출 횟수, 사용 방식, 최종 요청문, 원본, 재생성 이유**를 기록해야 다음 세션에서도 같은 예산 원칙으로 반복할 수 있다.

## 9. 참고 자료

- [공식 이미지 생성 / CLI와 imagegen 스킬](https://learn.chatgpt.com/docs/image-generation): 내장 생성 호출과 사용량 설명.
- [공식 Codex CLI](https://learn.chatgpt.com/docs/codex/cli) · [비대화형 실행](https://learn.chatgpt.com/docs/non-interactive-mode): CLI 실행·이미지 입력·표준 입력.
- 설치된 `imagegen/SKILL.md`와 `references/cli.md`: 현재 환경의 내장/별도 API 구분, 저장 경로, Python CLI 규칙. 일반적인 설치 위치는 `${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/`이며 환경에 따라 다를 수 있다.
- [로열 클래식 제작 기록](royal-classic/README.md) · [첫 테마 10종](theme-skins/README.md) · [귀여운 5종](theme-skins/PLAYFUL.md) · [그래픽 5종](theme-skins/GRAPHIC.md): 실제 원본·최종 요청문·검수 결과.
