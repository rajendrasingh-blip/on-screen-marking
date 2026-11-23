"use client"
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, GraduationCap, ShieldCheck, Loader2, } from "lucide-react";
import { useRouter } from "next/navigation";
import { loginApi } from "@/api/apiCall";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await loginApi({ email, password });

      console.log("Login API Response:", res);

      const role = res?.data?.role;

      if (!res?.success || !role) {
        setError(res?.message || "Invalid login response");
        return;
      }

      if (role === "ADMIN") {
        router.replace("/admin/dashboard");
      }
      else if (role === "EXAMINER") {
        router.replace("/examiner");
      }
      else if (role === "STUDENT") {
        router.replace("/commonDashboard");
      }
      else {
        setError("Unauthorized user role");
      }

    } catch (error: any) {
      console.error("Login error:", error);
      setError(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden">
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
                Secure Examination
                <br />
                Evaluation Platform
              </h2>

              <p className="mt-5 text-blue-100 leading-7">
                A centralized platform for
                secure answer sheet evaluation,
                examiner management and
                examination monitoring.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-blue-100">
            <ShieldCheck size={20} />
            Secure Role-Based Access
          </div>
        </div>

        {/* RIGHT SIDE */}

        <div className="p-7 sm:p-12 flex flex-col justify-center">

          <div className="md:hidden flex justify-center mb-7">
            <div className="bg-blue-600 p-3 rounded-xl text-white">
              <GraduationCap size={30} />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              Welcome Back
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              Sign in to access your workspace.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="username"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-sm text-slate-800"
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-11 pr-12 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-sm text-slate-800"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center cursor-pointer items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Authorized Personnel Only
            </p>

            <p className="text-xs text-slate-400 mt-2">
              © {new Date().getFullYear()} On-Screen Marking
            </p>
          </div>

        </div>
      </div>

    </main>
  )
}

export default Login;