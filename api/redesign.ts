import { handleRedesign, type ServerEnv } from './_lib/redesignHandler'

/** POST /api/redesign: edits one room photo. The OpenAI key is read here, on the server only. */
export async function POST(request: Request): Promise<Response> {
  return handleRedesign(request, process.env as ServerEnv)
}
