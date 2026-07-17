import { useState, useEffect, createContext, useContext, ReactNode, useCallback, CSSProperties } from 'react';

interface RouterContextType {
  path: string;
  params: Record<string, string>;
  navigate: (to: string) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  params: {},
  navigate: () => {},
  goBack: () => {},
});

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname || '/');
  const [params] = useState<Record<string, string>>({});

  const navigate = useCallback((to: string) => {
    const targetPath = to.startsWith('/') ? to : `/${to}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
      setPath(targetPath);
      window.scrollTo(0, 0);
    }
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    const handler = () => {
      setPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return (
    <RouterContext.Provider value={{ path, params, navigate, goBack }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

export function useNavigate() {
  const { navigate } = useRouter();
  return navigate;
}

interface RouteProps {
  path: string;
  element: ReactNode;
  exact?: boolean;
}

interface RoutesProps {
  children: ReactNode;
}

export function Route(props: RouteProps) {
  return <>{props.element}</>;
}

function matchPath(routePath: string, currentPath: string): { matched: boolean; params: Record<string, string> } {
  if (routePath === '*') return { matched: true, params: {} };

  // 🟢 CLEAN STRING MATCHING: Separates query strings safely without array conversions
  const routeUrl = routePath.split('?')[0] || '/';
  const currentUrl = currentPath.split('?')[0] || '/';

  if (routeUrl === currentUrl) return { matched: true, params: {} };

  const routeParts = routeUrl.split('/').filter(Boolean);
  const pathParts = currentUrl.split('/').filter(Boolean);

  if (routeParts.length !== pathParts.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      params[routeParts[i].slice(1)] = pathParts[i];
    } else if (routeParts[i] !== pathParts[i]) {
      return { matched: false, params: {} };
    }
  }
  return { matched: true, params };
}

export function Routes({ children }: RoutesProps) {
  const { path } = useRouter();
  const routes: RouteProps[] = [];
  
  const collectRoutes = (node: ReactNode) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(collectRoutes);
      return;
    }
    const element = node as React.ReactElement;
    if (element?.props?.path !== undefined) {
      routes.push(element.props as RouteProps);
    } else if (element?.props?.children) {
      collectRoutes(element.props.children);
    }
  };
  collectRoutes(children);

  for (const route of routes) {
    const { matched, params } = matchPath(route.path, path);
    if (matched) {
      return (
        <RouterContext.Consumer>
          {(ctx) => (
            <RouterContext.Provider value={{ ...ctx, params }}>
              {route.element}
            </RouterContext.Provider>
          )}
        </RouterContext.Consumer>
      );
    }
  }
  return null;
}

export function Link({ to, children, className, style, onClick }: { to: string; children: ReactNode; className?: string; style?: CSSProperties; onClick?: () => void }) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function useParams() {
  const { params, path } = useRouter();
  return { ...params, _path: path };
}
