import './styles/index.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = `
    <section class="glass">
      <h1>Toy Calculate</h1>
      <p>글래스모피즘 디자인 토큰 확인용 패널</p>
    </section>
  `;
}
