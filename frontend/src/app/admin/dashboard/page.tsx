
"use client";

import { useState } from "react";

type Exam = {
    id: number;
    name: string;
    board: string;
    className: string;
    subject: string;
    students: number;
    totalSheets: number;
    evaluated: number;
    status: "Active" | "Completed" | "Pending";
};

const initialExams: Exam[] = [
    {
        id: 1,
        name: "Annual Examination 2026",
        board: "CBSE",
        className: "10",
        subject: "Mathematics",
        students: 250,
        totalSheets: 250,
        evaluated: 180,
        status: "Active",
    },
    {
        id: 2,
        name: "Half Yearly Examination",
        board: "RBSE",
        className: "12",
        subject: "Physics",
        students: 180,
        totalSheets: 180,
        evaluated: 180,
        status: "Completed",
    },
    {
        id: 3,
        name: "Pre Board Examination",
        board: "CBSE",
        className: "9",
        subject: "Science",
        students: 200,
        totalSheets: 150,
        evaluated: 60,
        status: "Pending",
    },
];

export default function AdminDashboard() {
    const [exams] = useState<Exam[]>(initialExams);
    const [search, setSearch] = useState("");

    const totalStudents = exams.reduce((s, e) => s + e.students, 0);
    const totalSheets = exams.reduce((s, e) => s + e.totalSheets, 0);
    const evaluated = exams.reduce((s, e) => s + e.evaluated, 0);
    const pending = totalSheets - evaluated;

    const progress = totalSheets
        ? Math.round((evaluated / totalSheets) * 100)
        : 0;

    const filteredExams = exams.filter((exam) =>
        `${exam.name} ${exam.board} ${exam.subject}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const stats = [
        {
            label: "Total Exams",
            value: exams.length,
            icon: "▤",
            color: "bg-blue-50 text-blue-600",
        },
        {
            label: "Total Students",
            value: totalStudents.toLocaleString(),
            icon: "♙",
            color: "bg-violet-50 text-violet-600",
        },
        {
            label: "Answer Sheets",
            value: totalSheets.toLocaleString(),
            icon: "▧",
            color: "bg-amber-50 text-amber-600",
        },
        {
            label: "Evaluated Sheets",
            value: evaluated.toLocaleString(),
            icon: "✓",
            color: "bg-emerald-50 text-emerald-600",
        },
    ];

    return (
        <div className="min-h-screen bg-slate-100">
            <main className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-8">

                {/* PAGE TITLE */}
                <section className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Dashboard Overview
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Monitor examination and answer sheet evaluation.
                        </p>
                    </div>

                    <div className="text-sm text-slate-500">
                        Admin Dashboard
                    </div>
                </section>

                {/* STATISTICS */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => (
                        <div
                            key={item.label}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-500">
                                    {item.label}
                                </p>
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${item.color}`}>
                                    {item.icon}
                                </div>
                            </div>

                            <h3 className="mt-4 text-3xl font-bold text-slate-900">
                                {item.value}
                            </h3>

                            <p className="mt-2 text-xs text-slate-400">
                                Overall statistics
                            </p>
                        </div>
                    ))}
                </section>

                {/* EVALUATION PROGRESS */}
                <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="font-bold text-slate-800">
                                    Overall Evaluation Progress
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Answer sheet evaluation summary
                                </p>
                            </div>

                            <span className="rounded-lg bg-blue-50 px-3 py-2 text-lg font-bold text-blue-600">
                                {progress}%
                            </span>
                        </div>

                        <div className="mt-8 flex justify-between text-sm">
                            <span className="font-medium text-slate-700">
                                Evaluation completed
                            </span>
                            <span className="text-slate-500">
                                {evaluated} / {totalSheets}
                            </span>
                        </div>

                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="mt-6 flex flex-wrap gap-6 text-sm">
                            <span className="text-emerald-600">
                                ● Evaluated: {evaluated}
                            </span>
                            <span className="text-amber-600">
                                ● Pending: {pending}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800">
                            Exam Summary
                        </h3>

                        <div className="mt-6 space-y-5">
                            {[
                                {
                                    label: "Active Exams",
                                    value: exams.filter(e => e.status === "Active").length,
                                    color: "text-blue-600",
                                },
                                {
                                    label: "Completed Exams",
                                    value: exams.filter(e => e.status === "Completed").length,
                                    color: "text-emerald-600",
                                },
                                {
                                    label: "Pending Exams",
                                    value: exams.filter(e => e.status === "Pending").length,
                                    color: "text-amber-600",
                                },
                                {
                                    label: "Pending Sheets",
                                    value: pending,
                                    color: "text-red-600",
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-sm text-slate-500">
                                        {item.label}
                                    </span>
                                    <span className={`text-lg font-bold ${item.color}`}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* EXAM TABLE */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                        <div>
                            <h3 className="font-bold text-slate-800">
                                Recent Examinations
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Examination-wise evaluation status
                            </p>
                        </div>

                        <input
                            type="text"
                            placeholder="Search exam or subject..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 sm:w-72"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Examination</th>
                                    <th className="px-5 py-4">Board</th>
                                    <th className="px-5 py-4">Class</th>
                                    <th className="px-5 py-4">Subject</th>
                                    <th className="px-5 py-4">Students</th>
                                    <th className="px-5 py-4">Evaluation</th>
                                    <th className="px-5 py-4">Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredExams.map((exam) => {
                                    const percentage = exam.totalSheets
                                        ? Math.round(
                                            (exam.evaluated / exam.totalSheets) * 100
                                        )
                                        : 0;

                                    return (
                                        <tr key={exam.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-4 font-semibold text-slate-800">
                                                {exam.name}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {exam.board}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {exam.className}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {exam.subject}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {exam.students}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-20 rounded-full bg-slate-100">
                                                        <div
                                                            className="h-2 rounded-full bg-blue-600"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500">
                                                        {percentage}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    exam.status === "Completed"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : exam.status === "Active"
                                                        ? "bg-blue-50 text-blue-700"
                                                        : "bg-amber-50 text-amber-700"
                                                }`}>
                                                    {exam.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredExams.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">
                                            No examinations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="pb-3 text-center text-xs text-slate-400">
                    OSM Admin Dashboard © 2026
                </footer>

            </main>
        </div>
    );
}
