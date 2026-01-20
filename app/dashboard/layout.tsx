import Sidebar from '@/components/Sidebar';
import { BellIcon, SearchIcon } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200">
            {/* Sidebar */}
            <aside className="shrink-0 h-full z-20 shadow-2xl shadow-black/50">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">

                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-slate-950/50 backdrop-blur-sm z-10 w-full">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-slate-100 tracking-tight">Dashboard Overview</h2>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Search Bar */}
                        <div className="relative group">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search district, pincode..."
                                className="h-9 w-64 bg-slate-900/50 border border-slate-800 rounded-full pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                            />
                        </div>

                        {/* Notifications */}
                        <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-200">
                            <BellIcon className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
