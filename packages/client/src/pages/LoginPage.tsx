import { useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: hasUsersData } = trpc.auth.hasUsers.useQuery();
  const hasUsers = hasUsersData ?? null;

  const regOptions = trpc.auth.registrationOptions.useMutation();
  const verifyReg = trpc.auth.verifyRegistration.useMutation();
  const authOptions = trpc.auth.authenticationOptions.useMutation();
  const verifyAuth = trpc.auth.verifyAuthentication.useMutation();

  async function handleRegister() {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const options = await regOptions.mutateAsync({ username: username.trim() });
      const response = await startRegistration({ optionsJSON: options as any });
      await verifyReg.mutateAsync({ username: username.trim(), response });
      window.location.href = '/tasks';
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      const options = await authOptions.mutateAsync();
      const response = await startAuthentication({ optionsJSON: options as any });
      await verifyAuth.mutateAsync({ response });
      window.location.href = '/tasks';
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  if (hasUsers === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Command Central</CardTitle>
          <CardDescription>
            {hasUsers ? 'Sign in with your passkey' : 'Create your account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasUsers && (
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {hasUsers ? (
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign in with Passkey'}
            </Button>
          ) : (
            <Button className="w-full" onClick={handleRegister} disabled={loading}>
              {loading ? 'Setting up...' : 'Create Account with Passkey'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
