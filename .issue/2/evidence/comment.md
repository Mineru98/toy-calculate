## 작업 요약

E1 엔진에 후위 연산자 `%`(퍼센트)와 `!`(계승)를 추가했습니다. `x%` 는 항상 `x / 100` 이고, `!` 는 0 이상 정수에만 정의되며 음수·비정수는 `DOMAIN_ERROR`, 유한값을 넘으면 `OVERFLOW` 오류 결과를 돌려줍니다(예외 없음).
후위 연산자는 가장 강하게 결합합니다. `-3!` = -(3!), `2^3!` = 2^(3!), `3!^2` = (3!)^2.

## 검증 결과 비교

화면 변경이 없는 순수 로직이라 스크린샷 대신 로컬 검증 명령의 원본 출력을 증거로 남겼습니다. 이 저장소는 CI 가 없으므로 아래 출력이 merge 게이트입니다.

| 항목 | 전 | 후 |
| --- | ---: | ---: |
| `npm test` | 41 / 41 통과 | **77 / 77 통과** (+36) |
| `npm run typecheck` | exit 0 | exit 0 |
| `npm run build` | exit 0 | exit 0 |
| `50%` | `UNKNOWN_CHARACTER` | **0.5** |
| `200*10%` | `UNKNOWN_CHARACTER` | **20** |
| `5!` / `0!` | `UNKNOWN_CHARACTER` | **120 / 1** |
| `(-1)!` / `2.5!` | `UNKNOWN_CHARACTER` | **`DOMAIN_ERROR`** (position = `!` 위치) |
| `171!` | `UNKNOWN_CHARACTER` | **`OVERFLOW`** |
| `-3!` / `2^3!` / `3!^2` | `UNKNOWN_CHARACTER` | **-6 / 64 / 36** |
| `2^3^2` / `-2^2` (E1) | 512 / -4 | 512 / -4 |

원본 출력 (`.issue/2/evidence/`, probe 스크립트는 [probe.ts](https://github.com/Mineru98/toy-calculate/blob/main/.issue/2/evidence/probe.ts)):

- 전 — [test](https://github.com/Mineru98/toy-calculate/blob/main/.issue/2/evidence/before/test.txt) · [typecheck](https://github.com/Mineru98/toy-calculate/blob/main/.issue/2/evidence/before/typecheck.txt) · [build](https://github.com/Mineru98/toy-calculate/blob/main/.issue/2/evidence/before/build.txt) · [probe](https://github.com/Mineru98/toy-calculate/blob/main/.issue/2/evidence/before/probe.txt)
- 후 — [test](https://github.com/Mineru98/toy-calculate/blob/main/.issue/2/evidence/after/test.txt) · [test 케이스별](https://github.com/Mineru98/toy-calculate/blob/main/.issue/2/evidence/after/test-verbose.txt) · [typecheck](https://github.com/Mineru98/toy-calculate/blob/main/.issue/2/evidence/after/typecheck.txt) · [build](https://github.com/Mineru98/toy-calculate/blob/main/.issue/2/evidence/after/build.txt) · [probe](https://github.com/Mineru98/toy-calculate/blob/main/.issue/2/evidence/after/probe.txt)

## 완료 기준 대조

- [x] `50%`=0.5, `200*10%`=20, `5!`=120, `0!`=1 테스트 통과
- [x] `(-1)!`, `2.5!` → `DOMAIN_ERROR`, `171!`·`1000000000!`·`6!!`·`(10^400)!` → `OVERFLOW`, 모두 예외 없이 오류 결과 객체
- [x] 후위와 `^`·단항 마이너스 우선순위 고정: `-3!`=-6, `-50%`=-0.5, `2^3!`=64, `3!^2`=36, `2^-3!`=2^-6, `-2^2!`=-4
- [x] E1 41 케이스는 수정 없이 그대로 통과
- [x] `npm test`, `npm run typecheck`, `npm run build` 로컬 통과 (출력 첨부)

## 변경 파일

- `src/engine/result.ts` — 오류 코드 `DOMAIN_ERROR`, `OVERFLOW` 추가
- `src/engine/tokenize.ts` — `postfix` 토큰(`!`, `%`)
- `src/engine/parse.ts` — `postfix := primary ('!' | '%')*` 규칙, `power` 가 `postfix` 를 피연산자로 사용
- `src/engine/evaluate.ts` — `%` = /100, 계승 정의역·오버플로 검사
- `src/engine/engine.test.ts` — 후위 연산자 36 케이스 추가

## 해석한 부분

- `%` 는 계산기식 상대 해석(`100+10%`=110)이 아니라 항상 `/100` 입니다(`100+10%`=100.1). 이슈 예시 `50%`=0.5 와 `200*10%`=20 을 같은 규칙으로 만족합니다.
- 후위 연산자는 연쇄할 수 있습니다(`3!!`=720, `50%%`=0.005). 피연산자 자리에 오면(`!5`, `%`) `UNEXPECTED_TOKEN` 입니다.
- 후위 연산자가 2만 개 이어진 입력은 기존 규칙대로 `TOO_DEEP` 입니다.

## 리뷰 반영

- 별도 리뷰에서 `Infinity` 피연산자(`'9'×400 + '!'`, `(10^400)!`)의 계승이 `OVERFLOW` 가 아닌 `DOMAIN_ERROR` 로 나오는 것을 찾아 고쳤습니다(커밋 8325574). 두 입력을 테스트로 고정했습니다.

## 남은 이슈

- `'9'×400 + '%'`, `10^400` 처럼 `^`·큰 수 리터럴에서 생긴 `Infinity` 는 E1 기존 동작대로 성공 값으로 남습니다. 정의역 처리(E3) 범위로 남겼습니다.
