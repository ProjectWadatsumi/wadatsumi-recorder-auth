import { useEffect, useMemo } from 'react';
import {
  B2BIdentityProvider,
  StytchB2B,
  useStytchMemberSession,
} from '@stytch/react/b2b';
import { OAuthProviders, type StytchB2BUIConfig } from '@stytch/vanilla-js';
import { B2BProducts, StytchEventType } from '@stytch/vanilla-js/b2b';

const RETURN_TO_KEY = 'wadatsumi-recorder-return-to';
const ROUTE_PARAM = 'wadatsumi_route';
const BASE_PATH = import.meta.env.BASE_URL;

function appUrl(route?: 'login' | 'authenticate') {
  const url = new URL(BASE_PATH, window.location.origin);
  if (route) url.searchParams.set(ROUTE_PARAM, route);
  return url.toString();
}

function isSafeReturnTo(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.origin === window.location.origin && url.pathname === BASE_PATH;
  } catch {
    return false;
  }
}

function onLoginComplete() {
  const returnTo = localStorage.getItem(RETURN_TO_KEY);
  localStorage.removeItem(RETURN_TO_KEY);
  window.location.assign(isSafeReturnTo(returnTo) ? returnTo : appUrl());
}

export function Login() {
  const config = useMemo(
    () =>
      ({
        authFlowType: 'Discovery',
        products: [B2BProducts.oauth],
        oauthOptions: {
          providers: [{ type: OAuthProviders.Google }],
          loginRedirectURL: appUrl('authenticate'),
          signupRedirectURL: appUrl('authenticate'),
        },
        sessionOptions: {
          sessionDurationMinutes: 60,
        },
      }) satisfies StytchB2BUIConfig,
    [],
  );

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
  const { session, isInitialized } = useStytchMemberSession();

  useEffect(() => {
    if (!isInitialized || session) return;
    localStorage.setItem(RETURN_TO_KEY, window.location.href);
    window.location.assign(appUrl('login'));
  }, [isInitialized, session]);

  if (!isInitialized || !session) return null;
  return children;
}

export function Authorize() {
  return (
    <LoginRequired>
      <section aria-label="MCPアクセスの認可">
        <B2BIdentityProvider
          callbacks={{
            onError: (error) => console.error('Stytch authorization failed', error),
          }}
        />
      </section>
    </LoginRequired>
  );
}
