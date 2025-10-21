"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/api/contacts";
import { Contact } from "@/types/contact";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Users, TrendingUp, TrendingDown, CheckCircle, Percent } from "lucide-react";
import {
  isToday, isThisWeek, isThisMonth, isThisYear, parseISO,
  subDays, subWeeks, subMonths, subYears,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";
import ContactOriginBarChart from "@/components/charts/ContactOriginBarChart";
import { cn } from "@/lib/utils";

type FilterPeriod = "today" | "week" | "month" | "year" | "all";

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
    case "all":
      return { start: new Date(0), end: now };
    default:
      return { start: now, end: now };
  }
  return { start, end };
};

// Helper function to filter items (contacts) by period
const getPeriodFilter = (itemDate: Date, period: FilterPeriod) => {
  const now = new Date();
  switch (period) {
    case "today":
      return isToday(itemDate);
    case "week":
      return isThisWeek(itemDate, { weekStartsOn: 0, locale: ptBR });
    case "month":
      return isThisMonth(itemDate);
    case "year":
      return isThisYear(itemDate);
    case "all":
      return true;
    default:
      return false;
  }
};

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("today");

  const { data: contacts, isLoading, isError, error } = useQuery<Contact[], Error>({
    queryKey: ["contacts"],
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
    }).map((contact, index) => {
      let assignedOrigin = contact.origemcontacto ? contact.origemcontacto.toLowerCase() : '';
      if (!assignedOrigin) {
        assignedOrigin = origins[Math.floor(Math.random() * origins.length)];
      }

      const mockStatus = (index % 5 === 0) ? "Convertido" : contact.status;

      return {
        ...contact,
        origemcontacto: assignedOrigin,
        status: mockStatus,
      };
    });
  };

  const filteredContacts = useMemo(() => {
    return processContactsForPeriod(contacts, (contactDate) => getPeriodFilter(contactDate, selectedPeriod));
  }, [contacts, selectedPeriod]);

  // Calculate previous period contacts
  const previousPeriodFilteredContacts = useMemo(() => {
    if (!contacts || selectedPeriod === "all") return [];
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now);
    return processContactsForPeriod(contacts, (contactDate) => isWithinInterval(contactDate, { start, end }));
  }, [contacts, selectedPeriod]);

  // Calculate origin counts for previous period
  const previousPeriodOriginCounts = useMemo(() => {
    if (selectedPeriod === "all") return {};
    const counts: { [key: string]: number } = {};
    previousPeriodFilteredContacts.forEach(item => {
      const origin = item.origemcontacto || 'desconhecida';
      counts[origin] = (counts[origin] || 0) + 1;
    });
    return counts;
  }, [previousPeriodFilteredContacts, selectedPeriod]);

  const filteredContactsCount = useMemo(() => {
    return filteredContacts.length;
  }, [filteredContacts]);

  const activeContactsCount = useMemo(() => {
    return filteredContacts.filter(contact => contact.arquivado === "nao").length;
  }, [filteredContacts]);

  const convertedContactsCount = useMemo(() => {
    return filteredContacts.filter(contact => contact.status === "Convertido").length;
  }, [filteredContacts]);

  const previousPeriodContactsCount = useMemo(() => {
    if (!contacts || selectedPeriod === "all") return 0;
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now);
    return contacts.filter((contact) => {
      if (!contact.dataregisto || typeof contact.dataregisto !== 'string') return false;
      const contactDate = parseISO(contact.dataregisto);
      return !isNaN(contactDate.getTime()) && isWithinInterval(contactDate, { start: start, end: end });
    }).length;
  }, [contacts, selectedPeriod]);

  const previousPeriodConvertedContactsCount = useMemo(() => {
    if (!contacts || selectedPeriod === "all") return 0;
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now);
    return contacts.filter((contact, index) => {
      if (!contact.dataregisto || typeof contact.dataregisto !== 'string') return false;
      const contactDate = parseISO(contact.dataregisto);
      const mockStatus = (index % 5 === 0) ? "Convertido" : contact.status;
      return !isNaN(contactDate.getTime()) && isWithinInterval(contactDate, { start: start, end: end }) && mockStatus === "Convertido";
    }).length;
  }, [contacts, selectedPeriod]);

  // New: Calculate Conversion Percentage
  const conversionPercentage = useMemo(() => {
    if (filteredContactsCount === 0) return 0;
    return (convertedContactsCount / filteredContactsCount) * 100;
  }, [convertedContactsCount, filteredContactsCount]);

  // New: Calculate Previous Period Conversion Percentage
  const previousConversionPercentage = useMemo(() => {
    if (previousPeriodContactsCount === 0) return 0;
    return (previousPeriodConvertedContactsCount / previousPeriodContactsCount) * 100;
  }, [previousPeriodConvertedContactsCount, previousPeriodContactsCount]);


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
      case "all":
        return "Todos";
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
      case "all":
        return "N/A";
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
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Dashboard Vivusfisio</h1>
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
        <h1 className="text-3xl font-bold">Dashboard Vivusfisio</h1>
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
      <h1 className="text-3xl font-bold">Dashboard Vivusfisio</h1>
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
          variant={selectedPeriod === "all" ? "default" : "outline"}
          onClick={() => setSelectedPeriod("all")}
        >
          Todos
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2"> {/* Alterado para flexbox com rolagem */}
        <Card className="min-w-[280px] flex-shrink-0"> {/* Adicionado min-w e flex-shrink-0 */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contactos
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 flex items-center justify-center">
              <Users className="h-4 w-4 text-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredContactsCount}</div>
            <p className="text-xs text-muted-foreground">
              Ativos: {activeContactsCount}
            </p>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                <span className="text-foreground">{getPreviousPeriodLabel(selectedPeriod)}:</span>
                <span className={cn("ml-1", getTrendTextColor(filteredContactsCount, previousPeriodContactsCount))}>
                  {previousPeriodContactsCount}
                </span>
                {getTrendIcon(filteredContactsCount, previousPeriodContactsCount)}
              </p>
            )}
            {selectedPeriod === "all" && (
              <p className="text-xs text-muted-foreground">
                {getPreviousPeriodLabel(selectedPeriod)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cartão para Convertidos */}
        <Card className="min-w-[280px] flex-shrink-0"> {/* Adicionado min-w e flex-shrink-0 */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Convertidos
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertedContactsCount}</div>
            <p className="text-xs text-muted-foreground">
              Contactos com status "Convertido"
            </p>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                <span className="text-foreground">{getPreviousPeriodLabel(selectedPeriod)}:</span>
                <span className={cn("ml-1", getTrendTextColor(convertedContactsCount, previousPeriodConvertedContactsCount))}>
                  {previousPeriodConvertedContactsCount}
                </span>
                {getTrendIcon(convertedContactsCount, previousPeriodConvertedContactsCount)}
              </p>
            )}
            {selectedPeriod === "all" && (
              <p className="text-xs text-muted-foreground">
                {getPreviousPeriodLabel(selectedPeriod)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Novo Cartão para Percentagem de Conversão */}
        <Card className="min-w-[280px] flex-shrink-0"> {/* Adicionado min-w e flex-shrink-0 */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conversão
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 flex items-center justify-center">
              <Percent className="h-4 w-4 text-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Percentagem de contactos convertidos
            </p>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                <span className="text-foreground">{getPreviousPeriodLabel(selectedPeriod)}:</span>
                <span className={cn("ml-1", getTrendTextColor(conversionPercentage, previousConversionPercentage))}>
                  {previousConversionPercentage.toFixed(1)}%
                </span>
                {getTrendIcon(conversionPercentage, previousConversionPercentage)}
              </p>
            )}
            {selectedPeriod === "all" && (
              <p className="text-xs text-muted-foreground">
                {getPreviousPeriodLabel(selectedPeriod)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contact Origin Bar Chart - apenas com contactos */}
      <ContactOriginBarChart
        contacts={filteredContacts}
        previousPeriodOriginCounts={previousPeriodOriginCounts}
      />
    </div>
  );
};

export default Dashboard;