import { useRoute } from './lib/router'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { ProjectPage } from './pages/ProjectPage'
import { DesignPlan } from './pages/DesignPlan'
import { Redesign } from './pages/Redesign'
import { Assess } from './pages/Assess'
import { Estimate } from './pages/Estimate'
import { Report } from './pages/Report'

export default function App() {
  const [route, go] = useRoute()
  const page = {
    home: <Home go={go} />,
    project: <ProjectPage go={go} />,
    plan: <DesignPlan go={go} />,
    redesign: <Redesign go={go} />,
    assess: <Assess go={go} />,
    estimate: <Estimate go={go} />,
    report: <Report go={go} />,
  }[route]

  return (
    <div className="flex min-h-full flex-col">
      <Header route={route} go={go} />
      <main className={`flex-1 ${route === 'home' ? '' : 'pb-24'}`}>{page}</main>
      <Footer />
    </div>
  )
}
