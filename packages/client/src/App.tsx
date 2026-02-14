import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient } from '@/lib/trpc';
import ShellLayout from '@/layouts/ShellLayout';
import LoginPage from '@/pages/LoginPage';
import BriefingPage from '@/pages/BriefingPage';
import TasksPage from '@/pages/TasksPage';
import LegacyPage from '@/pages/LegacyPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <AuthGuard>
                  <ShellLayout />
                </AuthGuard>
              }
            >
              <Route path="/briefing" element={<BriefingPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/legacy" element={<LegacyPage />} />
              <Route path="/" element={<Navigate to="/briefing" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
