import { useState } from 'react'
import { HealthStatus } from './components/HealthStatus.tsx'
import { DownloadManager } from './components/DownloadManager.tsx'
import { SentryTest } from './components/SentryTest.tsx'
import { TraceDisplay } from './components/TraceDisplay.tsx'
import { MetricsDashboard } from './components/MetricsDashboard.tsx'
import { Activity, Download, BarChart3, Bug } from 'lucide-react'
import './App.css'

type NavSection = 'health' | 'download' | 'metrics' | 'errors'

function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('health')

  const navItems = [
    { id: 'health' as NavSection, label: 'System Health', icon: Activity },
    { id: 'download' as NavSection, label: 'Download Service', icon: Download },
    { id: 'metrics' as NavSection, label: 'Performance', icon: BarChart3 },
    { id: 'errors' as NavSection, label: 'Error Monitoring', icon: Bug },
  ]

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🔍 Observability Platform</h1>
            <div className="header-meta">
              <span className="badge badge-live">● Live</span>
              <span className="divider">|</span>
              <span>Challenge 4 - CUET Fest 2025</span>
            </div>
          </div>
          <div className="header-right">
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <main className="dashboard-content">
        <section className="card card-primary">
          <div className="card-label">
            {navItems.find(item => item.id === activeSection)?.label}
          </div>
          <div className="card-body">
            {activeSection === 'health' && <HealthStatus />}
            {activeSection === 'download' && <DownloadManager />}
            {activeSection === 'metrics' && <MetricsDashboard />}
            {activeSection === 'errors' && <SentryTest />}
          </div>
        </section>
      </main>

      <TraceDisplay />
    </div>
  )
}

export default App
