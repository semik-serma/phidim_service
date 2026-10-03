'use client';

import { useState, useEffect, useCallback } from 'react';
import BackendWarningToast from '@/components/login/BackendWarningToast';

/**
 * GlobalBackendWarning
 * 
 * Mounted in root layout (app/layout.js):
 * Listens to the global 'phidim:show-backend-warning' event and displays
 * the Backend Notice modal from anywhere in the application.
 */
export default function GlobalBackendWarning() {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerCount, setTriggerCount] = useState(0);

  const handleOpen = useCallback(() => {
    setTriggerCount((c) => c + 1);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener('phidim:show-backend-warning', handleOpen);
    return () => {
      window.removeEventListener('phidim:show-backend-warning', handleOpen);
    };
  }, [handleOpen]);

  return (
    <BackendWarningToast
      isOpen={isOpen}
      onClose={handleClose}
      triggerCount={triggerCount}
    />
  );
}
