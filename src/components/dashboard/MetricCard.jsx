import Card from '../common/Card'

export default function MetricCard({ label, value, note, icon: Icon }) {
  return (
    <Card className="metric-card">
      <div className="metric-icon">{Icon ? <Icon size={20} /> : null}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </Card>
  )
}
