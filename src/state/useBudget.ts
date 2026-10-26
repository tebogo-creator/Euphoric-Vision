import { useMemo } from 'react'
import { planBudget } from '../lib/budget'
import { useProject } from './ProjectContext'

/** The live budget plan for the current project. Recalculates whenever anything changes. */
export function useBudget() {
  const { project } = useProject()
  return useMemo(() => planBudget(project), [project])
}
