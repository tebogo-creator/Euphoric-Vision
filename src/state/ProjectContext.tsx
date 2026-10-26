import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { deserializeProject, emptyProject, projectReducer, type Project, type ProjectAction } from './project'

/**
 * Keeps the project in memory and saves a copy in this browser, so moving
 * between tools (or refreshing) does not lose anything. Photos are NOT kept
 * here; see PhotoContext and photoStore for how images are handled.
 */
const STORAGE_KEY = 'euphoric-vision:project:v4'
const V3_KEY = 'euphoric-vision:project:v3'
/** Stage 2 key, read once if no Stage 3 project exists yet. */
const V2_KEY = 'euphoric-vision:project:v2'
/** Where Stage 1 saved projects, read once so nothing is lost after the upgrade. */
const OLD_KEY = 'reimagine-ai:project:v1'

function loadSaved(): Project {
  try {
    for (const key of [STORAGE_KEY, V3_KEY, V2_KEY, OLD_KEY]) {
      const p = deserializeProject(window.localStorage.getItem(key))
      if (p) return p
    }
    return { ...emptyProject }
  } catch {
    return { ...emptyProject }
  }
}

interface Ctx {
  project: Project
  dispatch: (a: ProjectAction) => void
  savedLocally: boolean
}

const ProjectContext = createContext<Ctx | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, dispatch] = useReducer(projectReducer, undefined, loadSaved)
  const [savedLocally, setSavedLocally] = useState(true)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
      setSavedLocally(true)
    } catch {
      setSavedLocally(false)
    }
  }, [project])

  const value = useMemo(() => ({ project, dispatch, savedLocally }), [project, savedLocally])
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject(): Ctx {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider')
  return ctx
}
