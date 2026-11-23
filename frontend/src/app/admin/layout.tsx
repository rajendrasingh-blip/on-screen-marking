"use client"
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ProtectedRoutes from "@/components/admin/ProtectedRoutes";
import { useState } from "react";

const adminLayout = ({ children }: {
    children: React.ReactNode;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <ProtectedRoutes allowRoutes={["ADMIN"]}>
            <div className="min-h-screen bg-slate-100">
                <AdminSidebar open={isOpen} setOpen={setIsOpen} />
                <div className="lg:ml-64 min-h-screen">
                    <AdminHeader setOpen={setIsOpen} />
                    <main>
                        {
                            children
                        }
                    </main>
                </div>
            </div>
        </ProtectedRoutes>
    )
}

export default adminLayout;