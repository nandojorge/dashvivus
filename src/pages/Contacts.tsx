"use client";

import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/api/contacts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const Contacts = () => {
  const { data: contacts, isLoading, isError, error } = useQuery<Contact[], Error>({
    queryKey: ["contacts"],
    queryFn: getContacts,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Gestão de Contactos</h1>
        <Card>
          <CardHeader>
            <CardTitle>Carregando Contactos...</CardTitle>
            <CardDescription>Aguarde enquanto carregamos os dados dos seus contactos.</CardDescription>
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
        <h1 className="text-3xl font-bold">Gestão de Contactos</h1>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao carregar os contactos: {error?.message || "Erro desconhecido."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Gestão de Contactos</h1>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contactos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os contactos da sua empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts?.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.nome}</TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.telefone}</TableCell>
                    <TableCell>{contact.endereco}</TableCell>
                    <TableCell>{contact.status}</TableCell>
                    <TableCell>{contact.dataCriacao}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contacts;