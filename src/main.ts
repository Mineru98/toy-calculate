import './styles/index.css';

const variants = [
  { name: '숫자', modifier: 'number', label: '7' },
  { name: '연산자', modifier: 'operator', label: '×' },
  { name: '함수', modifier: 'function', label: 'sin' },
  { name: '강조', modifier: 'accent', label: '=' },
];

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = `
    <section class="glass">
      <h1>Toy Calculate</h1>
      <p>버튼 변형 확인용 패널 (기본 · disabled)</p>
      <table>
        <tbody>
          ${variants
            .map(
              (v) => `
            <tr>
              <th scope="row">${v.name}</th>
              <td><button type="button" class="btn btn--${v.modifier}">${v.label}</button></td>
              <td><button type="button" class="btn btn--${v.modifier}" disabled>${v.label}</button></td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </section>
  `;
}
