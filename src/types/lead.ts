export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  origemcontacto?: string; // Pode ser a mesma que para contactos
  dataregisto: string; // Data no formato string
  status: string; // Ex: "Novo", "Qualificado", "Contactado"
}