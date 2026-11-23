"use client"

import { getCurrentUserApi } from "@/api/apiCall";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
    children: React.ReactNode;
    allowRoutes: string[];
}

const ProtectedRoutes = ({ children, allowRoutes }: Props) => {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {

        checkUserRole();
    }, [router, allowRoutes]);

    const checkUserRole = async () => {
        try {
            setLoading(true);
            const currentUser = await getCurrentUserApi();
            console.log(currentUser,'currentUser')
            if (allowRoutes.includes(currentUser?.data?.role)) {
                router.push("/admin/dashboard");
                setAuthorized(true);
            } else {
                router.push("/");
            }
        }
        catch (error) {
            console.error(error, "failed api call get current user");
        }
        finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="p-5">Checking authentication...</div>;
    }
    if (!authorized) return null;

    return children;
}

export default ProtectedRoutes;