"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/api/contacts";
import { getLeads } from "@/api/leads"; // Importar a função getLeads
import { Contact } from "@/types/contact";
import { Lead } from "@/types/lead"; // Importar o tipo Lead
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Users, TrendingUp, TrendingDown, UserPlus } from "lucide-react"; // Adicionar UserPlus para leads
import {
  isToday, isThisWeek, isThisMonth, isThisYear, parseISO,
  subDays, subWeeks, subMonths, subYears,
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  isWithinInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";
import ContactOriginBarChart from "@/components/charts/ContactOriginBarChart";
import { cn } from "@/lib/utils";

type FilterPeriod = "today" | "week" | "month" | "year" | "all"; // Added "all"

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
    case "all": // For "all", previous period concept doesn't apply directly for comparison
      return { start: new Date(0), end: now }; // Return a very wide range, but we'll handle display separately
    default:
      return { start: now, end: now }; // Should not happen
  }
  return { start, end };
};

// Helper function to filter items (contacts or leads) by period
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
      return true; // No date filtering for "all"
    default:
      return false;
  }
};

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("today");

  const { data: contacts, isLoading: isLoadingContacts, isError: isErrorContacts, error: errorContacts } = useQuery<Contact[], Error>({
    queryKey: ["contacts"],
    queryFn: getContacts,
  });

  const { data: leads, isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useQuery<Lead[], Error>({
    queryKey: ["leads"],
    queryFn: getLeads,
  });

  // Define origins in lowercase for consistency
  const origins = ["website", "referral", "social media", "email marketing", "direct"];

  const processItemsForPeriod = <T extends Contact | Lead>(allItems: T[] | undefined, periodFilterFn: (itemDate: Date) => boolean) => {
    if (!allItems) return [];
    return allItems.filter((item) => {
      if (!item.dataregisto || typeof item.dataregisto !== 'string') {
        return false;
      }
      const itemDate = parseISO(item.dataregisto);
      if (isNaN(itemDate.getTime())) {
        console.warn(`Invalid date string for item ${item.id}: ${item.dataregisto}`);
        return false;
      }
      return periodFilterFn(itemDate);
    }).map(item => {
      let assignedOrigin = item.origemcontacto ? item.origemcontacto.toLowerCase() : ''; // Normalize to lowercase
      if (!assignedOrigin) {
        assignedOrigin = origins[Math.floor(Math.random() * origins.length)]; // Assign mock origin (already lowercase)
        // console.warn(`Item ${item.id} (${item.nome}) has no 'origemcontacto'. Assigning mock origin: ${assignedOrigin}`);
      }
      return {
        ...item,
        origemcontacto: assignedOrigin
      };
    });
  };

  const filteredContacts = useMemo(() => {
    return processItemsForPeriod(contacts, (contactDate) => getPeriodFilter(contactDate, selectedPeriod));
  }, [contacts, selectedPeriod]);

  const filteredLeads = useMemo(() => {
    return processItemsForPeriod(leads, (leadDate) => getPeriodFilter(leadDate, selectedPeriod));
  }, [leads, selectedPeriod]);

  // Calculate previous period contacts
  const previousPeriodFilteredContacts = useMemo(() => {
    if (!contacts || selectedPeriod === "all") return []; // No previous period comparison for "all"
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now);
    return processItemsForPeriod(contacts, (contactDate) => isWithinInterval(contactDate, { start, end }));
  }, [contacts, selectedPeriod]);

  // Calculate previous period leads
  const previousPeriodFilteredLeads = useMemo(() => {
    if (!leads || selectedPeriod === "all") return []; // No previous period comparison for "all"
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now);
    return processItemsForPeriod(leads, (leadDate) => isWithinInterval(leadDate, { start, end }));
  }, [leads, selectedPeriod]);

  // Calculate origin counts for previous period
  const previousPeriodOriginCounts = useMemo(() => {
    if (selectedPeriod === "all") return {}; // No previous period comparison for "all"
    const counts: { [key: string]: number } = {};
    [...previousPeriodFilteredContacts, ...previousPeriodFilteredLeads].forEach(item => {
      const origin = item.origemcontacto || 'desconhecida';
      counts[origin] = (counts[origin] || 0) + 1;
    });
    return counts;
  }, [previousPeriodFilteredContacts, previousPeriodFilteredLeads, selectedPeriod]);

  const filteredContactsCount = useMemo(() => {
    return filteredContacts.length;
  }, [filteredContacts]);

  const activeContactsCount = useMemo(() => {
    return filteredContacts.filter(contact => contact.arquivado === "nao").length;
  }, [filteredContacts]);

  const filteredLeadsCount = useMemo(() => {
    return filteredLeads.length;
  }, [filteredLeads]);

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

  const previousPeriodLeadsCount = useMemo(() => {
    if (!leads || selectedPeriod === "all") return 0;
    const now = new Date();
    const { start, end } = getPreviousPeriodInterval(selectedPeriod, now);
    return leads.filter((lead) => {
      if (!lead.dataregisto || typeof lead.dataregisto !== 'string') return false;
      const leadDate = parseISO(lead.dataregisto);
      return !isNaN(leadDate.getTime()) && isWithinInterval(leadDate, { start: start, end: end });
    }).length;
  }, [leads, selectedPeriod]);

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
        return "N/A"; // No meaningful previous period for "all"
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

  if (isLoadingContacts || isLoadingLeads) {
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

  if (isErrorContacts || isErrorLeads) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Dashboard Vivusfisio</h1>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao carregar os dados: {errorContacts?.message || errorLeads?.message || "Erro desconhecido."}
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

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
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

        {/* Novo Cartão para Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leads
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-foreground" /> {/* Ícone para Leads */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLeadsCount}</div>
            <p className="text-xs text-muted-foreground">
              Novas leads: {filteredLeads.filter(lead => lead.status === "Novo").length} {/* Exemplo de métrica para leads */}
            </p>
            {selectedPeriod !== "all" && (
              <p className="text-xs flex items-center">
                <span className="text-foreground">{getPreviousPeriodLabel(selectedPeriod)}:</span>
                <span className={cn("ml-1", getTrendTextColor(filteredLeadsCount, previousPeriodLeadsCount))}>
                  {previousPeriodLeadsCount}
                </span>
                {getTrendIcon(filteredLeadsCount, previousPeriodLeadsCount)}
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

      {/* Contact Origin Bar Chart - agora inclui leads para a contagem de origem */}
      <ContactOriginBarChart
        contacts={[...filteredContacts, ...filteredLeads]} // Passar contactos e leads para o gráfico de origem
        previousPeriodOriginCounts={previousPeriodOriginCounts}
      />
    </div>
  );
};

export default Dashboard;