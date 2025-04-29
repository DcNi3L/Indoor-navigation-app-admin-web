import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';
import { AuthProvider } from './components/context/AuthContext';
import GlobalLoading from './components/ui/globalLoading';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" reverseOrder={false} />
        <GlobalLoading />
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);
