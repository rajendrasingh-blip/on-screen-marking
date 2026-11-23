
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    GraduationCap,
    FileText,
    LogOut,
    X,
    Users,
} from "lucide-react";
import { logoutApi } from "@/api/apiCall";

interface AdminSidebarProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

const menuItems = [
    {
        name: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard
    },
    {
        name: "Students",
        href: "/admin/answerSheet",
        icon: GraduationCap
    },
    {
        name: "Exams",
        href: "/admin/createExam",
        icon: FileText
    },
    {
        name: "Users",
        href: "/admin/users",
        icon: Users
    }
];

export default function AdminSidebar({
    open,
    setOpen
}: AdminSidebarProps) {

    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const response = await logoutApi();

            if (!response.success) {
                throw new Error("Logout failed");
            }

            router.replace("/");

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside className={`
                fixed left-0 top-0 z-50 h-screen w-64
                bg-slate-950 text-white
                flex flex-col transition-transform duration-300
                ${open ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0
            `}>

                {/* Logo */}
                <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold tracking-wide">
                            OSM<span className="text-blue-400">.</span>
                        </h1>
                        <p className="text-xs text-slate-400">
                            Admin Panel
                        </p>
                    </div>

                    <button
                        onClick={() => setOpen(false)}
                        className="lg:hidden"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Menu */}
                <div className="flex-1 overflow-y-auto px-4 py-6">

                    <p className="px-3 mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Main Menu
                    </p>

                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;

                            const active = pathname === item.href ||
                                pathname.startsWith(item.href + "/");

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={`
                                        flex items-center gap-3 rounded-lg
                                        px-3 py-3 text-sm font-medium
                                        transition-colors
                                        ${active
                                            ? "bg-blue-600 text-white"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }
                                    `}
                                >
                                    <Icon size={19} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Logout */}
                <div className="border-t border-slate-800 p-4">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                    >
                        <LogOut size={19} />
                        Logout
                    </button>
                </div>

            </aside>
        </>
    );
}
