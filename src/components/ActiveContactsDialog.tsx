"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users } from 'lucide-react';

interface ActiveContactsDialogProps {
  activeCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ActiveContactsDialog: React.FC<ActiveContactsDialogProps> = ({ activeCount, isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Contactos Ativos
          </DialogTitle>
          <DialogDescription>
            Esta é a contagem de contactos que não estão arquivados.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
          <p className="text-5xl font-bold text-primary">{activeCount}</p>
          <p className="text-muted-foreground mt-2">contactos ativos</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};