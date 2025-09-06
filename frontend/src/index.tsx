import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';
import App from './App';

const PUBLISHABLE_KEY ="pk_test_c3VpdGVkLXdlcmV3b2xmLTE3LmNsZXJrLmFjY291bnRzLmRldiQ";

if (!PUBLISHABLE_KEY) 
  throw new Error("Missing Clerk Publishable Key");


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ClerkProvider>
    </ThemeProvider>
  </React.StrictMode>
);








