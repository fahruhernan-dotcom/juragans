// Extracted sidebar sub-components — declared at module scope to avoid
// "component created during render" lint error.

function InstagramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

export function NavItem({ item, collapsed, activeTab, setActiveTab, setMobileSidebar }) {
  const Icon = item.icon
  const isActive = activeTab === item.id
  return (
    <button
      onClick={() => { setActiveTab(item.id); setMobileSidebar(false) }}
      title={collapsed ? item.label : ''}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
        isActive
          ? 'bg-brand-maroon text-white shadow-lg shadow-brand-maroon/30'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors ${
        isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'
      }`}>
        {item.isInsta
          ? <InstagramIcon className="w-4 h-4" />
          : <Icon className="w-4 h-4" />
        }
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-gold flex-shrink-0"></span>
      )}
    </button>
  )
}
