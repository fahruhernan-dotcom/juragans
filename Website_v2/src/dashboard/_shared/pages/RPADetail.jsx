import { useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'

export default function RPADetail() {
  const { id } = useParams()
  return (
    <div>
      <TopBar title="Detail RPA" showBack={true} />
      <div style={{ padding: '20px', color: '#94A3B8' }}>
        Detail untuk RPA dengan ID: {id}
      </div>
    </div>
  )
}
