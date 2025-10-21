"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/api/contacts";
import { Contact } from "@/types/contact";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ContactsPage = () => {
  const { data: contacts, isLoading, isError, error } = useQuery<Contact[], Error>({
    queryKey: ["allContacts"],
    queryFn: getContacts,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Todos os Contactos</h1>
        <Card>
          <CardHeader>
            <CardTitle>Carregando Contactos...</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Todos os Contactos</h1>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao carregar os dados dos contactos: {error?.message || "Erro desconhecido."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Todos os Contactos</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Lista Completa de Contactos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Data Registo</TableHead>
                    <TableHead>Arquivado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.nome}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.telefone}</TableCell>
                      <TableCell>{contact.endereco}</TableCell>
                      <TableCell>{contact.status}</TableCell>
                      <TableCell>{contact.origemcontacto || 'N/A'}</TableCell>
                      <TableCell>
                        {contact.dataregisto ? format(parseISO(contact.dataregisto), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                      </TableCell>
                      <TableCell>{contact.arquivado === "sim" ? "Sim" : "Não"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Nenhum contacto encontrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactsPage;