import { Contact } from "@/types/contact";

const API_URL = "https://api.steinhq.com/v1/storages/66e598124d11fd04f02ad860/contactos";

export async function getContacts(): Promise<Contact[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch contacts");
  }
  const data = await response.json();
  console.log("Dados brutos da API de contactos:", data); // Log para depuração
  // Assuming the API returns an array directly
  return data;
}