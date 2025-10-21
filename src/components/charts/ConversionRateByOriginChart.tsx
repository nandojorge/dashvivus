"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';

interface ConversionRateByOriginChartProps {
  contacts: Contact[]; // Contactos do período atual
  previousPeriodFilteredContacts: Contact[]; // Contactos do período anterior
}

const ConversionRateByOriginChart: React.FC<ConversionRateByOriginChartProps> = ({ contacts, previousPeriodFilteredContacts }) => {
  const data = React.useMemo(() => {
    const processContactsForConversion = (contactList: Contact[]) => {
      const originData: { [key: string]: { total: number; converted: number } } = {};
      contactList.forEach(contact => {
        const origin = contact.origemcontacto || 'desconhecida';
        if (!originData[origin]) {
          originData[origin] = { total: 0, converted: 0 };
        }
        originData[origin].total++;
        if (contact.status === 'Convertido') { // Assuming 'Convertido' status means converted
          originData[origin].converted++;
        }
      });
      return originData;
    };

    const currentOriginData = processContactsForConversion(contacts);
    const prevOriginData = processContactsForConversion(previousPeriodFilteredContacts);

    const allOrigins = new Set<string>([
      ...Object.keys(currentOriginData),
      ...Object.keys(prevOriginData),
    ]);

    return Array.from(allOrigins).map(origin => {
      const currentTotal = currentOriginData[origin]?.total || 0;
      const currentConverted = currentOriginData[origin]?.converted || 0;
      const currentConversionRate = currentTotal > 0 ? (currentConverted / currentTotal) * 100 : 0;

      const previousTotal = prevOriginData[origin]?.total || 0;
      const previousConverted = prevOriginData[origin]?.converted || 0;
      const previousConversionRate = previousTotal > 0 ? (previousConverted / previousTotal) * 100 : 0;

      return {
        name: origin,
        currentConversionRate: parseFloat(currentConversionRate.toFixed(1)), // Round to 1 decimal place
        previousConversionRate: parseFloat(previousConversionRate.toFixed(1)),
      };
    });
  }, [contacts, previousPeriodFilteredContacts]);

  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Custom label formatter for BarChart to display only the percentage
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
        {value}%
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
        <CardTitle>Taxa de Conversão por Origem</CardTitle>
      </CardHeader>
      <CardContent style={{ height: dynamicChartHeight }} className="p-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{
                top: 20,
                right: 50, // Ajustado para acomodar o valor percentual
                left: 80,
                bottom: 5,
              }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tickLine={false} axisLine={false} className="text-sm" unit="%" />
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
                formatter={(value: number, name: string) => [`${value}%`, name]}
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
              <Bar dataKey="currentConversionRate" name="Taxa Atual" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16}>
                <LabelList dataKey="currentConversionRate" content={renderCustomizedLabel} />
              </Bar>
              <Bar dataKey="previousConversionRate" name="Período Anterior" fill="hsl(var(--secondary-darker))" radius={[0, 4, 4, 0]} barSize={16}>
                <LabelList dataKey="previousConversionRate" content={renderCustomizedLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum contacto para exibir a taxa de conversão neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionRateByOriginChart;