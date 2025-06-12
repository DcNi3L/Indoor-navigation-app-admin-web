import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 минут
      gcTime: 1000 * 60 * 15, // 15 минут
      retry: 1, // По умолчанию 1 попытка для запросов
    },
    mutations: {
      retry: 0, // Мутации обычно не должны повторяться автоматически
    },
  },
})
