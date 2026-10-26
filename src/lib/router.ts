import { useCallback, useEffect, useState } from 'react'

export type Route = 'home' | 'project' | 'plan' | 'redesign' | 'assess' | 'estimate' | 'report'
export const ROUTES: Route[] = ['home', 'project', 'plan', 'redesign', 'assess', 'estimate', 'report']

/** Reads "#redesign" style links. Anything unknown goes to the home screen. */
export function parseHash(hash: string): Route {
  const token = hash.replace(/^#/, '').trim().toLowerCase()
  return (ROUTES as string[]).includes(token) ? (token as Route) : 'home'
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const go = useCallback((r: Route) => {
    window.location.hash = r === 'home' ? '' : r
    setRoute(r)
    window.scrollTo({ top: 0 })
  }, [])

  return [route, go]
}
