
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, 
  PlusCircle, 
  History, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  HandCoins,
  Settings,
  Download,
  User,
  Sparkles,
  X,
  Trash2,
  CheckCircle2,
  ListFilter,
  ChevronRight
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { Transaction, Debt, UserProfile, FinancialData, AIInsight, TransactionType } from './types.ts';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './constants.tsx';
import { getFinancialInsights } from './services/geminiService.ts';

const App: React.FC = () => {
  // --- State ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: 'Guest User', monthlyBudget: 15000 });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'debts'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDharModalOpen, setIsDharModalOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    document.documentElement.classList.add('dark');
    const savedData = localStorage.getItem('hisebi_data');
    if (savedData) {
      try {
        const { transactions, debts, profile } = JSON.parse(savedData);
        setTransactions(transactions || []);
        setDebts(debts || []);
        setProfile(profile || { name: 'Guest User', monthlyBudget: 15000 });
      } catch (e) {
        console.error("Error parsing saved data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hisebi_data', JSON.stringify({ transactions, debts, profile }));
  }, [transactions, debts, profile]);

  // --- Calculations ---
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const pendingDebt = debts.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);
    return { income, expense, balance: income - expense, pendingDebt };
  }, [transactions, debts]);

  const recentCombinedActivity = useMemo(() => {
    const combined = [
      ...transactions.map(t => ({ ...t, source: 'transaction' as const })),
      ...debts.map(d => ({ 
        id: d.id, 
        type: 'debt' as const, 
        amount: d.amount, 
        category: 'Dhar', 
        date: d.date, 
        note: d.person,
        source: 'debt' as const 
      }))
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [transactions, debts]);

  const chartData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    const hasData = Object.keys(categoryMap).length > 0;
    return hasData 
      ? Object.keys(categoryMap).map(name => ({ name, value: categoryMap[name], isPlaceholder: false }))
      : [{ name: 'No Data', value: 1, isPlaceholder: true }];
  }, [transactions]);

  const monthlyBarData = useMemo(() => {
    const last7 = transactions.slice(-7);
    return last7.length > 0 
      ? last7.map(t => ({
          date: new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          amount: t.amount,
          type: t.type
        }))
      : [{ date: 'Today', amount: 0, type: 'expense' }];
  }, [transactions]);

  // --- Tooltip Style ---
  const lightTooltipStyle = {
    borderRadius: '16px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.98)',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)',
    color: '#0f172a',
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: '700'
  };

  // --- Actions ---
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newT = { ...t, id: crypto.randomUUID() };
    setTransactions([newT, ...transactions]);
    setIsAddModalOpen(false);
  };

  const addDebt = (d: Omit<Debt, 'id' | 'status'>) => {
    const newD: Debt = { ...d, id: crypto.randomUUID(), status: 'pending' };
    setDebts([newD, ...debts]);
    setIsDharModalOpen(false);
  };

  const toggleDebtStatus = (id: string) => {
    setDebts(debts.map(d => d.id === id ? { ...d, status: d.status === 'pending' ? 'repaid' : 'pending' } : d));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const deleteDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  const fetchAIInsights = async () => {
    setIsLoadingAI(true);
    const insights = await getFinancialInsights({ transactions, debts, profile });
    setAiInsight(insights);
    setIsLoadingAI(false);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = transactions.map(t => [t.date, t.type, t.category, t.amount, t.note]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hisebi_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Sub-Components ---
  const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const TransactionForm = () => {
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || isNaN(Number(amount))) return;
      addTransaction({ type, amount: Number(amount), category, date, note });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex p-1 bg-slate-800 rounded-xl">
          <button 
            type="button" 
            onClick={() => { setType('expense'); setCategory(EXPENSE_CATEGORIES[0].name); }}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${type === 'expense' ? 'bg-slate-700 text-rose-400' : 'text-slate-500 hover:text-slate-400'}`}
          >
            Expense
          </button>
          <button 
            type="button" 
            onClick={() => { setType('income'); setCategory(INCOME_CATEGORIES[0].name); }}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${type === 'income' ? 'bg-slate-700 text-emerald-400' : 'text-slate-500 hover:text-slate-400'}`}
          >
            Income
          </button>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">৳</span>
            <input 
              autoFocus
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-xl font-bold text-white placeholder-slate-600"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-white appearance-none"
          >
            {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Note</label>
            <input 
              type="text" 
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-slate-600"
              placeholder="Details..."
            />
          </div>
        </div>
        <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform active:scale-95 mt-2">
          Add Transaction
        </button>
      </form>
    );
  };

  const DharForm = () => {
    const [person, setPerson] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!person || !amount) return;
      addDebt({ person, amount: Number(amount), date, note });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Borrower/Lender Name</label>
          <input 
            autoFocus
            type="text" 
            value={person} 
            onChange={(e) => setPerson(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-amber-500 transition-all text-white placeholder-slate-600"
            placeholder="e.g., Rahim"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">৳</span>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-amber-500 transition-all text-xl font-bold text-white"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Due Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-amber-500 transition-all text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Reason</label>
          <input 
            type="text" 
            value={note} 
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-amber-500 transition-all text-white placeholder-slate-600"
            placeholder="Why this Dhar?"
          />
        </div>
        <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 transition-all transform active:scale-95">
          Save Dhar
        </button>
      </form>
    );
  };

  const ProfileForm = () => {
    const [name, setName] = useState(profile.name);
    const [budget, setBudget] = useState(profile.monthlyBudget.toString());

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setProfile({ name, monthlyBudget: Number(budget) });
      setIsProfileModalOpen(false);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Your Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Monthly Budget Limit</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">৳</span>
            <input 
              type="number" 
              value={budget} 
              onChange={(e) => setBudget(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all text-white text-lg font-bold"
            />
          </div>
        </div>
        <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all">
          Save Profile
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Wallet size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black leading-none text-white tracking-tight">Hisebi</h1>
            <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">Smart AI Accounts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-900 transition-all border border-slate-800"
          >
            <div className="w-7 h-7 bg-indigo-900/50 text-indigo-400 rounded-full flex items-center justify-center">
              <User size={14} />
            </div>
            <span className="text-xs font-bold text-slate-200 max-w-[80px] truncate">{profile.name}</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8 pb-32">
        {totals.expense > profile.monthlyBudget && (
          <div className="flex items-center gap-3 p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl animate-pulse">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-rose-300">Over Budget!</p>
              <p className="text-xs text-rose-400/80">You've exceeded your ৳{profile.monthlyBudget} limit by ৳{(totals.expense - profile.monthlyBudget).toFixed(0)}.</p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-entry">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Balance', value: totals.balance, color: 'blue', icon: Wallet, sub: 'Available', target: 'transactions' },
                { label: 'Total Income', value: totals.income, color: 'emerald', icon: ArrowDownLeft, sub: 'Earnings', target: 'transactions' },
                { label: 'Expenses', value: totals.expense, color: 'rose', icon: ArrowUpRight, sub: 'Spending', target: 'transactions' },
                { label: 'Total Dhar', value: totals.pendingDebt, color: 'amber', icon: HandCoins, sub: 'Repayments', target: 'debts' }
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => setActiveTab(item.target as any)}
                  className="glass-card p-6 rounded-[2rem] flex flex-col justify-between hover:scale-[1.03] hover:border-slate-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className={`p-3 bg-${item.color}-900/40 text-${item.color}-400 rounded-2xl group-hover:scale-110 transition-transform`}>
                      <item.icon size={22} />
                    </div>
                    <span className={`text-[10px] font-black text-${item.color}-500 uppercase tracking-widest`}>{item.label}</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">৳{item.value.toLocaleString()}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.sub}</p>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Combined Recent Activity Section */}
            <div className="glass-card p-8 rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ListFilter size={16} className="text-blue-500" />
                  Recent Activity
                </h3>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                >
                  View All Logs
                </button>
              </div>
              <div className="space-y-1">
                {recentCombinedActivity.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">No recent entries</p>
                  </div>
                ) : (
                  recentCombinedActivity.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setActiveTab(item.source === 'debt' ? 'debts' : 'transactions')}
                      className="flex items-center justify-between p-4 hover:bg-white/[0.03] rounded-2xl transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl border ${
                          item.type === 'income' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : item.type === 'expense' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {item.type === 'income' ? <ArrowDownLeft size={16} /> : item.type === 'expense' ? <ArrowUpRight size={16} /> : <HandCoins size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{item.category}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            {item.note || 'No description'} • {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`text-base font-black ${
                          item.type === 'income' 
                            ? 'text-emerald-400' 
                            : item.type === 'expense' 
                              ? 'text-rose-400'
                              : 'text-amber-400'
                        }`}>
                          {item.type === 'income' ? '+' : '-'}৳{item.amount.toLocaleString()}
                        </p>
                        <ChevronRight size={14} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-8 rounded-[2.5rem] cursor-pointer hover:border-slate-500/30 transition-all" onClick={() => setActiveTab('transactions')}>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={16} className="text-indigo-500" />
                    Category Breakdown
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </h3>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={10}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isPlaceholder ? '#1e293b' : EXPENSE_CATEGORIES[index % EXPENSE_CATEGORIES.length].color} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={lightTooltipStyle}
                        itemStyle={{ color: '#0f172a' }}
                        labelStyle={{ color: '#64748b' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.isPlaceholder ? '#1e293b' : EXPENSE_CATEGORIES[i % EXPENSE_CATEGORIES.length].color }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-8 rounded-[2.5rem] cursor-pointer hover:border-slate-500/30 transition-all" onClick={() => setActiveTab('transactions')}>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-emerald-500" />
                    Spending Trends
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </h3>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyBarData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="#475569" fontSize={10} fontWeight="bold" />
                      <YAxis axisLine={false} tickLine={false} stroke="#475569" fontSize={10} fontWeight="bold" />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={lightTooltipStyle}
                        itemStyle={{ color: '#0f172a' }}
                        labelStyle={{ color: '#64748b' }}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        {monthlyBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.type === 'income' ? '#10B981' : '#F43F5E'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group border border-indigo-500/20">
              <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center justify-between">
                <div className="space-y-5 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-md rounded-full border border-indigo-500/30">
                    <Sparkles size={16} className="text-yellow-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Gemini-Powered Intelligence</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tight">Financial Clarity</h2>
                  <p className="text-indigo-200/70 max-w-sm text-sm font-medium leading-relaxed">Let Hisebi AI scan your habits and suggest ways to grow your savings faster.</p>
                  
                  {!aiInsight ? (
                    <button 
                      onClick={fetchAIInsights} 
                      disabled={isLoadingAI}
                      className="mt-4 px-10 py-4 bg-white text-indigo-950 font-black rounded-2xl hover:bg-indigo-50 transition-all flex items-center gap-3 mx-auto md:mx-0 disabled:opacity-50 shadow-lg"
                    >
                      {isLoadingAI ? 'Analyzing...' : 'Generate AI Insights'}
                      {!isLoadingAI && <Sparkles size={20} />}
                    </button>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                      {aiInsight.tips.map((tip, idx) => (
                        <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/10 flex gap-4 backdrop-blur-sm">
                          <div className="w-6 h-6 shrink-0 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                          <p className="text-sm font-semibold leading-relaxed text-slate-100">{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="hidden md:block scale-125 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles size={150} />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-entry">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">Record History (Logs)</h2>
              <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 px-5 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl hover:bg-slate-800 transition-all text-xs font-bold text-slate-300"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
            <div className="glass-card rounded-[2.5rem] overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-24 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                    <History size={32} />
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No entries found yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {transactions.map(t => (
                    <div key={t.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-center gap-5">
                        <div className={`p-3.5 rounded-2xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {t.type === 'income' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                        </div>
                        <div>
                          <h4 className="font-black text-white text-base">{t.category}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
                            <span>{new Date(t.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="max-w-[200px] truncate">{t.note || 'No notes'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`text-xl font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'}৳{t.amount.toLocaleString()}
                        </span>
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="space-y-6 animate-entry">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Hishab (Debts)</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Lending & Borrowing Ledger</p>
              </div>
              <button 
                onClick={() => setIsDharModalOpen(true)}
                className="flex items-center gap-2 px-6 py-4 bg-amber-500 text-slate-950 rounded-2xl hover:bg-amber-400 shadow-xl shadow-amber-500/20 transition-all font-black text-sm"
              >
                <PlusCircle size={20} />
                New Dhar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {debts.length === 0 ? (
                <div className="col-span-2 p-24 text-center glass-card rounded-[2.5rem] space-y-4">
                   <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                    <HandCoins size={32} />
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Clear of all debts. Good job!</p>
                </div>
              ) : debts.map(d => (
                <div key={d.id} className={`glass-card p-8 rounded-[2.5rem] border-l-[6px] ${d.status === 'repaid' ? 'border-emerald-500' : 'border-amber-500'} transition-all hover:scale-[1.02]`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-xl font-black text-white">{d.person}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Due: {new Date(d.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-black ${d.status === 'repaid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        ৳{d.amount.toLocaleString()}
                      </span>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${d.status === 'repaid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {d.status === 'repaid' ? 'Settled' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-400 mb-6 italic">
                    "{d.note || 'No description provided'}"
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => toggleDebtStatus(d.id)}
                      className={`flex-1 py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${d.status === 'repaid' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'}`}
                    >
                      {d.status === 'repaid' ? <History size={16} /> : <CheckCircle2 size={16} />}
                      {d.status === 'repaid' ? 'RE-OPEN' : 'MARK REPAID'}
                    </button>
                    <button 
                      onClick={() => deleteDebt(d.id)}
                      className="p-3.5 bg-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 border border-slate-700 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-24 md:bottom-10 right-8">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-600/40 hover:bg-blue-500 hover:scale-110 transition-all flex items-center justify-center active:scale-95 group"
        >
          <PlusCircle size={32} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 md:static bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800 px-8 py-5 flex justify-around items-center md:hidden z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-blue-500 scale-110' : 'text-slate-600'}`}>
          <LayoutGrid size={22} />
          <span className="text-[10px] font-black tracking-widest uppercase">Hisebi</span>
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'transactions' ? 'text-blue-500 scale-110' : 'text-slate-600'}`}>
          <History size={22} />
          <span className="text-[10px] font-black tracking-widest uppercase">Logs</span>
        </button>
        <button onClick={() => setActiveTab('debts')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'debts' ? 'text-amber-500 scale-110' : 'text-slate-600'}`}>
          <HandCoins size={22} />
          <span className="text-[10px] font-black tracking-widest uppercase">Dhar</span>
        </button>
      </nav>

      <div className="hidden md:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-5 bg-slate-900/50 backdrop-blur-xl p-3.5 rounded-3xl shadow-2xl border border-slate-800 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`p-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`} title="Hisebi (Home)">
          <LayoutGrid size={24} />
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`p-4 rounded-2xl transition-all ${activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`} title="History (Logs)">
          <History size={24} />
        </button>
        <button onClick={() => setActiveTab('debts')} className={`p-4 rounded-2xl transition-all ${activeTab === 'debts' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`} title="Debts (Dhar)">
          <HandCoins size={24} />
        </button>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Entry">
        <TransactionForm />
      </Modal>
      <Modal isOpen={isDharModalOpen} onClose={() => setIsDharModalOpen(false)} title="Track Dhar">
        <DharForm />
      </Modal>
      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Settings">
        <ProfileForm />
      </Modal>
    </div>
  );
};

export default App;
