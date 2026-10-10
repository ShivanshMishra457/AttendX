import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const timer = useRef();
  const toast = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 2400);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={'toast' + (msg ? ' show' : '')}>{msg}</div>
    </ToastCtx.Provider>
  );
}
