export interface Contact {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  status: string; // Ex: "Ativo", "Inativo", "Lead", "Convertido"
  dataregisto: string; // Data no formato string
  arquivado: string; // "sim" ou "nao"
  origemcontacto?: string; // Novo campo para a origem do contacto
  concelho?: string; // Novo campo para o concelho do contacto
}