import { createContext, useContext, useEffect, type ReactNode } from 'react';

export const MobileHeaderActionContext = createContext<((action: ReactNode) => void) | null>(null);

export function useMobileHeaderAction(action: ReactNode) {
  const setAction = useContext(MobileHeaderActionContext);
  useEffect(() => {
    setAction?.(action);
    return () => setAction?.(null);
  }, [action, setAction]);
}
