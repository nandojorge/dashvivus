"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';

interface ContactCountyBarChartProps {
  contacts: Contact[]; // Contactos do período atual
  previousPeriodFilteredContacts: Contact[]; // Contactos do período anterior
}

const ContactCountyBarChart: React.FC<ContactCountyBarChartProps> = ({ contacts, previousPeriodFilteredContacts }) => {
  const data = React.useMemo(() => {
    const processContacts = (contactList: Contact[]) => {
      const countyCounts: { [key: string]: number } = {};
      contactList.forEach(contact => {
        const county = contact.concelho ? contact.concelho.toLowerCase() : 'desconhecido'; // Usar 'concelho' e normalizar para minúsculas

        // Excluir "questionar cliente" e "sem informação"
        if (county === 'questionar cliente' || county === 'sem informação') {
          return; 
        }
        countyCounts[county] = (countyCounts[county] || 0) + 1;
      });
      return countyCounts;
    };

    const currentCountyCounts = processContacts(contacts);
    const prevCountyCounts = processContacts(previousPeriodFilteredContacts);

    const allCounties = new Set<string>([
      ...Object.keys(currentCountyCounts),
      ...Object.keys(prevCountyCounts),
    ]);

    const chartData = Array.from(allCounties).map(county => {
      const currentTotal = currentCountyCounts[county] || 0;
      const previousTotal = prevCountyCounts[county] || 0;

      return {
        name: county,
        currentValue: currentTotal,
        previousValue: previousTotal,
      };
    });

    // Sort the data:
    // 1. By currentValue in descending order
    // 2. Then by previousValue in descending order
    // 3. Then by name alphabetically
    chartData.sort((a, b) => {
      if (b.currentValue !== a.currentValue) {
        return b.currentValue - a.currentValue;
      }
      if (b.previousValue !== a.previousValue) {
        return b.previousValue - a.previousValue;
      }
      return a.name.localeCompare(b.name);
    });

    return chartData;
  }, [contacts, previousPeriodFilteredContacts]);

  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Custom label formatter for BarChart to display only the count
  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;

    if (value === 0) return null; // Don't show label for zero values

    // Position the label slightly to the right of the bar
    const offset = 5;
    return (
      <text
        x={x + width + offset}
        y={y + height / 2}
        fill="hsl(var(--foreground))"
        textAnchor="start"
        dominantBaseline="middle"
        className="text-xs"
      >
        {value}
      </text>
    );
  };

  // Calculate dynamic height for the chart based on number of bars
  const minCategoryHeight = 45;
  const baseChartPadding = 100;
  const dynamicChartHeight = data.length > 0
    ? Math.max(150, data.length * minCategoryHeight + baseChartPadding)
    : 150;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Concelho dos Contactos</CardTitle> {/* Título atualizado */}
      </CardHeader>
      <CardContent style={{ height: dynamicChartHeight }} className="p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{
                top: 20,
                right: 50, // Ajustado para acomodar apenas o valor
                left: 80,
                bottom: 5,
              }}
              barGap={2}
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
                tickFormatter={capitalizeFirstLetter}
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
                formatter={(value: number, name: string) => [`${value}`, name]} // Apenas o valor
                labelFormatter={(label: string) => capitalizeFirstLetter(label)}
              />
              <Legend
                formatter={(value) => {
                  if (value === "Período Anterior") {
                    return <span className="text-foreground">{value}</span>;
                  }
                  return value;
                }}
              />
              <Bar dataKey="currentValue" name="Contactos Atuais" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16}>
                <LabelList dataKey="currentValue" content={renderCustomizedLabel} />
              </Bar>
              <Bar dataKey="previousValue" name="Período Anterior" fill="hsl(var(--secondary-darker))" radius={[0, 4, 4, 0]} barSize={16}>
                <LabelList dataKey="previousValue" content={renderCustomizedLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum contacto para exibir por concelho neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCountyBarChart;