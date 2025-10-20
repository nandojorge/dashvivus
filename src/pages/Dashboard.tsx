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
import { isToday, isThisWeek, isThisMonth, isThisYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type FilterPeriod = "today" | "week" | "month" | "year";

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>("today");

  const { data: contacts, isLoading, isError, error } = useQuery<Contact[], Error>({
    queryKey: ["contacts"],
    queryFn: getContacts,
  });

  const filteredContactsCount = useMemo(() => {
    if (!contacts) return 0;

    const count = contacts.filter((contact) => {
      if (!contact.dataregisto || typeof contact.dataregisto !== 'string') {
        return false;
      }
      const contactDate = parseISO(contact.dataregisto);

      if (isNaN(contactDate.getTime())) {
        console.warn(`Invalid date string for contact ${contact.id}: ${contact.dataregisto}`);
        return false;
      }

      switch (selectedPeriod) {
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
    }).length;

    return count;
  }, [contacts, selectedPeriod]);

  const activeContactsCount = useMemo(() => {
    if (!contacts) return 0;
    return contacts.filter(contact => contact.arquivado === "nao").length;
  }, [contacts]);

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
              Contactos Recebidos {getPeriodLabel(selectedPeriod)}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredContactsCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de contactos ativos: {activeContactsCount}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;