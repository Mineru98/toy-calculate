## 작업 요약

기본 화면(#7) 키패드 위에 공학용 키 15개(5열×3행: sin cos tan π e / asin acos atan ^ ! / log ln sqrt abs %)를 넣고, 디스플레이 왼쪽 위에 DEG/RAD 토글을 달았습니다.
함수 키는 `sin(` 처럼 여는 괄호까지 입력하고 `btn--function` 스타일을 씁니다. 각도 모드는 입력 상태(`CalcState.angleMode`, 기본 DEG)에 두고 `=` 에서 `calculate(expr, { angleMode })` 로 넘깁니다. 결과가 떠 있을 때 토글하면 같은 수식을 새 모드로 다시 평가합니다.
엔진·디자인 토큰(`src/engine/`, `src/styles/`)은 수정하지 않았습니다.

## 변경 전후 — 키패드

| 뷰포트 | 전 | 후 |
| --- | --- | --- |
| 1280 | ![키패드 1280 - 전](BEFORE_keypad-1280) | ![키패드 1280 - 후](AFTER_keypad-1280) |
| 360 | ![키패드 360 - 전](BEFORE_keypad-360) | ![키패드 360 - 후](AFTER_keypad-360) |

빨간 박스가 변경 구간입니다. 전에는 공학 키가 없어 박스는 `.calculator` 전체, 후에는 새로 생긴 `.calculator__scientific` 입니다.

## DEG/RAD · 정의역 오류 (1280px)

| 상태 | 전 | 후 |
| --- | --- | --- |
| DEG · `sin(90) =` | ![sin90 DEG - 전](BEFORE_sin90-deg-1280) | ![sin90 DEG - 후](AFTER_sin90-deg-1280) |
| 위 상태에서 RAD 로 토글 | ![sin90 RAD - 전](BEFORE_sin90-rad-1280) | ![sin90 RAD - 후](AFTER_sin90-rad-1280) |
| `sqrt(−1) =` | ![sqrt 음수 - 전](BEFORE_sqrt-neg-1280) | ![sqrt 음수 - 후](AFTER_sqrt-neg-1280) |

전에는 공학 키·토글이 없어 해당 상태를 만들 수 없으므로 기본 화면이고 박스는 `.calculator` 입니다. 후에는 DEG `1` → RAD `0.893996663600558`(`.calculator__display`), `sqrt(-1) 는 정의역 밖입니다`(`.calculator__result`)에 박스를 그렸습니다.

## 변경 파일

- `src/ui/input.ts` — `KeyId` 확장, `SCIENTIFIC_KEYS`(입력 문자열 `insert`), `CalcState.angleMode`, `=` 에 각도 모드 전달, `toggleAngleMode`, ⌫ 가 `sin(` 같은 함수 입력을 한 번에 지움, AC 는 각도 모드 유지
- `src/ui/input.test.ts` — 함수 키 `(` 입력, 상수·`^ ! %` 입력, 공학 수식 평가, 함수 ⌫, `sqrt(-1)` 오류, DEG/RAD 전달·토글 재평가·AC 모드 유지 테스트 추가(13 → 24건). 상태 모양(`angleMode` 추가)과 키 개수 단언은 새 구조에 맞게 갱신
- `src/ui/calculator.ts` — 각도 토글 버튼, 공학 키 그리드, 클릭 위임을 계산기 섹션 단위로
- `src/ui/calculator.css` — `.calculator__scientific` 5열 그리드, `.calculator__angle`. 기존 토큰만 사용

## 검증

- `npm test` (149 passed) / `npm run typecheck` / `npm run build` 로컬 통과 — 출력: [verify.txt](VERIFY_URL)
- Playwright 키패드 클릭: DEG `sin(90)` → `1`, 토글 RAD → `0.893996663600558`, `sqrt(−1)` → 오류 줄, `2^10+4!+50%+log(100)+ln(e)+abs(−π)` → `1054.64159265359`, 360px 가로 넘침 없음 (verify.txt)
- 뷰포트 1280x800 · 360x740, 라이트

## 남은 이슈

- 긴 결과(RAD `sin(90)` 등)는 #7 의 `overflow-wrap: anywhere` 그대로 두 줄로 접힙니다. 자릿수·글자 크기 조정은 범위 밖입니다.
- 엔진에 암시적 곱셈이 없어 `e` 바로 뒤에 함수 키를 누르면(`e sin 1 ) =`) 오류 문구가 `알 수 없는 함수: 'esin'` 으로 나옵니다. 계산값이 틀리거나 화면이 깨지지는 않으며, 엔진 계약은 이번 이슈에서 바꾸지 않았습니다.
- 키보드 입력(공학 키 포함)은 후행 이슈 범위입니다.
