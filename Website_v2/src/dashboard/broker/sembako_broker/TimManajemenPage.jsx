import { Users } from 'lucide-react'
import ManajemenPage from '@/dashboard/_shared/pages/tim/ManajemenPage'
import { BROKER_SEMBAKO_TIM_CONFIG } from '@/dashboard/_shared/pages/tim/timConfigs'
import Pegawai from './Pegawai'

export default function SembakoTimManajemenPage() {
  const workerTab = { id: 'karyawan', label: 'Karyawan', icon: Users, component: Pegawai }
  return <ManajemenPage roleConfig={BROKER_SEMBAKO_TIM_CONFIG} workerTab={workerTab} />
}
