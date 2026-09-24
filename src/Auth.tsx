import { useEffect, useMemo, useState } from 'react';
import {
  B2BIdentityProvider,
  StytchB2B,
  useStytchMember,
} from '@stytch/react/b2b';
import { OAuthProviders, type StytchB2BUIConfig } from '@stytch/vanilla-js';
import { B2BProducts, StytchEventType } from '@stytch/vanilla-js/b2b';

const RETURN_TO_KEY = 'wadatsumi-recorder-return-to';
const RETURN_TO_WINDOW_PREFIX = 'wadatsumi-recorder-return-to:';
const ROUTE_PARAM = 'wadatsumi_route';
const BASE_PATH = import.meta.env.BASE_URL;

let loginCompletionStarted = false;

function appUrl(route?: 'login' | 'authenticate', returnTo?: string | null) {
  const url = new URL(BASE_PATH, window.location.origin);
  if (route) url.searchParams.set(ROUTE_PARAM, route);
  const safeReturnTo = returnTo ?? null;
  if (isSafeReturnTo(safeReturnTo)) {
    url.searchParams.set('return_to', safeReturnTo);
  }
  return url.toString();
}

function isSafeReturnTo(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.origin === window.location.origin && url.pathname === BASE_PATH
      && url.searchParams.has('client_id') && url.searchParams.has('state')
      && url.searchParams.get('response_type') === 'code'
      && !url.searchParams.has(ROUTE_PARAM);
  } catch {
    return false;
  }
}

function clearReturnTo() {
  // Only remove this app's obsolete fallback; SDK session/PKCE storage is untouched.
  for (const storageName of ['localStorage', 'sessionStorage'] as const) {
    try { window[storageName].removeItem(RETURN_TO_KEY); } catch { /* Storage may be disabled. */ }
  }
  if (window.name.startsWith(RETURN_TO_WINDOW_PREFIX)) window.name = '';
}

function onLoginComplete() {
  if (loginCompletionStarted) return;
  const returnToFromUrl = new URLSearchParams(window.location.search).get('return_to');
  const returnTo = isSafeReturnTo(returnToFromUrl) ? returnToFromUrl : null;
  clearReturnTo();
  if (!returnTo) return;
  loginCompletionStarted = true;
  window.location.assign(returnTo);
}

function authorizationErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (!error || typeof error !== 'object') return 'Unknown authorization error';

  const details = error as Record<string, unknown>;
  return [details.error_type, details.message, details.request_id]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' / ') || 'Unknown authorization error';
}

export function Login() {
  const { member, isInitialized } = useStytchMember();
  const returnToFromUrl = new URLSearchParams(window.location.search).get('return_to');
  const returnTo = isSafeReturnTo(returnToFromUrl) ? returnToFromUrl : null;

  useEffect(() => {
    clearReturnTo();
    if (!isInitialized || !member || !returnTo) return;
    onLoginComplete();
  }, [isInitialized, member, returnTo]);

  const config = useMemo(
    () =>
      ({
        authFlowType: 'Discovery',
        products: [B2BProducts.oauth],
        oauthOptions: {
          providers: [{ type: OAuthProviders.Google }],
          discoveryRedirectURL: appUrl('authenticate', returnTo),
        },
        sessionOptions: {
          sessionDurationMinutes: 60,
        },
      }) satisfies StytchB2BUIConfig,
    [returnTo],
  );

  if (!returnTo) {
    return <p role="alert">接続要求を確認できません。ChatGPTの接続画面から開始してください。</p>;
  }

  return (
    <section aria-label="Googleでログイン">
      <StytchB2B
        config={config}
        callbacks={{
          onEvent: (event) => {
            if (event.type === StytchEventType.AuthenticateFlowComplete) {
              onLoginComplete();
            }
          },
          onError: (error) => console.error('Stytch login failed', error),
        }}
      />
    </section>
  );
}

function LoginRequired({ children }: { children: React.ReactNode }) {
  const { member, isInitialized } = useStytchMember();

  useEffect(() => {
    if (!isInitialized || member) return;
    const returnTo = window.location.href;
    clearReturnTo();
    window.location.assign(appUrl('login', returnTo));
  }, [isInitialized, member]);

  if (!isInitialized || !member) return null;
  return children;
}

export function Authorize() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <LoginRequired>
      <section aria-label="MCPアクセスの認可">
        {errorMessage ? (
          <div role="alert">
            <h2>Authorization could not continue</h2>
            <p>{errorMessage}</p>
          </div>
        ) : (
          <B2BIdentityProvider
            callbacks={{
              onError: (error) => {
                console.error('Stytch authorization failed', error);
                setErrorMessage(authorizationErrorMessage(error));
              },
            }}
          />
        )}
      </section>
    </LoginRequired>
  );
}
