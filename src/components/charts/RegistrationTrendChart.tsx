"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';
import {
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isBefore,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isSameMonth, // Importar isSameMonth
  isSameYear,  // Importar isSameYear
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegistrationTrendChartProps {
  contacts: Contact[];
  selectedPeriod: "today" | "week" | "month" | "year" | "all";
  isRealTime: boolean; // Nova prop
}

const RegistrationTrendChart: React.FC<RegistrationTrendChartProps> = ({ contacts, selectedPeriod, isRealTime }) => {
  const data = React.useMemo(() => {
    if (!contacts || contacts.length === 0) return [];

    const now = new Date();
    const aggregatedData: { [key: string]: number } = {};
    let dateFormat: string;
    let aggregateBy: (date: Date) => Date;
    let addUnit: (date: Date, amount: number) => Date;

    switch (selectedPeriod) {
      case "today":
        dateFormat = 'dd/MM';
        aggregateBy = startOfDay;
        addUnit = addDays;
        break;
      case "week":
        dateFormat = 'dd/MM'; // Display start of week
        aggregateBy = (date) => startOfWeek(date, { weekStartsOn: 0, locale: ptBR });
        addUnit = addWeeks;
        break;
      case "month":
        // For 'month', aggregate by month
        dateFormat = 'MMM/yy'; // Display month and year
        aggregateBy = startOfMonth;
        addUnit = addMonths;
        break;
      case "year":
        // For 'year', aggregate by year
        dateFormat = 'yyyy';
        aggregateBy = startOfYear;
        addUnit = addYears;
        break;
      case "all":
        // For 'all', aggregate by year
        dateFormat = 'yyyy';
        aggregateBy = startOfYear;
        addUnit = addYears;
        break;
      default:
        dateFormat = 'dd/MM/yyyy';
        aggregateBy = startOfDay;
        addUnit = addDays;
    }

    contacts.forEach(contact => {
      if (contact.dataregisto) {
        const date = parseISO(contact.dataregisto);
        if (!isNaN(date.getTime())) {
          let shouldInclude = true;

          // Aplicar filtro de tempo real para o período atual
          if (isRealTime) {
            if (selectedPeriod === "month") {
              // Se for o mês atual e a data for posterior a 'now', exclui
              if (isSameMonth(date, now) && !isBefore(date, now)) {
                shouldInclude = false;
              }
            } else if (selectedPeriod === "year") {
              // Se for o ano atual e a data for posterior a 'now', exclui
              if (isSameYear(date, now) && !isBefore(date, now)) {
                shouldInclude = false;
              }
            }
          }

          if (shouldInclude) {
            const key = format(aggregateBy(date), dateFormat, { locale: ptBR });
            aggregatedData[key] = (aggregatedData[key] || 0) + 1;
          }
        }
      }
    });

    // Generate a series of dates for the last 20 periods
    const chartData: { name: string; registrations: number }[] = [];
    
    // Find the earliest contact date to ensure we don't go too far back
    const earliestContactDate = contacts.reduce((minDate, contact) => {
      if (contact.dataregisto) {
        const date = parseISO(contact.dataregisto);
        if (!isNaN(date.getTime()) && isBefore(date, minDate)) {
          return date;
        }
      }
      return minDate;
    }, now);

    // Go back up to 20 periods, or until the earliest contact date
    for (let i = 0; i < 20; i++) {
      const periodStart = aggregateBy(addUnit(now, -i));
      if (isBefore(periodStart, aggregateBy(earliestContactDate)) && i > 0) {
        break; // Stop if we go before the earliest contact date
      }
      const key = format(periodStart, dateFormat, { locale: ptBR });
      chartData.unshift({
        name: key,
        registrations: aggregatedData[key] || 0,
      });
    }

    return chartData;
  }, [contacts, selectedPeriod, isRealTime]); // Adicionar isRealTime como dependência

  const getChartTitle = () => {
    let title = "Evolução Temporal dos Registos";
    switch (selectedPeriod) {
      case "today":
        title = "Registos Diários (Últimos 20 Dias)";
        break;
      case "week":
        title = "Registos Semanais (Últimas 20 Semanas)";
        break;
      case "month":
        title = "Registos Mensais (Últimos 20 Meses)";
        break;
      case "year":
        title = "Registos Anuais (Últimos 20 Anos)";
        break;
      case "all":
        title = "Registos Anuais (Últimos 20 Anos)";
        break;
    }
    if (isRealTime && (selectedPeriod === "month" || selectedPeriod === "year")) {
      title += " (Tempo Real)";
    }
    return title;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" interval={2} />
              <YAxis allowDecimals={false} className="text-xs" />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value} registos`, 'Registos']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
                name="Registos"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum registo para exibir neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationTrendChart;