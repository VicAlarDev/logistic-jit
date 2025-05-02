import { delay } from '@/constants/mock-api';
import { RecentGastos } from '@/features/gastos/components/recent-gastos';

export default async function Sales() {
  await delay(3000);
  return <RecentGastos />;
}
