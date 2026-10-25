import { statusBody, type ServerEnv } from './_lib/redesignHandler'

/** GET /api/status: tells the app whether AI redesign is set up. Never returns the key itself. */
export async function GET(): Promise<Response> {
  return new Response(JSON.stringify(statusBody(process.env as ServerEnv)), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}
