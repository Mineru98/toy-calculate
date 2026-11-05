## 작업 요약

계산기·기록 패널이 모든 폭에서 308px 로 고정돼 있던 것을 768px 이상 키 64px, 1024px 이상 키 72px 로 키워 패널 폭이 함께 커지게 했습니다(308 → 340 → 372px).
44px 미만이던 터치 대상(공학 키·메모리 키 42px, 각도 토글 29px, 기록 전체 삭제 30px)을 모두 44px 이상으로 맞췄습니다.
긴 수식은 디스플레이 안에서 3줄까지 보이고 넘치면 스크롤하며, 입력할 때마다 마지막 줄이 보이도록 했습니다. 360px 가로 스크롤은 변경 전후 모두 없습니다.

## 변경 전후 — 기본(라이트)

| 전 | 후 |
| --- | --- |
| ![360px 기본 - 전](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/default-360.webp) | ![360px 기본 - 후](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/default-360.webp) |
| ![768px 기본 - 전](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/default-768.webp) | ![768px 기본 - 후, 패널 340px](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/default-768.webp) |
| ![1280px 기본 - 전](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/default-1280.webp) | ![1280px 기본 - 후, 패널 372px](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/default-1280.webp) |

빨간 박스가 변경 구간입니다. 계산기 패널(폭), 디스플레이(각도 토글 높이·긴 수식), 공학 키(높이 44px 이상)를 before/after 같은 셀렉터로 표시했습니다.

<details>
<summary>긴 수식 입력 후 = (3장 · 라이트)</summary>

| 전 | 후 |
| --- | --- |
| ![360px 긴 수식 - 전, 수식 4줄로 디스플레이가 늘어남](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/long-360.webp) | ![360px 긴 수식 - 후, 3줄 높이 안에서 스크롤·마지막 줄 표시](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/long-360.webp) |
| ![768px 긴 수식 - 전](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/long-768.webp) | ![768px 긴 수식 - 후](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/long-768.webp) |
| ![1280px 긴 수식 - 전](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/long-1280.webp) | ![1280px 긴 수식 - 후](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/long-1280.webp) |

</details>

<details>
<summary>다크 모드 (3장)</summary>

| 전 | 후 |
| --- | --- |
| ![360px 다크 - 전](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/dark-360.webp) | ![360px 다크 - 후](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/dark-360.webp) |
| ![768px 다크 - 전](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/dark-768.webp) | ![768px 다크 - 후](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/dark-768.webp) |
| ![1280px 다크 - 전](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/dark-1280.webp) | ![1280px 다크 - 후](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/dark-1280.webp) |

</details>

## 실측 (Playwright, 360×800 · 768×1024 · 1280×800)

| 항목 | 전 | 후 |
| --- | ---: | ---: |
| 문서 가로 스크롤 (scrollWidth − clientWidth) | 0 / 0 / 0 | **0 / 0 / 0** |
| 계산기 패널 폭 (px) | 308 / 308 / 308 | **308 / 340 / 372** |
| 44px 미만 버튼 수 (라이트·다크 동일) | 21 / 21 / 21 | **0 / 0 / 0** |
| 키 사각형 겹침 · 패널 밖으로 나간 키 | 0 · 0 | **0 · 0** |
| 긴 수식 줄 높이 (scrollHeight / 보이는 높이, 360px) | 108 / 108 (상한 없음) | **120 / 90 (3줄 상한, 스크롤)** |

원본: [before/measure.txt](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/measure.txt) · [after/measure.txt](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/measure.txt)

## 변경 파일

- `src/styles/tokens.css` — `--size-touch: 44px` 토큰, 768px·1024px 브레이크포인트에서 `--size-btn`(64·72px)과 1024px 이상 `--font-size-btn` 조정
- `src/ui/calculator.css` — 공학·메모리 키, 각도 토글, 기록 전체 삭제·항목 최소 높이 44px. 수식 줄 3줄 상한 + 세로 스크롤
- `src/ui/calculator.ts` — 렌더할 때 수식 줄을 끝으로 스크롤

공학용 키 5열 배치는 유지했습니다. 360px 에서도 키 폭 45px 로 44px 기준을 넘습니다.
결과 줄은 숫자 문자열 길이가 유한해(최대 약 24자) 줄바꿈만 유지했습니다.

## 검증

- `npm test` (205 passed) / `npm run typecheck` / `npm run build` 모두 exit 0 — [before/verify.txt](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/before/verify.txt) · [after/verify.txt](https://raw.githubusercontent.com/Mineru98/toy-calculate/main/.issue/10/evidence/after/verify.txt)
- 360 / 768 / 1280px × 라이트·다크·긴 수식 9개 상태 측정

## 남은 이슈

- 전체 페이지 캡처의 아래쪽 배경이 끊겨 보이는 것은 `background-attachment: fixed` 를 전체 페이지로 찍을 때 생기는 캡처 현상이며 변경 전에도 같습니다. 실제 스크롤 화면과는 무관해 이번 범위에서 손대지 않았습니다.
