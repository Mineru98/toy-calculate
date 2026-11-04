## 작업 요약

계산 엔진에 공학용 함수(sin cos tan asin acos atan log ln sqrt abs), 상수(pi/π, e), 각도 모드 옵션 `calculate(expr, { angleMode: 'DEG' | 'RAD' })` 를 추가했습니다.
정의역 밖 입력은 `DOMAIN_ERROR`, 알 수 없는 함수는 `UNKNOWN_FUNCTION` 오류 결과 객체로 돌려주며 예외를 던지지 않습니다.
이 변경은 순수 로직이라 화면 캡처 대신 테스트·빌드 출력을 증거로 남겼습니다.

## 변경 전후

| 지표 | 전 (`6312d07`) | 후 (`8efc581`) | 변화 |
| --- | ---: | ---: | ---: |
| `npm test` 통과 / 전체 | 41 / 41 | 89 / 89 | **+48** |
| `npm run typecheck` exit | 0 | 0 | - |
| `npm run build` exit | 0 | 0 | - |
| 프로브 19건 중 기대값 일치 | 1 | 19 | **+18** |

프로브 결과 (`.issue/3/evidence/probe.ts`):

| 입력 | 전 | 후 |
| --- | --- | --- |
| DEG `sin(90)` | UNKNOWN_CHARACTER | 1 |
| RAD `sin(π/2)` | UNKNOWN_CHARACTER | 1 |
| DEG `asin(1)` | UNKNOWN_CHARACTER | 90 |
| DEG `sin(180)` | UNKNOWN_CHARACTER | 0 |
| DEG `cos(60)` / `tan(45)` | UNKNOWN_CHARACTER | 0.5 / 1 |
| DEG `tan(90)` | UNKNOWN_CHARACTER | DOMAIN_ERROR |
| `log(1000)` / `ln(e)` / `sqrt(16)` / `abs(-3)` | UNKNOWN_CHARACTER | 3 / 1 / 4 / 3 |
| `sqrt(-1)` / `log(0)` / `ln(-1)` | UNKNOWN_CHARACTER | DOMAIN_ERROR |
| DEG `asin(2)` / `acos(-2)` | UNKNOWN_CHARACTER | DOMAIN_ERROR |
| `foo(1)` | UNKNOWN_CHARACTER | UNKNOWN_FUNCTION |
| `2+3*4` (E1) | 14 | 14 |

원본 출력: [before](../tree/main/.issue/3/evidence/before) · [after](../tree/main/.issue/3/evidence/after)

## 결정 사항

- 각도 모드를 생략하면 `RAD` 로 평가합니다. UI 는 토글 값을 명시해서 넘깁니다.
- 부동소수 규칙은 삼각·역삼각 결과에만 적용합니다. |x| < 1e-12 이면 0, 그 밖에는 15 유효숫자로 맞춥니다. 그래서 DEG `sin(180)`=0, `cos(60)`=0.5, `asin(0.5)`=30 이 됩니다.
- `tan` 은 cos 가 위 규칙으로 0 이 되는 지점에서 `DOMAIN_ERROR` 입니다(DEG 90, RAD π/2).
- 함수 이름은 소문자만 인식합니다. 암시적 곱셈은 지원하지 않습니다(`2pi` → UNEXPECTED_TOKEN).
- 모르는 이름이 `(` 앞에 오면 `UNKNOWN_FUNCTION`, 그렇지 않으면 E1 과 같이 `UNKNOWN_CHARACTER` 입니다(`2a` 테스트 유지).

## 변경 파일

- `src/engine/functions.ts` — 함수 표, 각도 변환, 정의역 검사, 삼각 결과 정리 (신규)
- `src/engine/tokenize.ts` — 이름·π 토큰
- `src/engine/parse.ts` — 상수와 `f(expr)` 호출 노드
- `src/engine/evaluate.ts` / `index.ts` — 각도 모드 옵션 전달, `AngleMode`·`CalcOptions` export
- `src/engine/result.ts` — `DOMAIN_ERROR`, `UNKNOWN_FUNCTION`
- `src/engine/engine.test.ts` — 테스트 48건 추가 (E1 단언은 그대로)

## 검증

- `npm test` 89/89, `npm run typecheck`, `npm run build` 로컬 통과 (출력은 `.issue/3/evidence/after/`)
- 별도 리뷰 결과, 예외가 새는 경로나 E1 회귀는 없었습니다.

## 남은 이슈

- E1 부터 있던 문제: `^` 결과가 NaN/Infinity 여도 성공으로 반환됩니다(`(0-8)^(1/3)`, `10^400`). 이 이슈 범위 밖이라 그대로 두었습니다.
- 1e-12 보다 작은 삼각 결과는 0 이 됩니다(예: `sin(0.0000000000001)`). 위 결정의 대가입니다.
- 런타임에 타입 밖의 `angleMode`(예: `'deg'`)를 넘기면 RAD 로 계산됩니다. TypeScript 타입으로는 막혀 있습니다.
