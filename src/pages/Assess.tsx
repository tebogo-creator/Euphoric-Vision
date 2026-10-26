import type { Route } from '../lib/router'
import { PageHeader } from '../components/PageHeader'
import { ProjectStrip } from '../components/ProjectStrip'
import { StageNotice } from '../components/StageNotice'

const CATEGORIES = [
  { name: 'Furnishings and décor', items: ['Furniture condition', 'Modernity and perceived quality', 'Artwork and décor', 'Lighting', 'Finishes', 'Cohesive styling', 'Landscaping and outdoor presentation', 'Attention to detail'] },
  { name: 'Linen and bedding', items: ['Bedding', 'Pillow arrangement', 'Linen coordination', 'Towels', 'Visible wear'], note: 'Photos show presentation only. They can’t confirm fabric quality or cleanliness.' },
  { name: 'Amenities', items: ['Swimming pool', 'Wi-Fi', 'Games room', 'Entertainment', 'Braai or outdoor area', 'Air conditioning', 'Backup power'], note: 'You confirm these yourself, since most can’t be seen in a photo.' },
  { name: 'Overall impression', items: ['Looks inviting', 'Appears well maintained', 'Cohesive styling', 'Photos likely to appeal to guests', 'Worthwhile improvements'] },
]

const STATUSES = [
  { label: 'Verified', cls: 'bg-sage text-forest-deep' },
  { label: 'Unverified', cls: 'bg-ivory text-ink-soft border border-line' },
  { label: 'Needs attention', cls: 'bg-amber-soft text-amber' },
]

export function Assess({ go }: { go: (r: Route) => void }) {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 pt-10">
      <PageHeader title="Assess My Property">
        <p>A checklist for how your property presents to guests. You make the final call on every item; the app never rejects a property on an AI opinion.</p>
      </PageHeader>
      <ProjectStrip go={go} />
      <div className="grid gap-5 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <section key={c.name} className="rounded-2xl border border-line bg-card p-6">
            <h2 className="h-display text-2xl">{c.name}</h2>
            <ul className="mt-4 grid gap-x-4 gap-y-1.5 text-sm text-ink-soft sm:grid-cols-2">
              {c.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
            {c.note && <p className="mt-4 border-t border-line pt-3 text-sm text-ink">{c.note}</p>}
          </section>
        ))}
      </div>
      <div>
        <p className="text-sm font-medium text-ink">Each item will be marked as</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUSES.map((s) => <span key={s.label} className={`rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>{s.label}</span>)}
        </div>
      </div>
      <StageNotice stage={4} title="the interactive checklist">
        You’ll mark each item, flag red flags, add notes, and link findings to your room photos. Results will feed the investment report.
      </StageNotice>
    </div>
  )
}
