import './styles/index.css';
import { mountCalculator } from './ui/calculator';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  mountCalculator(app);
}
