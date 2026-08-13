import Button from '../components/common/Button'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'

export default function Settings() {
  return (
    <>
      <PageHeader eyebrow="Workspace" title="Settings" description="Configure defaults used by templates and certificate batches." />
      <section className="content-grid two-col">
        <Card>
          <h2>Organization</h2>
          <label className="field"><span>Name</span><input defaultValue="Certificate Studio" /></label>
          <label className="field"><span>Verification domain</span><input placeholder="verify.example.com" /></label>
          <Button>Save changes</Button>
        </Card>
        <Card>
          <h2>Defaults</h2>
          <div className="settings-list">
            <label><input type="checkbox" defaultChecked /> Auto-generate certificate numbers</label>
            <label><input type="checkbox" /> Require data review before generation</label>
            <label><input type="checkbox" defaultChecked /> Keep generation history</label>
          </div>
        </Card>
      </section>
    </>
  )
}
