import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { ClipLoader, PulseLoader, RingLoader } from 'react-spinners';
import { AnimatePresence, motion } from 'framer-motion';

export default function GlobalLoading() {
  const isFetching = useIsFetching();   // active useQuery()
  const isMutating = useIsMutating();   // active useMutation()

  const isLoading = isFetching > 0 || isMutating > 0;

  let Spinner = ClipLoader;
  let text = 'Loading...';
  let color = '#60a5fa'; // blue

  if (isMutating > 0) {
    Spinner = RingLoader;
    text = 'Saving changes...';
    color = '#22c55e'; // green
  } else if (isFetching > 0) {
    Spinner = PulseLoader;
    text = 'Fetching data...';
    color = '#3b82f6'; // blue
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center"
        >
          <Spinner color={color} size={60} />
          <p className="mt-4 text-white text-sm font-medium animate-pulse">{text}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
