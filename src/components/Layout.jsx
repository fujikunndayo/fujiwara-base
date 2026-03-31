import { Outlet, NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: '概要', icon: '🏕️', end: true },
  { to: '/tasks', label: 'タスク', icon: '📋' },
  { to: '/logs', label: 'ログ', icon: '📝' },
  { to: '/calendar', label: 'カレンダー', icon: '📅' },
  { to: '/settings', label: '設定', icon: '⚙️' },
];

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <header style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--card-border)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-sand)', letterSpacing: '0.05em' }}>
          🌲 FUJIWARA BASE
        </span>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 'var(--tab-height)',
      }}>
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--tab-height)',
        display: 'flex',
        background: 'rgba(26,31,22,0.96)',
        borderTop: '1px solid var(--card-border)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              fontSize: '10px',
              color: isActive ? 'var(--accent-green)' : 'var(--text-sub)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            })}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
