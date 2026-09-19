import React from 'react';
import { RootLayout } from '../app/_layout';
import { usePathname } from '../lib/router';
import HomeScreen from '../app/index';
import SignInScreen from '../app/(auth)/sign-in';
import SignUpScreen from '../app/(auth)/sign-up';
import LobbyScreen from '../app/(main)/lobby';
import GameScreen from '../app/(main)/game/[id]';
import ProfileScreen from '../app/(main)/profile';

function RouteSwitch() {
  const pathname = usePathname();

  // Normalize path
  const path = pathname.replace(/\/$/, '') || '/';

  if (path === '/' || path === '') {
    return <HomeScreen />;
  }
  if (path === '/sign-in' || path === '/(auth)/sign-in' || path === '/auth/sign-in') {
    return <SignInScreen />;
  }
  if (path === '/sign-up' || path === '/(auth)/sign-up' || path === '/auth/sign-up') {
    return <SignUpScreen />;
  }
  if (path === '/lobby' || path === '/(main)/lobby' || path === '/main/lobby') {
    return <LobbyScreen />;
  }
  if (path.startsWith('/game/') || path.startsWith('/(main)/game/') || path.startsWith('/main/game/')) {
    return <GameScreen />;
  }
  if (path === '/profile' || path === '/(main)/profile' || path === '/main/profile') {
    return <ProfileScreen />;
  }

  // Fallback to Home
  return <HomeScreen />;
}

export default function App() {
  return (
    <RootLayout>
      <RouteSwitch />
    </RootLayout>
  );
}
