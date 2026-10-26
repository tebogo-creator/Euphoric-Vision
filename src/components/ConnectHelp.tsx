import type { ServiceStatus } from '../lib/generationApi'

/** Plain-language guidance when AI redesign can't run where the app is open. */
export function ConnectHelp({ service, onRecheck }: { service: ServiceStatus; onRecheck: () => void }) {
  if (service.state === 'not-configured') {
    const missing = [!service.hasKey && 'OPENAI_API_KEY', !service.hasAccessCode && 'APP_ACCESS_CODE'].filter(Boolean)
    return (
      <div className="rounded-xl border border-amber/30 bg-amber-soft p-4 text-sm leading-relaxed" role="status">
        <p className="font-semibold text-amber">Almost connected</p>
        <p className="mt-1 text-ink">Your app is running on its server, but these settings are missing: {missing.join(' and ')}. Add them in Vercel under Project, Settings, Environment Variables, then redeploy.</p>
        <button type="button" className="btn-quiet mt-3" onClick={onRecheck}>Check again</button>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-line bg-ivory p-4 text-sm leading-relaxed" role="status">
      <p className="font-semibold text-ink">AI redesign isn’t available in this copy of the app</p>
      <p className="mt-1 text-ink-soft">
        Generating needs a small server that keeps your OpenAI key secret. This preview can’t hold secrets, so it can’t connect. Everything else here still works, and your design settings are ready.
      </p>
      <p className="mt-2 text-ink-soft">To generate real redesigns, open your own Euphoric Vision app on Vercel. The step-by-step guide is in SETUP-AI.md inside the project download.</p>
      <button type="button" className="btn-quiet mt-3" onClick={onRecheck}>Check again</button>
    </div>
  )
}
