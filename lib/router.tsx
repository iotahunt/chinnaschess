import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface RouterContextType {
  pathname: string;
  params: Record<string, string>;
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
}

const RouterContext = createContext<RouterContextType>({
  pathname: '/',
  params: {},
  push: () => {},
  replace: () => {},
  back: () => {},
});

function parseLocation(): { pathname: string; params: Record<string, string> } {
  if (typeof window === 'undefined') {
    return { pathname: '/', params: {} };
  }
  
  let path = window.location.pathname;
  if (!path || path === '') path = '/';

  // Also support hash routing if hosted in environments with static single-file routing
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    path = window.location.hash.slice(1);
  }

  const searchParams = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    params[key] = val;
  });

  // Extract route params like /game/:id
  const gameMatch = path.match(/\/game\/([^/?#]+)/);
  if (gameMatch) {
    params.id = gameMatch[1];
  }

  return { pathname: path, params };
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [current, setCurrent] = useState(parseLocation());

  useEffect(() => {
    const handlePopState = () => {
      setCurrent(parseLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const push = useCallback((href: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      setCurrent(parseLocation());
      window.scrollTo(0, 0);
    }
  }, []);

  const replace = useCallback((href: string) => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', href);
      setCurrent(parseLocation());
      window.scrollTo(0, 0);
    }
  }, []);

  const back = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  return (
    <RouterContext.Provider
      value={{
        pathname: current.pathname,
        params: current.params,
        push,
        replace,
        back,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter() {
  const ctx = useContext(RouterContext);
  return {
    push: ctx.push,
    replace: ctx.replace,
    back: ctx.back,
  };
}

export function usePathname(): string {
  const ctx = useContext(RouterContext);
  return ctx.pathname;
}

export function useLocalSearchParams<T extends Record<string, string> = Record<string, string>>(): T {
  const ctx = useContext(RouterContext);
  return ctx.params as T;
}

export const Link: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ href, children, className, style, onClick }) => {
  const { push } = useRouter();

  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick(e);
        push(href);
      }}
    >
      {children}
    </a>
  );
};
