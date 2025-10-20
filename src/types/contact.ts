export interface Contact {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  status: string; // Ex: "Ativo", "Inativo", "Lead"
  dataCriacao: string; // Data no formato string
}