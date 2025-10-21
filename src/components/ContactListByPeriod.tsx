"use client";

import React, { useMemo } from "react";
import { Contact } from "@/types/contact";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

type FilterPeriod = "today" | "week" | "month" | "year" | "all";

interface ContactListByPeriodProps {
  contacts: Contact[];
  selectedPeriod: FilterPeriod;
}

const ContactListByPeriod: React.FC<ContactListByPeriodProps> = ({
  contacts,
  selectedPeriod,
}) => {
  const groupedContacts = useMemo(() => {
    if (!contacts || contacts.length === 0) {
      return [];
    }

    // Special handling for "today" to show all historical days with contacts
    if (selectedPeriod === "today") {
      const dailyGroups: { [key: string]: Contact[] } = {};
      contacts.forEach((contact) => {
        if (contact.dataregisto) {
          const date = parseISO(contact.dataregisto);
          if (!isNaN(date.getTime())) {
            const dayKey = format(date, "yyyy-MM-dd"); // Group by day
            if (!dailyGroups[dayKey]) {
              dailyGroups[dayKey] = [];
            }
            dailyGroups[dayKey].push(contact);
          }
        }
      });

      // Convert to array of groups, sorted by date descending
      return Object.keys(dailyGroups)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .map((dayKey) => ({
          label: format(parseISO(dayKey), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          contacts: dailyGroups[dayKey], // Keep contacts array for count
        }));
    } else {
      // Existing logic for other periods, with improved sorting
      const groupedByDate: { [key: string]: { date: Date; contacts: Contact[] } } = {};

      contacts.forEach((contact) => {
        if (contact.dataregisto) {
          const contactDate = parseISO(contact.dataregisto);
          if (!isNaN(contactDate.getTime())) {
            let groupStartDate: Date;
            let groupKey: string;

            switch (selectedPeriod) {
              case "week":
                groupStartDate = startOfWeek(contactDate, { weekStartsOn: 0, locale: ptBR });
                groupKey = format(groupStartDate, "yyyy-MM-dd"); // Use sortable key
                break;
              case "month":
                groupStartDate = startOfMonth(contactDate);
                groupKey = format(groupStartDate, "yyyy-MM"); // Use sortable key
                break;
              case "year":
              case "all": // Group by year for "all"
                groupStartDate = startOfYear(contactDate);
                groupKey = format(groupStartDate, "yyyy"); // Use sortable key
                break;
              default:
                groupStartDate = contactDate; // Fallback
                groupKey = format(contactDate, "yyyy-MM-dd");
            }

            if (!groupedByDate[groupKey]) {
              groupedByDate[groupKey] = { date: groupStartDate, contacts: [] };
            }
            groupedByDate[groupKey].contacts.push(contact);
          }
        }
      });

      // Convert to array of groups, sorted by date descending
      return Object.keys(groupedByDate)
        .sort((a, b) => groupedByDate[b].date.getTime() - groupedByDate[a].date.getTime())
        .map((key) => {
          let label: string;
          switch (selectedPeriod) {
            case "week":
              label = format(groupedByDate[key].date, "dd 'de' MMM", { locale: ptBR });
              break;
            case "month":
              label = format(groupedByDate[key].date, "MMMM 'de' yyyy", { locale: ptBR });
              break;
            case "year":
            case "all":
              label = format(groupedByDate[key].date, "yyyy", { locale: ptBR });
              break;
            default:
              label = key;
          }
          return {
            label: label,
            contacts: groupedByDate[key].contacts,
          };
        });
    }
  }, [contacts, selectedPeriod]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {selectedPeriod === "today"
            ? "Contactos por Dia (Histórico)"
            : `Contactos (${groupedContacts.length} grupos)`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {groupedContacts.length > 0 ? (
          <div className="space-y-4">
            {groupedContacts.map((group, index) => (
              <div key={group.label}>
                <h3 className="text-lg font-semibold mb-2">
                  {group.label} ({group.contacts.length})
                </h3>
                {/* Removida a lista detalhada de contactos */}
                {index < groupedContacts.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum contacto encontrado para este período.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactListByPeriod;