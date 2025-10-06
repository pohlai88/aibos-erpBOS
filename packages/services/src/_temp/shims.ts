// Temporary type shims for invoice documents
// These types will be replaced with proper contract types once the API contracts are finalized

export interface SalesInvoice {
  id: string;
  company_id: string;
  currency: string;
  doc_date: string;
  tax_code_id?: string;
  [key: string]: any; // Allow additional properties for flexibility
}

export interface PurchaseInvoice {
  id: string;
  company_id: string;
  currency: string;
  doc_date: string;
  tax_code_id?: string;
  [key: string]: any; // Allow additional properties for flexibility
}
