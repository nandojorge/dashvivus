"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContacts } from '@/api/contacts';
import { Contact } from '@/types/contact';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users } from 'lucide-react';
import { format, parseISO, isSameDay, isSameWeek, isSameMonth, isSameYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ContactOriginBarChart from '@/components/charts/ContactOriginBarChart';
import { ActiveContactsDialog } from '@/components/ActiveContactsDialog';
import ContactListByPeriod from '@/components/ContactListByPeriod';
import { Separator } from '@/components/ui/separator';

type FilterPeriod = "today" | "week" | "month" | "year" | "all";

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("month");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: contacts, isLoading, isError, error } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });

  // Define origins in lowercase for consistency
  const origins = ["website", "referral", "social media", "email marketing", "direct"];

  const processContactsForPeriod = (allContacts: Contact[] | undefined, periodFilterFn: (contactDate: Date) => boolean) => {
    if (!allContacts) return [];
    return allContacts.filter((contact) => {
      let itemDateString: string | undefined;
      if ('dataregisto' in contact) {
        itemDateString = contact.dataregisto;
      }

      if (!itemDateString || typeof itemDateString !== 'string') {
        return false;
      }
      const itemDate = parseISO(itemDateString);
      if (isNaN(itemDate.getTime())) {
        console.warn(`Invalid date string for item ${contact.id}: ${itemDateString}`);
        return false;
      }
      return periodFilterFn(itemDate);
    }).map((contact) => {
      let assignedOrigin = contact.origemcontacto ? contact.origemcontacto.toLowerCase() : '';
      if (!assignedOrigin || !origins.includes(assignedOrigin)) { // Ensure assigned origin is one of the defined ones
        assignedOrigin = origins[Math.floor(Math.random() * origins.length)]; // <-- AQUI É ONDE A ORIGEM É ATRIBUÍDA ALEATORIAMENTE
      }

      return {
        ...contact,
        origemcontacto: assignedOrigin,
      };
    });
  };

  const currentPeriodContacts = useMemo(() => {
    const now = new Date();
    let filterFn: (contactDate: Date) => boolean;

    switch (selectedPeriod) {
      case "today":
        filterFn = (date) => isSameDay(date, now);
        break;
      case "week":
        filterFn = (date) => isSameWeek(date, now, { weekStartsOn: 0, locale: ptBR });
        break;
      case "month":
        filterFn = (date) => isSameMonth(date, now);
        break;
      case "year":
        filterFn = (date) => isSameYear(date, now);
        break;
      case "all":
      default:
        filterFn = () => true; // No date filter for "all"
        break;
    }
    return processContactsForPeriod(contacts, filterFn);
  }, [contacts, selectedPeriod]);

  const previousPeriodFilteredContacts = useMemo(() => {
    const now = new Date();
    let previousPeriodStart: Date;
    let filterFn: (contactDate: Date) => boolean;

    switch (selectedPeriod) {
      case "today":
        previousPeriodStart = subDays(now, 1);
        filterFn = (date) => isSameDay(date, previousPeriodStart);
        break;
      case "week":
        previousPeriodStart = subWeeks(now, 1);
        filterFn = (date) => isSameWeek(date, previousPeriodStart, { weekStartsOn: 0, locale: ptBR });
        break;
      case "month":
        previousPeriodStart = subMonths(now, 1);
        filterFn = (date) => isSameMonth(date, previousPeriodStart);
        break;
      case "year":
        previousPeriodStart = subYears(now, 1);
        filterFn = (date) => isSameYear(date, previousPeriodStart);
        break;
      case "all":
      default:
        return []; // No previous period comparison for "all"
    }
    return processContactsForPeriod(contacts, filterFn);
  }, [contacts, selectedPeriod]);

  const activeContactsCount = useMemo(() => {
    return contacts?.filter(contact => contact.arquivado === "nao").length || 0;
  }, [contacts]);

  if (isLoading) {
    return <div className="p-4 text-center">A carregar contactos...</div>;
  }

  if (isError) {
    return <div className="p-4 text-center text-red-500">Erro ao carregar contactos: {error?.message}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedPeriod === "today" ? "secondary" : "ghost"}
            onClick={() => setSelectedPeriod("today")}
          >
            Hoje
          </Button>
          <Button
            variant={selectedPeriod === "week" ? "secondary" : "ghost"}
            onClick={() => setSelectedPeriod("week")}
          >
            Semana
          </Button>
          <Button
            variant={selectedPeriod === "month" ? "secondary" : "ghost"}
            onClick={() => setSelectedPeriod("month")}
          >
            Mês
          </Button>
          <Button
            variant={selectedPeriod === "year" ? "secondary" : "ghost"}
            onClick={() => setSelectedPeriod("year")}
          >
            Ano
          </Button>
          <Button
            variant={selectedPeriod === "all" ? "secondary" : "ghost"}
            onClick={() => setSelectedPeriod("all")}
          >
            Todos
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contactos no Período
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPeriodContacts.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === "all"
                ? "Total de contactos registados"
                : `Contactos registados ${selectedPeriod === "today" ? "hoje" : selectedPeriod === "week" ? "esta semana" : selectedPeriod === "month" ? "este mês" : "este ano"}`}
            </p>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Contactos Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeContactsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Contactos não arquivados
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <ActiveContactsDialog activeCount={activeContactsCount} />
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <ContactOriginBarChart
          contacts={currentPeriodContacts}
          previousPeriodFilteredContacts={previousPeriodFilteredContacts}
        />
      </div>

      <Separator className="my-4" />

      <h2 className="text-2xl font-bold mb-4">Detalhes dos Contactos</h2>
      <ContactListByPeriod contacts={currentPeriodContacts} selectedPeriod={selectedPeriod} />
    </div>
  );
};

export default Dashboard;