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
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegistrationTrendChartProps {
  contacts: Contact[];
  selectedPeriod: "today" | "week" | "month" | "year" | "all";
}

const RegistrationTrendChart: React.FC<RegistrationTrendChartProps> = ({ contacts, selectedPeriod }) => {
  const data = React.useMemo(() => {
    if (!contacts || contacts.length === 0) return [];

    const now = new Date();
    const aggregatedData: { [key: string]: number } = {};
    let dateFormat: string;
    let aggregateBy: (date: Date) => Date;
    let addUnit: (date: Date, amount: number) => Date;

    switch (selectedPeriod) {
      case "today":
      case "week":
        // For 'today' and 'week', aggregate by day
        dateFormat = 'dd/MM';
        aggregateBy = startOfDay;
        addUnit = addDays;
        break;
      case "month":
        // For 'month', aggregate by week
        dateFormat = 'dd/MM'; // Display start of week
        aggregateBy = (date) => startOfWeek(date, { weekStartsOn: 0, locale: ptBR });
        addUnit = addWeeks;
        break;
      case "year":
        // For 'year', aggregate by month
        dateFormat = 'MMM/yy';
        aggregateBy = startOfMonth;
        addUnit = addMonths;
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
          const key = format(aggregateBy(date), dateFormat, { locale: ptBR });
          aggregatedData[key] = (aggregatedData[key] || 0) + 1;
        }
      }
    });

    // Generate a series of dates for the last 20 periods
    const chartData: { name: string; registrations: number }[] = [];
    let currentDate = aggregateBy(now);

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
  }, [contacts, selectedPeriod]);

  const getChartTitle = () => {
    switch (selectedPeriod) {
      case "today":
      case "week":
        return "Registos Diários (Últimos 20 Dias)";
      case "month":
        return "Registos Semanais (Últimas 20 Semanas)";
      case "year":
        return "Registos Mensais (Últimos 20 Meses)";
      case "all":
        return "Registos Anuais (Últimos 20 Anos)";
      default:
        return "Evolução Temporal dos Registos";
    }
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
              <XAxis dataKey="name" className="text-xs" />
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