
import React from 'react';
import { 
  ShoppingBag, 
  Utensils, 
  Home, 
  Car, 
  Zap, 
  HeartPulse, 
  Laptop, 
  DollarSign,
  TrendingUp,
  CreditCard,
  Briefcase
} from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  { name: 'Food', icon: <Utensils size={18} />, color: '#F87171' },
  { name: 'Rent/Housing', icon: <Home size={18} />, color: '#60A5FA' },
  { name: 'Transport', icon: <Car size={18} />, color: '#FBBF24' },
  { name: 'Utilities', icon: <Zap size={18} />, color: '#34D399' },
  { name: 'Health', icon: <HeartPulse size={18} />, color: '#F472B6' },
  { name: 'Entertainment', icon: <Laptop size={18} />, color: '#A78BFA' },
  { name: 'Shopping', icon: <ShoppingBag size={18} />, color: '#FB923C' },
  { name: 'Other', icon: <CreditCard size={18} />, color: '#94A3B8' },
];

export const INCOME_CATEGORIES = [
  { name: 'Salary', icon: <Briefcase size={18} />, color: '#10B981' },
  { name: 'Freelance', icon: <Laptop size={18} />, color: '#3B82F6' },
  { name: 'Gifts', icon: <HeartPulse size={18} />, color: '#EC4899' },
  { name: 'Investment', icon: <TrendingUp size={18} />, color: '#8B5CF6' },
  { name: 'Other', icon: <DollarSign size={18} />, color: '#6B7280' },
];
