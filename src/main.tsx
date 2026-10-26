import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ProjectProvider } from './state/ProjectContext'
import { PhotoProvider } from './state/PhotoContext'
import { AiProvider } from './state/AiContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectProvider>
      <PhotoProvider>
        <AiProvider>
          <App />
        </AiProvider>
      </PhotoProvider>
    </ProjectProvider>
  </StrictMode>,
)
