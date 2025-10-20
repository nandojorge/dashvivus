"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';

interface ContactOriginBarChartProps {
  contacts: Contact[];
}

const ContactOriginBarChart: React.FC<ContactOriginBarChartProps> = ({ contacts }) => {
  const data = React.useMemo(() => {
    const originCounts: { [key: string]: number } = {};
    contacts.forEach(contact => {
      const origin = contact.origemcontacto || 'Desconhecida'; // Default to 'Desconhecida' if origin is not set
      originCounts[origin] = (originCounts[origin] || 0) + 1;
    });

    return Object.entries(originCounts).map(([name, value]) => ({ name, value }));
  }, [contacts]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Origem dos Contactos</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-sm" />
              <YAxis tickLine={false} axisLine={false} className="text-sm" />
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
              <Bar dataKey="value" name="Número de Contactos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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