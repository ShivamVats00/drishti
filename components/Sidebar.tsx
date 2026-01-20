'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    BarChart3Icon,
    AlertTriangleIcon,
    ActivityIcon,
    SettingsIcon,
    LogOutIcon,
    FingerprintIcon
} from 'lucide-react';

const navigation = [
    { name: 'Overview', href: '/dashboard/overview', icon: HomeIcon },
    { name: 'Trends & Analytics', href: '/dashboard/trends', icon: BarChart3Icon },
    { name: 'Anomalies', href: '/dashboard/anomalies', icon: AlertTriangleIcon },
    { name: 'Action Center', href: '/dashboard/action-center', icon: ActivityIcon },
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col glass-sidebar w-72 transition-all duration-300">
            {/* Logo Section */}
            <div className="flex h-20 items-center px-8 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                        <FingerprintIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-wider">
                            DRISHTI
                        </h1>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Analytics v1.0</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-y-6 px-4 py-8">
                {/* Main Menu */}
                <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4">
                        Platform
                    </h3>
                    <ul role="list" className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={classNames(
                                            isActive
                                                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent',
                                            'group flex gap-x-3 items-center p-3 text-sm font-medium transition-all duration-200 rounded-r-lg'
                                        )}
                                    >
                                        <item.icon
                                            className={classNames(
                                                isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300',
                                                'h-5 w-5 shrink-0 transition-colors'
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* System Menu */}
                <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4">
                        System
                    </h3>
                    <ul role="list" className="space-y-1">
                        <li>
                            <Link
                                href="/settings"
                                className="text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent group flex gap-x-3 items-center p-3 text-sm font-medium transition-all duration-200 rounded-r-lg"
                            >
                                <SettingsIcon className="h-5 w-5 text-slate-500 group-hover:text-slate-300" />
                                Settings
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* User Profile / Footer */}
            <div className="p-4 border-t border-white/5 mx-4 mb-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        AD
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white">Admin User</p>
                        <p className="text-xs text-slate-500 truncate">admin@uidai.gov.in</p>
                    </div>
                    <LogOutIcon className="h-4 w-4 text-slate-500 group-hover:text-red-400 transition-colors" />
                </div>
            </div>
        </div>
    );
}
