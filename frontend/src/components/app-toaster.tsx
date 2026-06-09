"use client";

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#101419',
          border: '1px solid #2a3138',
          color: '#d8f6e6',
        },
      }}
    />
  );
}
