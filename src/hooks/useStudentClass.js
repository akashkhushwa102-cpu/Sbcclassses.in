import { useEffect, useState } from 'react';

export default function useStudentClass() {
  const [cls, setCls] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Prefer authenticated profile
        const res = await fetch('/api/profiles/me', { credentials: 'include' });
        if (res.ok) {
          const body = await res.json();
          const c = body?.data?.onboarding?.class || body?.data?.onboarding?.cls || null;
          if (mounted && c) setCls(String(c));
          return;
        }
      } catch (e) {
        // ignore
      }

      try {
        const local = localStorage.getItem('sbc_onboarding');
        if (local) {
          const parsed = JSON.parse(local);
          const c = parsed?.class || parsed?.cls || null;
          if (mounted && c) setCls(String(c));
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => { mounted = false; };
  }, []);

  return cls;
}
