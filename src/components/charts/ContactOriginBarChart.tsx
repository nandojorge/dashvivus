"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';

interface ContactOriginBarChartProps {
  contacts: Contact[];
  previousPeriodOriginCounts: { [key: string]: number };
}

const ContactOriginBarChart: React.FC<ContactOriginBarChartProps> = ({ contacts, previousPeriodOriginCounts }) => {
  const data = React.useMemo(() => {
    const currentOriginCounts: { [key: string]: number } = {};
    const allOrigins = new Set<string>();

    contacts.forEach(contact => {
      const origin = contact.origemcontacto || 'desconhecida'; // Ensure 'desconhecida' is lowercase
      currentOriginCounts[origin] = (currentOriginCounts[origin] || 0) + 1;
      allOrigins.add(origin);
    });

    // Add origins from previous period that might not be in current period
    Object.keys(previousPeriodOriginCounts).forEach(origin => allOrigins.add(origin));

    return Array.from(allOrigins).map(origin => ({
      name: origin,
      currentValue: currentOriginCounts[origin] || 0,
      previousValue: previousPeriodOriginCounts[origin] || 0,
    }));
  }, [contacts, previousPeriodOriginCounts]);

  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Calculate dynamic height for the chart based on number of bars
  // Each category (with two bars) needs about 45px height, plus some padding for top/bottom and legend
  const minCategoryHeight = 45; // Increased from 35 to 45 for more spacing between categories
  const baseChartPadding = 100; // Space for title, legend, and chart margins
  const dynamicChartHeight = data.length > 0
    ? Math.max(150, data.length * minCategoryHeight + baseChartPadding)
    : 150; // Minimum height of 150px when no data

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Origem dos Contactos</CardTitle>
      </CardHeader>
      <CardContent style={{ height: dynamicChartHeight }} className="p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 80, // Increased left margin for Y-axis labels
                bottom: 5,
              }}
              barGap={2} // Reduz o espaçamento entre as barras do mesmo grupo
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tickLine={false} axisLine={false} className="text-sm" />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                className="text-sm"
                width={70}
                interval={0}
                tickFormatter={capitalizeFirstLetter} // Apply formatter here
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => {
                  if (name === "Contactos Atuais" || name === "Período Anterior") {
                    return [value, name];
                  }
                  return value;
                }}
                labelFormatter={(label: string) => capitalizeFirstLetter(label)} // Also format tooltip label
              />
              <Legend
                formatter={(value) => {
                  if (value === "Período Anterior") {
                    return <span className="text-foreground">{value}</span>;
                  }
                  return value;
                }}
              />
              <Bar dataKey="currentValue" name="Contactos Atuais" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16} />
              <Bar dataKey="previousValue" name="Período Anterior" fill="hsl(var(--secondary-darker))" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum contacto para exibir a origem neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactOriginBarChart;