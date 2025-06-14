import { useEffect, useState } from 'react';
import axios from 'axios';

export function useDealStatusDot() {
  const [hasActiveDeal, setHasActiveDeal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    axios.get('/api/deals')
      .then(res => {
        if (!isMounted) return;
        if (res.data && Array.isArray(res.data.deals)) {
          const found = res.data.deals.some((deal: any) =>
            ['requested', 'pending', 'ongoing'].includes(deal.status)
          );
          setHasActiveDeal(found);
        }
      })
      .catch(() => setHasActiveDeal(false));
    return () => { isMounted = false; };
  }, []);

  return hasActiveDeal;
}
