import { QueryClientProvider, useQuery } from '@tanstack/react-query';

import { authClient } from './lib/auth-client';
import { queryClient, trpc } from './lib/trpc';

const Greeting = () => {
  const { data } = authClient.useSession();
  const greetingQuery = useQuery(trpc.hello.queryOptions(data?.user.name));
  return <h2>{greetingQuery.data ?? 'Unknown'}</h2>;
};

function App() {
  const { data } = authClient.useSession();

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: window.location.href,
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          alert('You have been signed out');
        },
      },
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Greeting />
      {!data?.session && (
        <button type="button" onClick={handleSignIn}>
          Sign in
        </button>
      )}
      {data?.session && (
        <button type="button" onClick={handleSignOut}>
          Sign out
        </button>
      )}
    </QueryClientProvider>
  );
}

export default App;
