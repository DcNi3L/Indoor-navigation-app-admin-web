import { useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';

export default function useGlobalLoading() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    const checkLoadingState = () => {
      const isFetching = queryClient.isFetching();
      const isMutating = queryClient.isMutating();

      // Only show the loader if this is the first load or if there are active mutations
      const shouldShowLoader = firstLoadRef.current || isMutating > 0;

      setIsLoading(shouldShowLoader);

      if (firstLoadRef.current && isFetching > 0) {
        firstLoadRef.current = false;
      }
    };

    checkLoadingState();

    const unsubscribe = queryClient.getQueryCache().subscribe(checkLoadingState);

    return () => unsubscribe();
  }, [queryClient]);

  return isLoading;
}
