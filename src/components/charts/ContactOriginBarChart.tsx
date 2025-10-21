"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from '@/types/contact';

interface ContactOriginBarChartProps {
  contacts: Contact[]; // Contactos do período atual
  previousPeriodFilteredContacts: Contact[]; // Contactos do período anterior
}

const ContactOriginBarChart: React.FC<ContactOriginBarChartProps> = ({ contacts, previousPeriodFilteredContacts }) => {
  const data = React.useMemo(() => {
    const processContacts = (contactList: Contact[]) => {
      const originCounts: { [key: string]: number } = {};
      const convertedCounts: { [key: string]: number } = {};
      contactList.forEach(contact => {
        const origin = contact.origemcontacto || 'desconhecida';
        originCounts[origin] = (originCounts[origin] || 0) + 1;
        if (contact.status === "Convertido") {
          convertedCounts[origin] = (convertedCounts[origin] || 0) + 1;
        }
      });
      return { originCounts, convertedCounts };
    };

    const { originCounts: currentOriginCounts, convertedCounts: currentConvertedCounts } = processContacts(contacts);
    const { originCounts: prevOriginCounts, convertedCounts: prevConvertedCounts } = processContacts(previousPeriodFilteredContacts);

    const allOrigins = new Set<string>([
      ...Object.keys(currentOriginCounts),
      ...Object.keys(prevOriginCounts),
    ]);

    return Array.from(allOrigins).map(origin => {
      const currentTotal = currentOriginCounts[origin] || 0;
      const currentConverted = currentConvertedCounts[origin] || 0;
      const currentConversionRate = currentTotal > 0 ? (currentConverted / currentTotal) * 100 : 0;

      const previousTotal = prevOriginCounts[origin] || 0;
      const previousConverted = prevConvertedCounts[origin] || 0;
      const previousConversionRate = previousTotal > 0 ? (previousConverted / previousTotal) * 100 : 0;

      return {
        name: origin,
        currentValue: currentTotal,
        currentConversionRate: currentConversionRate,
        previousValue: previousTotal,
        previousConversionRate: previousConversionRate,
      };
    });
  }, [contacts, previousPeriodFilteredContacts]);

  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Custom label formatter for BarChart to display count and percentage
  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, height, value, dataKey, payload } = props; // Destructure payload

    // Se o valor for 0 ou o payload for indefinido, não renderizar o label
    if (value === 0 || !payload) {
      return null;
    }

    const isCurrent = dataKey === 'currentValue';
    const conversionRate = isCurrent ? payload.currentConversionRate : payload.previousConversionRate;

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
        {`${value} (${conversionRate.toFixed(1)}%)`}
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
                right: 100, // Increased right margin to accommodate labels
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
                formatter={(value: number, name: string, props: any) => {
                  const dataKey = props.dataKey;
                  let conversionRate = 0;
                  if (dataKey === 'currentValue') {
                    conversionRate = props.payload.currentConversionRate;
                  } else if (dataKey === 'previousValue') {
                    conversionRate = props.payload.previousConversionRate;
                  }
                  return [`${value} (${conversionRate.toFixed(1)}%)`, name];
                }}
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
            Nenhum contacto para exibir a origem neste período.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactOriginBarChart;