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
      const origin = contact.origemcontacto || 'Desconhecida';
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

  // Calculate dynamic height for the chart based on number of bars
  // Each category (with two bars) needs about 35px height, plus some padding for top/bottom and legend
  const minCategoryHeight = 35; // Desired height for each category (group of bars)
  const baseChartPadding = 100; // Adjusted from 120 to 100 for a tighter fit
  const dynamicChartHeight = data.length > 0
    ? Math.max(350, data.length * minCategoryHeight + baseChartPadding)
    : 350; // Minimum height of 350px

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
              />
              <Legend />
              <Bar dataKey="currentValue" name="Contactos Atuais" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16} /> {/* Aumenta a espessura da barra */}
              <Bar dataKey="previousValue" name="Período Anterior" fill="hsl(var(--secondary-darker))" radius={[0, 4, 4, 0]} barSize={16} /> {/* Aumenta a espessura da barra */}
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