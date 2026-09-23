import { Authorize, Login } from './Auth';

const ROUTE_PARAM = 'wadatsumi_route';

export default function App() {
  const search = new URLSearchParams(window.location.search);
  const route = search.get(ROUTE_PARAM);
  const isLoginRoute = route === 'login' || route === 'authenticate';
  const isAuthorizationRequest = search.has('client_id');

  return (
    <main>
      <header>
        <p className="eyebrow">Wadatsumi Project</p>
        <h1>Wadatsumi Recorder MCP</h1>
      </header>
      {isLoginRoute ? (
        <Login />
      ) : isAuthorizationRequest ? (
        <Authorize />
      ) : (
        <section aria-label="稼働状態">
          <p>Wadatsumi Recorder authorization UI is ready.</p>
        </section>
      )}
    </main>
  );
}
