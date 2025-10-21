"use client";

import React from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users } from 'lucide-react';

interface ActiveContactsDialogContentProps {
  activeCount: number;
}

export const ActiveContactsDialogContent: React.FC<ActiveContactsDialogContentProps> = ({ activeCount }) => {
  return (
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
  );
};