'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    resolve: (value: boolean) => void;
  }>({
    isOpen: false,
    options: null,
    resolve: () => {},
  });

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, options, resolve });
    });
  };

  const handleClose = (value: boolean) => {
    setState((prev) => {
      prev.resolve(value);
      return { ...prev, isOpen: false };
    });
  };

  const Icon = state.options?.variant === 'danger' ? AlertCircle : state.options?.variant === 'warning' ? AlertTriangle : Info;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      <AlertDialog open={state.isOpen} onOpenChange={(open) => !open && handleClose(false)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className={`flex items-center gap-2 ${state.options?.variant === 'danger' ? 'text-red-600' : state.options?.variant === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>
              <Icon className="w-5 h-5" />
              {state.options?.title || 'Tasdiqlash'}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-base text-slate-600">
              {state.options?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => handleClose(false)}>
              {state.options?.cancelText || 'Bekor qilish'}
            </Button>
            <Button 
              variant={state.options?.variant === 'danger' ? 'destructive' : 'default'} 
              className={state.options?.variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
              onClick={() => handleClose(true)}
            >
              {state.options?.confirmText || 'Tasdiqlash'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};
