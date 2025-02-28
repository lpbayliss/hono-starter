import { authClient } from "./lib/auth-client";

function App() {
	const { data } = authClient.useSession();

	const handleSignIn = async () => {
		await authClient.signIn.social({
			provider: "github",
			callbackURL: "http://localhost:5003/",
		});
	};

	const handleSignOut = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					alert("You have been signed out");
				},
			},
		});
	};

	return (
		<>
			<h2>Hello World</h2>
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
		</>
	);
}

export default App;
