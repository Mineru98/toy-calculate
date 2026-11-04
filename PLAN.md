# 기획: 글래스모피즘 공학용 계산기

## 목표

브라우저에서 동작하는 공학용 계산기. 프레임워크 없이 Vite + TypeScript 로 만든다.
배경 위에 반투명 유리 패널(backdrop-filter blur, 얇은 밝은 테두리, 부드러운 그림자)을 얹는 글래스모피즘 디자인을 쓴다.

## 범위

1. 계산 엔진 (`src/engine/`)
   - 문자열 수식을 토큰화·파싱·평가한다. `eval`/`Function` 은 쓰지 않는다.
   - 사칙연산, 괄호, 연산자 우선순위, 거듭제곱(`^`, 우결합), 단항 마이너스, 퍼센트, 계승(`!`).
   - 함수: sin cos tan asin acos atan, log(상용) ln, sqrt, abs. 상수: π, e.
   - 각도 모드 DEG/RAD.
   - 잘못된 수식·0 으로 나누기·정의역 밖 입력은 예외 대신 결과 객체로 오류를 돌려준다.
   - vitest 단위 테스트.
2. 글래스모피즘 디자인 시스템 (`src/styles/`)
   - CSS 변수 토큰(색, blur, 테두리, 그림자, 반경, 간격), 그라디언트 배경, `.glass` 패널, 버튼 변형(숫자·연산자·함수·강조).
   - 라이트/다크(prefers-color-scheme), `backdrop-filter` 미지원 브라우저 대체 배경, 포커스 링, `prefers-reduced-motion`.
3. 계산기 화면과 입력 (엔진·디자인 시스템 이후)
   - 디스플레이(수식 줄 + 결과 줄), 공학용 키패드, DEG/RAD 토글, AC/⌫/=.
   - 키보드 입력(숫자, 연산자, Enter, Backspace, Escape).
   - 360px 폭 모바일부터 데스크톱까지 반응형.
4. 계산 기록 패널 (화면 이후)
   - 최근 계산 목록, 항목 클릭 시 수식 재사용, 전체 삭제, localStorage 보존.
5. 메모리 기능 (화면 이후)
   - MC, MR, M+, M-, 메모리 값 표시, localStorage 보존.

## 의존 관계

- 1, 2 는 서로 독립.
- 3 은 1·2 가 merge 된 뒤.
- 4, 5 는 3 이 merge 된 뒤, 서로 독립.

## 검증

- `npm test`, `npm run typecheck`, `npm run build` 통과.
- 화면 작업은 브라우저 스크린샷을 증거로 남긴다.
- CI(GitHub Actions)는 쓰지 않는다. 로컬 검증과 증거가 게이트다.
