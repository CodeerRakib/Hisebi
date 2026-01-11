
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface Debt {
  id: string;
  person: string;
  amount: number;
  date: string;
  note: string;
  status: 'pending' | 'repaid';
}

export interface UserProfile {
  name: string;
  monthlyBudget: number;
}

export interface FinancialData {
  transactions: Transaction[];
  debts: Debt[];
  profile: UserProfile;
}

export interface AIInsight {
  tips: string[];
  alert: string | null;
}
