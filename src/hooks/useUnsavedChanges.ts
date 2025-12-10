import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseUnsavedChangesOptions {
  initialData?: any;
  currentData?: any;
  onConfirmLeave?: () => void;
}

export const useUnsavedChanges = (options: UseUnsavedChangesOptions = {}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const navigate = useNavigate();

  // Compare initial and current data
  useEffect(() => {
    if (options.initialData && options.currentData) {
      const hasChanges = JSON.stringify(options.initialData) !== JSON.stringify(options.currentData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [options.initialData, options.currentData]);

  // Browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const confirmNavigation = useCallback((path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowConfirmDialog(true);
      return false;
    }
    navigate(path);
    return true;
  }, [hasUnsavedChanges, navigate]);

  const handleConfirmLeave = useCallback(() => {
    setShowConfirmDialog(false);
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
    options.onConfirmLeave?.();
  }, [pendingNavigation, navigate, options]);

  const handleCancelLeave = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  }, []);

  return {
    hasUnsavedChanges,
    showConfirmDialog,
    setShowConfirmDialog,
    markAsChanged,
    markAsSaved,
    confirmNavigation,
    handleConfirmLeave,
    handleCancelLeave,
  };
};

export default useUnsavedChanges;
