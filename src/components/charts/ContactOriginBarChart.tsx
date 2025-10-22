"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'; // Removido Tooltip
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';
import { cn } from '@/lib/utils';

interface ContactOriginBarChartProps {
  contacts: Contact[];
  previousPeriodFilteredContacts: Contact[];
}

const ContactOriginBarChart: React.FC<ContactOriginBarChartProps> = ({ contacts, previousPeriodFilteredContacts }) => {
  const data = React.useMemo(() => {
    const originCounts: { [key: string]: number } = {};
    const previousOriginCounts: { [key: string]: number } = {};

    contacts.forEach(contact => {
      const origin = contact.origemcontacto || 'desconhecida';
      originCounts[origin] = (originCounts[origin] || 0) + 1;
    });

    previousPeriodFilteredContacts.forEach(contact => {
      const origin = contact.origemcontacto || 'desconhecida';
      previousOriginCounts[origin] = (previousOriginCounts[origin] || 0) + 1;
    });

    const allOrigins = Array.from(new Set([...Object.keys(originCounts), ...Object.keys(previousOriginCounts)]));

    return allOrigins.map(origin => ({
      name: origin.charAt(0).toUpperCase() + origin.slice(1), // Capitalize for display
      current: originCounts[origin] || 0,
      previous: previousOriginCounts[origin] || 0,
    })).sort((a, b) => b.current - a.current); // Sort by current count descending
  }, [contacts, previousPeriodFilteredContacts]);

  const dynamicChartHeight = Math.max(250, data.length * 40); // Minimum height of 250px, then 40px per item

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Contactos por Origem</CardTitle>
      </CardHeader>
      <CardContent style={{ height: dynamicChartHeight }} className="p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
              <XAxis type="number" allowDecimals={false} className="text-xs" />
              <YAxis type="category" dataKey="name" width={100} className="text-xs" />
              {/* <Tooltip // Removido o Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [`${value} registos`, name === 'current' ? 'Período Atual' : 'Período Anterior']}
              /> */}
              <Legend />
              <Bar dataKey="current" fill="hsl(var(--primary))" name="Período Atual" />
              <Bar dataKey="previous" fill="hsl(var(--primary))" opacity={0.6} name="Período Anterior" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum registo por origem para exibir neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactOriginBarChart;