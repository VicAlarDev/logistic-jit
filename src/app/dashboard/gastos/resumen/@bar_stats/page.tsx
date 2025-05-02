import { delay } from '@/constants/mock-api';
import GastosBarChart from '@/features/gastos/components/gastos-bar-chart';

export default async function BarStats() {
  await delay(1000);
  return <GastosBarChart />;
}
