import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { ClipLoader, PulseLoader, RingLoader } from 'react-spinners';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function GlobalLoading() {
  const { t } = useTranslation();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isLoading = isFetching > 0 || isMutating > 0;

  let Spinner = ClipLoader;
  let text = t('loading');
  let color = '#60a5fa'; // blue

  if (isMutating > 0) {
    Spinner = RingLoader;
    text = t('saving');
    color = '#22c55e'; // green
  } else if (isFetching > 0) {
    Spinner = PulseLoader;
    text = t('fetching');
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
