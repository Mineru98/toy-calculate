## 작업 요약

`src/engine/` 에 화면과 분리된 계산 엔진을 만들었습니다. 수식 문자열을 토큰화 → 재귀 하강 파싱 → AST 평가하며 `eval` / `new Function` 은 쓰지 않습니다.
공개 함수 `calculate(expr): CalcResult` 는 예외를 던지지 않고, 성공이면 `{ ok: true, value }`, 실패면 `{ ok: false, error: { code, message, position? } }` 를 돌려줍니다. 이 타입이 후행 이슈(#2, #3, #7)의 공통 계약입니다.

## 검증 결과 비교

화면 변경이 없는 순수 로직이라 스크린샷 대신 로컬 검증 명령의 원본 출력을 증거로 남겼습니다. 이 저장소는 CI 가 없으므로 아래 출력이 merge 게이트입니다.

| 항목 | 전 | 후 |
| --- | ---: | ---: |
| `npm test` | 테스트 파일 없음 (0개) | **41 / 41 통과** |
| `npm run typecheck` | exit 0 | exit 0 |
| `npm run build` | exit 0 | exit 0 |
| `src/engine/` | 없음 | 6개 파일 |
| `eval` / `new Function` grep | 매치 없음 | 매치 없음 |

원본 출력 (`.issue/1/evidence/`):

- 전 — [test](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/before/test.txt) · [typecheck](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/before/typecheck.txt) · [build](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/before/build.txt) · [engine 파일](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/before/engine-files.txt) · [eval grep](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/before/no-eval.txt)
- 후 — [test](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/after/test.txt) · [test 케이스별](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/after/test-verbose.txt) · [typecheck](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/after/typecheck.txt) · [build](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/after/build.txt) · [engine 파일](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/after/engine-files.txt) · [eval grep](https://github.com/Mineru98/toy-calculate/blob/main/.issue/1/evidence/after/no-eval.txt)

## 완료 기준 대조

- [x] `2+3*4`=14, `(2+3)*4`=20, `2^3^2`=512, `-2^2`=**-4** 를 테스트로 고정 (거듭제곱이 단항 마이너스보다 먼저. `(-2)^2`=4, `2^-2`=0.25)
- [x] 괄호 불일치 `MISMATCHED_PARENTHESIS`, 연산자 연속 `UNEXPECTED_TOKEN`, 빈 입력 `EMPTY_INPUT`, 알 수 없는 문자 `UNKNOWN_CHARACTER`, 0 으로 나누기 `DIVISION_BY_ZERO` — 모두 예외 없이 오류 결과
- [x] `CalcResult` / `CalcSuccess` / `CalcFailure` / `CalcError` / `CalcErrorCode` 를 `src/engine/index.ts` 에서 export
- [x] 소스에 `eval` / `new Function` 없음 (grep 출력 첨부)
- [x] `npm test`, `npm run typecheck`, `npm run build` 로컬 통과 (출력 첨부)

## 변경 파일

- `src/engine/result.ts` — 결과 객체 타입과 오류 코드
- `src/engine/tokenize.ts` — 숫자(소수)·연산자·괄호 토큰화
- `src/engine/parse.ts` — 재귀 하강 파서 (우선순위·`^` 우결합·단항 마이너스)
- `src/engine/evaluate.ts` — AST 평가, 0 나누기 검사
- `src/engine/index.ts` — 공개 함수 `calculate` 와 타입 export
- `src/engine/engine.test.ts` — vitest 41 케이스

## 해석한 부분

- 단항 마이너스는 피연산자 자리 어디서나 허용합니다(`2*-3`=-6, `2--3`=5). 그 밖의 연속(`2+*3`, `2**3`, `*2`, `2+`)이 "연산자 연속" 오류입니다.
- 단항 플러스와 암시적 곱셈(`2(3)`)은 지원하지 않아 오류입니다.
- 재귀 한계를 넘는 깊은 중첩(괄호 2만 겹 등)은 `TOO_DEEP` 오류 결과로 돌려줍니다. 별도 리뷰에서 이 경우 예외가 새는 것을 찾아 고쳤습니다.

## 남은 이슈

- `0^-1`, `10^400` 같은 오버플로는 `Infinity`, `(-8)^(1/3)` 은 `NaN` 이 성공 값으로 나옵니다. 계획대로 정의역 처리(E3)에서 다룰 범위로 남겼습니다.
- `0*-1` 의 결과가 `-0` 입니다. 화면 표시(`String(-0)` = `"0"`)에는 영향이 없습니다.
