import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CheckSquare, LayoutDashboard, LogOut, ChevronLeft, ChevronRight, Zap, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

const navItems = [
  { to: '/briefing', label: 'Briefing', icon: Zap },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/legacy', label: 'Legacy', icon: LayoutDashboard },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      window.location.href = '/login';
    },
  });

  return (
    <aside
      className={cn(
        'flex-shrink-0 border-r border-border bg-surface-root flex flex-col transition-all duration-250 ease-in-out',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Logo + collapse */}
      <div className={cn('flex items-center border-b border-border h-14', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        {!collapsed && <h1 className="text-body-medium text-foreground font-semibold">Command Central</h1>}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-overlay transition-colors duration-150"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md text-body transition-colors duration-150',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                isActive
                  ? 'bg-primary/15 text-foreground border-l-[3px] border-primary'
                  : 'text-muted-foreground hover:bg-surface-overlay hover:text-foreground',
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className={cn('h-6 w-6 flex-shrink-0')} />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
            collapsed ? 'justify-center px-2' : 'justify-start gap-3',
          )}
          onClick={() => logout.mutate()}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}

function PulseRail({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  // Placeholder — will be populated with real threshold-based data
  const escalatedItems: any[] = [];
  const pinnedItems: any[] = [];

  if (collapsed) {
    return (
      <div
        onClick={onToggle}
        className="w-10 flex-shrink-0 border-l border-border bg-surface-root flex flex-col items-center pt-4 gap-3 cursor-pointer transition-all duration-250 ease-in-out"
      >
        {escalatedItems.length > 0 && (
          <div className="w-5 h-5 rounded-full bg-surface-overlay text-overline text-foreground flex items-center justify-center">
            {escalatedItems.length}
          </div>
        )}
        {escalatedItems.map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-status-urgency-low" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-[300px] flex-shrink-0 border-l border-border bg-surface-root flex flex-col transition-all duration-250 ease-in-out">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <span className="text-overline text-muted-foreground uppercase tracking-wider">Pulse</span>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-overlay transition-colors duration-150"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {escalatedItems.length === 0 && pinnedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Zap className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-caption text-muted-foreground">Nothing needs attention</p>
            <p className="text-caption text-muted-foreground/60 mt-1">You're on top of things</p>
          </div>
        ) : (
          <>
            {escalatedItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-3.5 w-3.5 text-status-urgency-low" />
                  <span className="text-overline text-muted-foreground uppercase">Needs Attention</span>
                </div>
                {/* Items will render here */}
              </div>
            )}
            {pinnedItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-overline text-muted-foreground uppercase">Pinned</span>
                </div>
                {/* Items will render here */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ShellLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pulseCollapsed, setPulseCollapsed] = useState(true);

  return (
    <div className="flex h-screen bg-surface-base">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      <PulseRail collapsed={pulseCollapsed} onToggle={() => setPulseCollapsed(!pulseCollapsed)} />
    </div>
  );
}
