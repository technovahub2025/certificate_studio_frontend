import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import DataFiles from './pages/DataFiles'
import DataPreview from './pages/DataPreview'
import Generate from './pages/Generate'
import GenerationResult from './pages/GenerationResult'
import History from './pages/History'
import Login from './pages/Login'
import Settings from './pages/Settings'
import TemplateEditor from './pages/TemplateEditor'
import Templates from './pages/Templates'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/templates/editor" element={<TemplateEditor />} />
        <Route path="/templates/:id/editor" element={<TemplateEditor />} />
        <Route path="/data" element={<DataFiles />} />
        <Route path="/data/preview" element={<DataPreview />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/generate/result" element={<GenerationResult />} />
        <Route path="/generate/result/:id" element={<GenerationResult />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
