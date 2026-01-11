
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  LayoutGrid, PlusCircle, History, Wallet, ArrowUpRight, 
  ArrowDownLeft, HandCoins, Settings, Download, User, 
  X, Trash2, CheckCircle2, ListFilter, ChevronRight,
  ShoppingBag, Utensils, Home, Car, Zap, HeartPulse, Laptop, 
  DollarSign, TrendingUp, CreditCard, Briefcase, Gift, 
  WalletCards, Coffee, Landmark
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

// --- Types ---
type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string;
}

interface Debt {
  id: string;
  person: string;
  amount: number;
  date: string;
  note: string;
  status: 'pending' | 'repaid';
}

interface UserProfile {
  name: string;
  monthlyBudget: number;
}

// --- Constants ---
const EXPENSE_CATEGORIES = [
  { name: 'Food', icon: Utensils, color: '#F87171' },
  { name: 'Rent/Housing', icon: Home, color: '#60A5FA' },
  { name: 'Transport', icon: Car, color: '#FBBF24' },
  { name: 'Utilities', icon: Zap, color: '#34D399' },
  { name: 'Health', icon: HeartPulse, color: '#F472B6' },
  { name: 'Entertainment', icon: Laptop, color: '#A78BFA' },
  { name: 'Shopping', icon: ShoppingBag, color: '#FB923C' },
  { name: 'Other', icon: CreditCard, color: '#94A3B8' },
];

const INCOME_CATEGORIES = [
  { name: 'Salary', icon: Briefcase, color: '#10B981' },
  { name: 'Freelance', icon: Laptop, color: '#3B82F6' },
  { name: 'Gifts', icon: Gift, color: '#EC4899' },
  { name: 'Investment', icon: TrendingUp, color: '#8B5CF6' },
  { name: 'Other', icon: DollarSign, color: '#6B7280' },
];

// --- Main App Component ---
const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: 'Guest User', monthlyBudget: 15000 });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'debts'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDharModalOpen, setIsDharModalOpen] = useState(false);
  
  // Track the transaction type and selected category being added in the modal
  const [modalTransactionType, setModalTransactionType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0].name);

  // Load data - Persistent local storage for lifetime tracking
  useEffect(() => {
    const saved = localStorage.getItem('dordam_v3_persistent');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTransactions(parsed.transactions || []);
        setDebts(parsed.debts || []);
        setProfile(parsed.profile || { name: 'Guest User', monthlyBudget: 15000 });
      } catch (e) {
        console.error("Failed to load local storage", e);
      }
    }
  }, []);

  // Save data automatically on changes
  useEffect(() => {
    localStorage.setItem('dordam_v3_persistent', JSON.stringify({ transactions, debts, profile }));
  }, [transactions, debts, profile]);

  // Logic to update category when switching type
  useEffect(() => {
    if (modalTransactionType === 'expense') {
        setSelectedCategory(EXPENSE_CATEGORIES[0].name);
    } else {
        setSelectedCategory(INCOME_CATEGORIES[0].name);
    }
  }, [modalTransactionType]);

  const totals = useMemo(() => {
    const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const dbt = debts.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);
    return { income: inc, expense: exp, balance: inc - exp, pendingDebt: dbt };
  }, [transactions, debts]);

  const recentActivity = useMemo(() => {
    const combined = [
      ...transactions.map(t => ({ ...t, source: 'transaction' })),
      ...debts.map(d => ({ 
        id: d.id, 
        type: 'debt' as any, 
        amount: d.amount, 
        category: 'Dhar', 
        date: d.date, 
        note: d.person, 
        source: 'debt' 
      }))
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [transactions, debts]);

  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => map[t.category] = (map[t.category] || 0) + t.amount);
    const entries = Object.entries(map).map(([name, value]) => ({ name, value, isPlaceholder: false }));
    return entries.length ? entries : [{ name: 'No Data', value: 1, isPlaceholder: true }];
  }, [transactions]);

  const barData = useMemo(() => {
    const last7 = transactions.slice(-7).map(t => ({
      date: new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      amount: t.amount,
      type: t.type
    }));
    return last7.length ? last7 : [{ date: 'Today', amount: 0, type: 'expense' }];
  }, [transactions]);

  const lightTooltipStyle = {
    borderRadius: '16px', border: 'none', background: 'white',
    boxShadow: '0 10px 15px rgba(0,0,0,0.3)', color: '#0f172a',
    padding: '8px 12px', fontSize: '12px', fontWeight: 'bold'
  };

  const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={20}/></button>
          </div>
          <div className="p-6 max-h-[85vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-200">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 transition-transform active:scale-90"><Wallet size={22}/></div>
          <div><h1 className="text-xl font-black text-white leading-tight">Dor-Dam</h1><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Expense Ledger</p></div>
        </div>
        <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-900 transition-all">
          <div className="w-7 h-7 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center"><User size={14} /></div>
          <span className="text-xs font-bold text-slate-300">{profile.name}</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8 pb-32">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-entry">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Balance', value: totals.balance, color: 'blue', icon: Wallet, target: 'transactions' },
                { label: 'Income', value: totals.income, color: 'emerald', icon: ArrowDownLeft, target: 'transactions' },
                { label: 'Expenses', value: totals.expense, color: 'rose', icon: ArrowUpRight, target: 'transactions' },
                { label: 'Dhar', value: totals.pendingDebt, color: 'amber', icon: HandCoins, target: 'debts' }
              ].map((item, i) => (
                <div key={i} onClick={() => setActiveTab(item.target as any)} className="glass-card p-5 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-all cursor-pointer group">
                  <div className={`w-10 h-10 bg-${item.color}-900/30 text-${item.color}-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-${item.color}-900/50 transition-colors`}><item.icon size={20}/></div>
                  <h3 className="text-xl md:text-2xl font-black text-white">৳{item.value.toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-6 rounded-[2rem]">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Category Breakdown</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                        {chartData.map((e: any, i) => <Cell key={i} fill={e.isPlaceholder ? '#1e293b' : EXPENSE_CATEGORIES[i % EXPENSE_CATEGORIES.length].color}/>)}
                      </Pie>
                      <Tooltip contentStyle={lightTooltipStyle}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card p-6 rounded-[2rem]">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Recent Trends</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b"/>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10}/>
                      <YAxis axisLine={false} tickLine={false} fontSize={10}/>
                      <Tooltip contentStyle={lightTooltipStyle} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                      <Bar dataKey="amount" radius={[4,4,0,0]}>
                        {barData.map((e, i) => <Cell key={i} fill={e.type === 'income' ? '#10B981' : '#F43F5E'}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-8 rounded-[2rem]">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Activity</h3>
                 <button onClick={() => setActiveTab('transactions')} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">View Logs</button>
               </div>
               <div className="space-y-4">
                 {recentActivity.length === 0 ? (
                   <div className="py-10 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">No records found</div>
                 ) : (
                   recentActivity.map(act => (
                     <div key={act.id} className="flex items-center justify-between p-3 hover:bg-white/[0.03] rounded-2xl transition-all group">
                       <div className="flex items-center gap-3">
                         <div className={`p-2.5 rounded-xl ${act.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : act.type === 'expense' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                           {act.type === 'income' ? <ArrowDownLeft size={16}/> : act.type === 'expense' ? <ArrowUpRight size={16}/> : <HandCoins size={16}/>}
                         </div>
                         <div>
                           <p className="text-sm font-bold text-white leading-tight">{act.category}</p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{act.note || 'General'} • {act.date}</p>
                         </div>
                       </div>
                       <span className={`text-sm font-black ${act.type === 'income' ? 'text-emerald-400' : act.type === 'expense' ? 'text-rose-400' : 'text-amber-400'}`}>{act.type === 'income' ? '+' : '-'}৳{act.amount.toLocaleString()}</span>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-entry">
            <h2 className="text-2xl font-black text-white">Activity Logs</h2>
            <div className="glass-card rounded-[2rem] overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-20 text-center text-slate-500 font-bold uppercase text-xs tracking-widest">No entries yet.</div>
              ) : (
                transactions.map(t => (
                  <div key={t.id} className="p-6 flex items-center justify-between border-b border-slate-800/50 hover:bg-white/[0.02] group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {t.type === 'income' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                      </div>
                      <div>
                        <h4 className="font-black text-white">{t.category}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.date} • {t.note || 'No note'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'}৳{t.amount.toLocaleString()}
                      </span>
                      <button onClick={() => setTransactions(transactions.filter(x => x.id !== t.id))} className="text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-rose-500/10">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="space-y-6 animate-entry">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-white">Dhar Ledger</h2>
              <button onClick={() => setIsDharModalOpen(true)} className="px-6 py-3 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all text-sm">+ New Dhar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {debts.length === 0 ? (
                <div className="col-span-2 glass-card p-20 text-center text-slate-500 font-bold uppercase text-xs tracking-widest">No debts tracked.</div>
              ) : (
                debts.map(d => (
                  <div key={d.id} className={`glass-card p-6 rounded-[2rem] border-l-4 ${d.status === 'repaid' ? 'border-emerald-500' : 'border-amber-500'} hover:scale-[1.02] transition-transform`}>
                    <div className="flex justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-black text-white">{d.person}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{d.date}</p>
                      </div>
                      <span className="text-xl font-black text-amber-400">৳{d.amount.toLocaleString()}</span>
                    </div>
                    <p className="p-3 bg-slate-950/40 rounded-xl text-xs text-slate-400 italic mb-4">"{d.note || 'No reason specified'}"</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDebts(debts.map(x => x.id === d.id ? {...x, status: x.status === 'repaid' ? 'pending' : 'repaid'} : x))} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all">
                        {d.status === 'repaid' ? 'RE-OPEN' : 'SETTLE'}
                      </button>
                      <button onClick={() => setDebts(debts.filter(x => x.id !== d.id))} className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button onClick={() => { setModalTransactionType('expense'); setIsAddModalOpen(true); }} className="fixed bottom-24 right-8 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border border-indigo-500/30">
        <PlusCircle size={28}/>
      </button>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 p-4 flex justify-around md:hidden z-50">
        {[
          { id: 'dashboard', icon: LayoutGrid, label: 'Home' },
          { id: 'transactions', icon: History, label: 'Logs' },
          { id: 'debts', icon: HandCoins, label: 'Dhar' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === t.id ? 'text-indigo-500 scale-110' : 'text-slate-600 hover:text-slate-400'}`}>
            <t.icon size={20}/>
            <span className="text-[9px] font-black uppercase tracking-tighter">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop Side Nav */}
      <div className="hidden md:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-4 bg-slate-900/50 backdrop-blur-xl p-3 rounded-3xl border border-slate-800 shadow-2xl z-50">
         {[
          { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
          { id: 'transactions', icon: History, label: 'Logs' },
          { id: 'debts', icon: HandCoins, label: 'Dhar' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`p-4 rounded-2xl transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`} title={t.label}>
            <t.icon size={24}/>
          </button>
        ))}
      </div>

      {/* New Entry Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Entry">
        <form className="space-y-6" onSubmit={(e: any) => { 
          e.preventDefault(); 
          const fd = new FormData(e.target); 
          setTransactions([{ 
            id: Math.random().toString(36).substr(2, 9), 
            type: modalTransactionType, 
            amount: Number(fd.get('amount')), 
            category: selectedCategory, 
            date: fd.get('date') as string, 
            note: fd.get('note') as string 
          }, ...transactions]); 
          setIsAddModalOpen(false); 
        }}>
          {/* Type Switch */}
          <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <button 
              type="button"
              onClick={() => setModalTransactionType('expense')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${modalTransactionType === 'expense' ? 'bg-slate-700 text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
            >
              Expense
            </button>
            <button 
              type="button"
              onClick={() => setModalTransactionType('income')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${modalTransactionType === 'income' ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
            >
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-500">৳</span>
            <input name="amount" type="number" placeholder="0.00" required autoFocus className="w-full pl-10 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-black text-2xl placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"/>
          </div>

          {/* Category Visual Grid */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Select Category</label>
            <div className="grid grid-cols-4 gap-3">
              {(modalTransactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                <button 
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all group ${selectedCategory === cat.name ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-800 bg-slate-800/40 hover:border-slate-600'}`}
                >
                  <div className={`p-2 rounded-lg transition-colors ${selectedCategory === cat.name ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} style={{ color: selectedCategory === cat.name ? cat.color : undefined }}>
                    <cat.icon size={20}/>
                  </div>
                  <span className={`text-[9px] font-black uppercase text-center transition-colors ${selectedCategory === cat.name ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`}>{cat.name.split('/')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</label>
              <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 transition-all"/>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Note (Optional)</label>
              <input name="note" placeholder="Add details..." className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600"/>
            </div>
          </div>

          <button className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest">
            Complete Entry
          </button>
        </form>
      </Modal>

      {/* Dhar Modal */}
      <Modal isOpen={isDharModalOpen} onClose={() => setIsDharModalOpen(false)} title="Track New Dhar">
        <form className="space-y-4" onSubmit={(e: any) => { 
          e.preventDefault(); 
          const fd = new FormData(e.target); 
          setDebts([{ 
            id: Math.random().toString(36).substr(2, 9), 
            person: fd.get('person') as string, 
            amount: Number(fd.get('amount')), 
            date: fd.get('date') as string, 
            note: fd.get('note') as string, 
            status: 'pending' 
          }, ...debts]); 
          setIsDharModalOpen(false); 
        }}>
          <input name="person" placeholder="Who borrowed/lent?" required className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"/>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-500">৳</span>
            <input name="amount" type="number" placeholder="0.00" required className="w-full pl-10 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all"/>
          </div>
          <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"/>
          <textarea name="note" placeholder="Reason or specific items..." className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white h-24 font-medium outline-none focus:ring-2 focus:ring-amber-500 transition-all"/>
          <button className="w-full py-4 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 active:scale-95 transition-all">Save Dhar</button>
        </form>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Account Settings">
        <form className="space-y-6" onSubmit={(e: any) => { 
          e.preventDefault(); 
          const fd = new FormData(e.target); 
          setProfile({ name: fd.get('name') as string, monthlyBudget: Number(fd.get('budget')) }); 
          setIsProfileModalOpen(false); 
        }}>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Full Name</label>
            <input name="name" placeholder="Enter name" defaultValue={profile.name} required className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Monthly Spending Limit (৳)</label>
            <input name="budget" type="number" placeholder="15000" defaultValue={profile.monthlyBudget} required className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
          </div>
          <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
             <div className="flex items-center gap-2 mb-2"><CheckCircle2 size={14} className="text-indigo-400"/><span className="text-[10px] font-black uppercase text-indigo-400">Local-First Persistence</span></div>
             <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-tighter">Your financial data never leaves your device. It is stored securely in your browser's internal memory for lifetime access without a database.</p>
          </div>
          <button className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">Update Profile</button>
        </form>
      </Modal>
    </div>
  );
};

// --- Render ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
