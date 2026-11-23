
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    User,
    Mail,
    LockKeyhole,
    Eye,
    EyeOff,
    GraduationCap,
    Loader2,
} from "lucide-react";

import { signupApi } from "@/api/apiCall";

export default function SignupPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        setError("");

        if (form.password.length < 8) {
            setError("Password must contain at least 8 characters");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            signupApi(form);

            router.replace("/");

        } catch (err: any) {
            setError(err.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">

            <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden">

                {/* LEFT SIDE */}

                <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 p-10 text-white">

                    <div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/15 p-3 rounded-xl">
                                <GraduationCap size={30} />
                            </div>

                            <div>
                                <h1 className="text-xl font-bold">
                                    On-Screen Marking
                                </h1>
                                <p className="text-blue-200 text-xs">
                                    Examination Management System
                                </p>
                            </div>
                        </div>

                        <div className="mt-24">
                            <h2 className="text-3xl font-bold leading-snug">
                                Join Our Evaluation
                                <br />
                                Platform
                            </h2>

                            <p className="mt-5 text-blue-100 leading-7">
                                Create your account to access
                                examination evaluation services
                                securely.
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-blue-100">
                        Secure Role-Based Access
                    </p>
                </div>

                {/* RIGHT SIDE */}

                <div className="p-7 sm:p-12 flex flex-col justify-center">

                    <div className="md:hidden flex justify-center mb-6">
                        <div className="bg-blue-600 p-3 rounded-xl text-white">
                            <GraduationCap size={30} />
                        </div>
                    </div>

                    <div className="mb-7">
                        <h2 className="text-2xl font-bold text-slate-800">
                            Create Account
                        </h2>

                        <p className="text-slate-500 text-sm mt-2">
                            Register to get started.
                        </p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">

                        {/* NAME */}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Full Name
                            </label>

                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-800"
                                />
                            </div>
                        </div>

                        {/* EMAIL */}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Email Address
                            </label>

                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-800"
                                />
                            </div>
                        </div>

                        {/* PASSWORD */}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Password
                            </label>

                            <div className="relative">
                                <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({ ...form, password: e.target.value })
                                    }
                                    placeholder="Create password"
                                    autoComplete="new-password"
                                    className="w-full pl-11 pr-12 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-800"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* CONFIRM PASSWORD */}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                required
                                minLength={8}
                                value={form.confirmPassword}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        confirmPassword: e.target.value,
                                    })
                                }
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-800"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>

                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{" "}
                            <button
                                onClick={() => router.push("/")}
                                className="cursor-pointer font-semibold text-blue-600 hover:underline"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>

                </div>
            </div>
        </main>
    );
}
