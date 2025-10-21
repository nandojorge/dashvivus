"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/api/contacts";
import { Contact } from "@/types/contact";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Users, TrendingUp, TrendingDown } from "lucide-react";
import {
  isToday, isThisWeek, isThisMonth, isThisYear, parseISO,
  subDays, subWeeks, subMonths, subYears,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";
import ContactOriginBarChart from "@/components/charts/ContactOriginBarChart";
import { cn } from "@/lib/utils"; // Importar cn para combinar classes Tailwind
import { useNavigate } from "react-router-dom"; // Import useNavigate

type FilterPeriod = "today" | "week" | "month" | "year";

// Helper function to get previous period interval
const getPreviousPeriodInterval = (currentPeriod: FilterPeriod, now: Date) => {
  let start: Date;
  let end: Date;

  switch (currentPeriod) {
    case "today":
      start = startOfDay(subDays(now, 1));
      end = endOfDay(subDays(now, 1));
      break;
    case "week":
      start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0, locale: ptBR });
      end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0, locale: ptBR });
      break;
    case "month":
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
      break;
    case "year":
      start = startOfYear(subYears(now, 1));
      end = endOfYear(subYears(now, 1));
      break;
    default:
      return { start: now, end: now }; // Should not happen
  }
  return { start, end };
};

// Helper function to filter contacts by period
const getPeriodFilter = (contactDate: Date, period: FilterPeriod) => {
  const now = new Date();
  switch (period) {
    case "today":
      return isToday(contactDate);
    case "week":
      return isThisWeek(contactDate, { weekStartsOn: 0, locale: ptBR });
    case "month":
      return isThisMonth(contactDate);
    case "year":
      return isThisYear(contactDate);
    default:
      return false;
  }
};

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("today");
  const navigate = useNavigate(); // Initialize useNavigate

  const { data: contacts, isLoading, isError, error } = useQuery<Contact[], Error>({
    queryKey: ["contacts"],
    queryFn: getContacts,
  });

  const origins = ["Website", "Referral", "Social Media", "Email Marketing", "Direct"]; // Define origins once

  const processContactsForPeriod = (allContacts: Contact[] | undefined, periodFilterFn: (contactDate: Date) => boolean) => {
    if (!allContacts) return [];
    return allContacts.filter((contact) => {
      if (!contact.dataregisto || typeof contact.dataregisto !== 'string') {
        return false;
      }
      const contactDate = parseISO(contact.dataregisto);
      if (isNaN(contactDate.getTime())) {
        console.warn(`Invalid date string for contact ${contact.id}: ${contact.dataregisto}`);
        return false;
      }
      return periodFilterFn(contactDate);
    }).map(contact => ({
      ...contact,
      origemcontacto: contact.origemcontacto || origins[Math.floor(Math.random() * origins.length)] // Mock origin if not present
    }));
  };

  const filteredContacts = useMemo(() => {
    return processContactsForPeriod(contacts, (contactDate) => getPeriodFilter(contactDate, selectedPeriod));
  }, [contacts, selectedPeriod]);

  // Calculate previous period contacts
  const previousPeriodFilteredContacts = useMemo(() => {
    if (!contacts) return [];
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now);
    return processContactsForPeriod(contacts, (contactDate) => isWithinInterval(contactDate, { start, end }));
  }, [contacts, selectedPeriod]);

  // Calculate origin counts for previous period
  const previousPeriodOriginCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    previousPeriodFilteredContacts.forEach(contact => {
      const origin = contact.origemcontacto || 'Desconhecida';
      counts[origin] = (counts[origin] || 0) + 1;
    });
    return counts;
  }, [previousPeriodFilteredContacts]);

  const filteredContactsCount = useMemo(() => {
    return filteredContacts.length;
  }, [filteredContacts]);

  const activeContactsCount = useMemo(() => {
    return filteredContacts.filter(contact => contact.arquivado === "nao").length;
  }, [filteredContacts]);

  const previousPeriodContactsCount = useMemo(() => {
    if (!contacts) return 0;
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now);
    return contacts.filter((contact) => {
      if (!contact.dataregisto || typeof contact.dataregisto !== 'string') {
        return false;
      }
      const contactDate = parseISO(contact.dataregisto);

      if (isNaN(contactDate.getTime())) {
        return false;
      }
      return isWithinInterval(contactDate, { start: start, end: end });
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

  const getTrendIcon = (currentValue: number, previousValue: number) => {
    if (currentValue > previousValue) {
      return <TrendingUp className="h-4 w-4 text-green-500 ml-1" />;
    } else if (currentValue < previousValue) {
      return <TrendingDown className="h-4 w-4 text-red-500 ml-1" />;
    }
    return null;
  };

  const getTrendTextColor = (currentValue: number, previousValue: number) => {
    if (currentValue > previousValue) {
      return "text-green-500";
    } else if (currentValue < previousValue) {
      return "text-red-500";
    }
    return "text-muted-foreground"; // Cor padrão se não houver alteração
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
        <Button
          variant="outline"
          onClick={() => navigate("/contacts")} // Button to navigate to ContactsPage
          className="ml-auto" // Push button to the right
        >
          <Users className="h-4 w-4 mr-2" /> Ver Todos os Contactos
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contactos
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 flex items-center justify-center"> {/* Wrapper para o ícone redondo */}
              <Users className="h-4 w-4 text-primary" /> {/* Ícone com cor primária */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredContactsCount}</div>
            <p className="text-xs text-muted-foreground">
              Ativos: {activeContactsCount}
            </p>
            <p className={cn("text-xs flex items-center", getTrendTextColor(filteredContactsCount, previousPeriodContactsCount))}>
              {getPreviousPeriodLabel(selectedPeriod)}: {previousPeriodContactsCount}
              {getTrendIcon(filteredContactsCount, previousPeriodContactsCount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Origin Bar Chart */}
      <ContactOriginBarChart
        contacts={filteredContacts}
        previousPeriodOriginCounts={previousPeriodOriginCounts}
      />
    </div>
  );
};

export default Dashboard;