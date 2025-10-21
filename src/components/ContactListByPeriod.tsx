"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';

interface ContactListByPeriodProps {
  contacts: Contact[];
  selectedPeriod: "today" | "week" | "month" | "year" | "all";
}

const ContactListByPeriod: React.FC<ContactListByPeriodProps> = ({ contacts, selectedPeriod }) => {
  const groupedContacts = React.useMemo(() => {
    const groups: { [key: string]: Contact[] } = {};

    contacts.forEach(contact => {
      if (!contact.dataregisto) return;

      const contactDate = parseISO(contact.dataregisto);
      if (isNaN(contactDate.getTime())) {
        console.warn(`Invalid date string for contact ${contact.id}: ${contact.dataregisto}`);
        return;
      }

      let key: string;
      let label: string;

      switch (selectedPeriod) {
        case "today": // Agrupar por dia
          key = format(contactDate, 'yyyy-MM-dd');
          label = format(contactDate, 'dd MMMM yyyy', { locale: ptBR });
          break;
        case "week": // Agrupar por semana
          const weekStart = startOfWeek(contactDate, { weekStartsOn: 0, locale: ptBR });
          const weekEnd = endOfWeek(contactDate, { weekStartsOn: 0, locale: ptBR });
          key = format(weekStart, 'yyyy-MM-dd'); // Usar o início da semana como chave
          label = `Semana ${format(weekStart, 'w', { locale: ptBR })} (${format(weekStart, 'dd MMM', { locale: ptBR })} - ${format(weekEnd, 'dd MMM', { locale: ptBR })})`;
          break;
        case "month": // Agrupar por mês
          key = format(contactDate, 'yyyy-MM');
          label = format(contactDate, 'MMMM yyyy', { locale: ptBR });
          break;
        case "year": // Agrupar por ano
          key = format(contactDate, 'yyyy');
          label = format(contactDate, 'yyyy', { locale: ptBR });
          break;
        case "all": // Agrupar por ano para "Todos"
        default:
          key = format(contactDate, 'yyyy');
          label = format(contactDate, 'yyyy', { locale: ptBR });
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push({ ...contact, _periodLabel: label }); // Adicionar label para exibição
    });

    // Sort groups by date (descending)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      // For 'all' period, sort by year descending
      if (selectedPeriod === "all" || selectedPeriod === "year") {
        return parseInt(b) - parseInt(a);
      }
      // For other periods, sort by date key descending
      return parseISO(b).getTime() - parseISO(a).getTime();
    });

    return sortedKeys.map(key => ({
      periodKey: key,
      periodLabel: groups[key][0]?._periodLabel || key, // Usar o label armazenado
      contacts: groups[key],
      count: groups[key].length,
    }));
  }, [contacts, selectedPeriod]);

  const getTitle = () => {
    switch (selectedPeriod) {
      case "today":
        return "Contactos de Hoje";
      case "week":
        return "Contactos desta Semana";
      case "month":
        return "Contactos deste Mês";
      case "year":
        return "Contactos deste Ano";
      case "all":
        return "Todos os Contactos (por Ano)";
      default:
        return "Lista de Contactos";
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {groupedContacts.length > 0 ? (
          <div className="space-y-4">
            {groupedContacts.map((group, index) => (
              <React.Fragment key={group.periodKey}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{group.periodLabel}</span>
                  <span className="text-muted-foreground">{group.count} contactos</span>
                </div>
                {index < groupedContacts.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum contacto registado neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactListByPeriod;