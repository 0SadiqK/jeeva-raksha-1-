
import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

const InventoryManagement: React.FC = () => {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Surgical', 'Consumables', 'Equipment', 'PPE', 'Linen', 'Housekeeping'];

    const supplies = [
        { id: 'INV001', name: 'Surgical Gloves (Sterile)', category: 'Surgical', stock: 4500, minStock: 1000, unit: 'pairs', status: 'In Stock', lastOrdered: '2026-02-10' },
        { id: 'INV002', name: 'N95 Masks', category: 'PPE', stock: 200, minStock: 500, unit: 'pcs', status: 'Low Stock', lastOrdered: '2026-02-05' },
        { id: 'INV003', name: 'IV Cannula 18G', category: 'Consumables', stock: 850, minStock: 300, unit: 'pcs', status: 'In Stock', lastOrdered: '2026-02-12' },
        { id: 'INV004', name: 'Suture Kit (Silk 3-0)', category: 'Surgical', stock: 40, minStock: 100, unit: 'kits', status: 'Critical', lastOrdered: '2026-01-28' },
        { id: 'INV005', name: 'Oxygen Flow Meter', category: 'Equipment', stock: 12, minStock: 5, unit: 'units', status: 'In Stock', lastOrdered: '2026-01-15' },
        { id: 'INV006', name: 'Bed Sheets (Hospital)', category: 'Linen', stock: 150, minStock: 200, unit: 'sets', status: 'Low Stock', lastOrdered: '2026-02-08' },
        { id: 'INV007', name: 'Hand Sanitizer 500ml', category: 'Housekeeping', stock: 320, minStock: 100, unit: 'bottles', status: 'In Stock', lastOrdered: '2026-02-14' },
        { id: 'INV008', name: 'Pulse Oximeter Probes', category: 'Equipment', stock: 8, minStock: 20, unit: 'pcs', status: 'Critical', lastOrdered: '2026-02-01' },
        { id: 'INV009', name: 'Disposable Gowns', category: 'PPE', stock: 600, minStock: 200, unit: 'pcs', status: 'In Stock', lastOrdered: '2026-02-13' },
        { id: 'INV010', name: 'Adhesive Bandage Rolls', category: 'Consumables', stock: 1200, minStock: 300, unit: 'rolls', status: 'In Stock', lastOrdered: '2026-02-11' },
    ];

    const filtered = supplies.filter(s =>
        (activeCategory === 'All' || s.category === activeCategory) &&
        (s.name.toLowerCase().includes(search.toLowerCase()))
    );

    const criticalCount = supplies.filter(s => s.status === 'Critical').length;
    const lowCount = supplies.filter(s => s.status === 'Low Stock').length;
    const totalValue = supplies.reduce((sum, s) => sum + s.stock, 0);

    const handleReorder = (item: string) => {
        showToast('success', `Purchase order created for ${item}`);
    };

    const handleReceive = () => {
        showToast('info', 'GRN (Goods Received Note) form opening...');
    };

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Inventory & Supply Chain</h2>
                    <p className="text-sm font-medium text-slate-500 font-kannada">"ಸರಿಯಾದ ಸಾಮಗ್ರಿ — ಸಿದ್ಧತೆ" — Right supplies, always prepared.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleReceive} className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm transition-all">📦 Receive Stock</button>
                    <button onClick={() => showToast('info', 'New purchase order form opening...')} className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-700 transition-all">+ Purchase Order</button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Items', value: supplies.length.toString(), color: 'text-slate-900', icon: '📦' },
                    { label: 'Critical Items', value: criticalCount.toString().padStart(2, '0'), color: 'text-danger', icon: '🚨' },
                    { label: 'Low Stock', value: lowCount.toString().padStart(2, '0'), color: 'text-warning', icon: '⚠️' },
                    { label: 'Total Units', value: totalValue.toLocaleString(), color: 'text-primary', icon: '📊' },
                ].map(s => (
                    <div key={s.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl">{s.icon}</span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                        <p className={`text-3xl font-black ${s.color} tracking-tighter`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Category Filters + Search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/20'}`}>{cat}</button>
                    ))}
                </div>
                <div className="relative">
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory..." className="bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 shadow-sm w-64" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeCategory === 'All' ? 'All Supplies' : activeCategory} — {filtered.length} Items</h3>
                </div>
                <div className="divide-y divide-slate-50">
                    {filtered.map(item => (
                        <div key={item.id} className="px-8 py-5 flex items-center gap-6 hover:bg-hospital-bg/50 transition-colors">
                            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-lg shrink-0">📦</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-800">{item.name}</p>
                                <p className="text-[10px] font-bold text-slate-400">{item.category} • Last ordered: {item.lastOrdered}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-black text-slate-900">{item.stock.toLocaleString()}</p>
                                <p className="text-[9px] font-bold text-slate-400">{item.unit}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 ${item.status === 'In Stock' ? 'bg-success/10 text-success' : item.status === 'Low Stock' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>{item.status}</span>
                            {item.status !== 'In Stock' && (
                                <button onClick={() => handleReorder(item.name)} className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all shrink-0">Reorder</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">🏭</div>
                    <div className="flex-1 space-y-2">
                        <h4 className="text-lg font-black text-white">Supply Chain Compliance</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">"ಪಾರದರ್ಶಕ ಪೂರೈಕೆ — ಜವಾಬ್ದಾರಿ" — All stock movements are batch-tracked for audit compliance.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryManagement;
