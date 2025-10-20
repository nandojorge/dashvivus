"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/api/contacts";
import { Contact } from "@/types/contact";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Users } from "lucide-react";
import {
  isToday, isThisWeek, isThisMonth, isThisYear, parseISO,
  subDays, subWeeks, subMonths, subYears,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";
import ContactOriginBarChart from "@/components/charts/ContactOriginBarChart"; // Import the new bar chart component

type FilterPeriod = "today" | "week" | "month" | "year";

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("today");

  const { data: contacts, isLoading, isError, error } = useQuery<Contact[], Error>({
    queryKey: ["contacts"],
    queryFn: getContacts,
  });

  const getPeriodFilter = (contactDate: Date, period: FilterPeriod) => {
    switch (period) {
      case "today":
        return isToday(contactDate);
      case "week":
        return isThisWeek(contactDate, { weekStartsOn: 0, locale: ptBR }); // Domingo como início da semana
      case "month":
        return isThisMonth(contactDate);
      case "year":
        return isThisYear(contactDate);
      default:
        return false;
    }
  };

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];

    const origins = ["Website", "Referral", "Social Media", "Email Marketing", "Direct"];

    return contacts.filter((contact) => {
      if (!contact.dataregisto || typeof contact.dataregisto !== 'string') {
        return false;
      }
      const contactDate = parseISO(contact.dataregisto);

      if (isNaN(contactDate.getTime())) {
        console.warn(`Invalid date string for contact ${contact.id}: ${contact.dataregisto}`);
        return false;
      }
      return getPeriodFilter(contactDate, selectedPeriod);
    }).map(contact => ({
      ...contact,
      origemcontacto: contact.origemcontacto || origins[Math.floor(Math.random() * origins.length)] // Mock origin if not present
    }));
  }, [contacts, selectedPeriod]);

  const filteredContactsCount = useMemo(() => {
    return filteredContacts.length;
  }, [filteredContacts]);

  const activeContactsCount = useMemo(() => {
    return filteredContacts.filter(contact => contact.arquivado === "nao").length;
  }, [filteredContacts]);

  const previousPeriodContactsCount = useMemo(() => {
    if (!contacts) return 0;

    const now = new Date();
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (selectedPeriod) {
      case "today":
        previousPeriodStart = startOfDay(subDays(now, 1));
        previousPeriodEnd = endOfDay(subDays(now, 1));
        break;
      case "week":
        previousPeriodStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0, locale: ptBR });
        previousPeriodEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0, locale: ptBR });
        break;
      case "month":
        previousPeriodStart = startOfMonth(subMonths(now, 1));
        previousPeriodEnd = endOfMonth(subMonths(now, 1));
        break;
      case "year":
        previousPeriodStart = startOfYear(subYears(now, 1));
        previousPeriodEnd = endOfYear(subYears(now, 1));
        break;
      default:
        return 0;
    }

    return contacts.filter((contact) => {
      if (!contact.dataregisto || typeof contact.dataregisto !== 'string') {
        return false;
      }
      const contactDate = parseISO(contact.dataregisto);

      if (isNaN(contactDate.getTime())) {
        return false;
      }
      return isWithinInterval(contactDate, { start: previousPeriodStart, end: previousPeriodEnd });
    }).length;
  }, [contacts, selectedPeriod]);

  const getPeriodLabel = (period: FilterPeriod) => {
    switch (period) {
      case "today":
        return "Hoje";
      case "week":
        return "Esta Semana";
      case "month":
        return "Este Mês";
      case "year":
        return "Este Ano";
      default:
        return "";
    }
  };

  const getPreviousPeriodLabel = (period: FilterPeriod) => {
    switch (period) {
      case "today":
        return "Ontem";
      case "week":
        return "Semana Anterior";
      case "month":
        return "Mês Anterior";
      case "year":
        return "Ano Anterior";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Dashboard do CRM</h1>
        <Card>
          <CardHeader>
            <CardTitle>Carregando Dados...</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[100px] w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Dashboard do CRM</h1>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao carregar os dados: {error?.message || "Erro desconhecido."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Dashboard do CRM</h1>
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedPeriod === "today" ? "default" : "outline"}
          onClick={() => setSelectedPeriod("today")}
        >
          Hoje
        </Button>
        <Button
          variant={selectedPeriod === "week" ? "default" : "outline"}
          onClick={() => setSelectedPeriod("week")}
        >
          Semana
        </Button>
        <Button
          variant={selectedPeriod === "month" ? "default" : "outline"}
          onClick={() => setSelectedPeriod("month")}
        >
          Mês
        </Button>
        <Button
          variant={selectedPeriod === "year" ? "default" : "outline"}
          onClick={() => setSelectedPeriod("year")}
        >
          Ano
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contactos {getPeriodLabel(selectedPeriod)}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredContactsCount}</div>
            <p className="text-xs text-muted-foreground">
              Ativos: {activeContactsCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {getPreviousPeriodLabel(selectedPeriod)}: {previousPeriodContactsCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Origin Bar Chart */}
      <ContactOriginBarChart contacts={filteredContacts} />
    </div>
  );
};

export default Dashboard;