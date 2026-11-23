"use client";

import { Menu, Bell, UserCircle } from "lucide-react";

interface Props {
    setOpen: (value: boolean) => void;
}

export default function AdminHeader({ setOpen }: Props) {
    return (
        <header className="h-20 bg-white border-b flex items-center justify-between px-6">

            <button
                onClick={() => setOpen(true)}
                className="lg:hidden"
            >
                <Menu size={24} />
            </button>

            <h2 className="font-semibold text-slate-800">
                Admin Panel
            </h2>

            <div className="flex items-center gap-5">
                <Bell size={21} className="text-slate-500" />

                <div className="flex items-center gap-2">
                    <UserCircle size={30} />
                    <span className="text-sm font-medium">
                        Administrator
                    </span>
                </div>
            </div>

        </header>
    );
}