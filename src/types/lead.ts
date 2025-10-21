export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  origemcontacto?: string; // Pode ser a mesma que para contactos
  datacontactolead: string; // Data no formato string, alterado de dataregisto
  status: string; // Ex: "Novo", "Qualificado", "Contactado"
}