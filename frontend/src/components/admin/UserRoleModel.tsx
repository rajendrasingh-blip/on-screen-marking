"use client";

import { updateRoleApi } from "@/api/apiCall";
import { useState } from "react";

const roles = [{ id: 1, role: "ADMIN" }, { id: 2, role: "EXAMINER" }, { id: 3, role: "STUDENT" }];

export default function UpdateRoleModal(props) {
    const { onClose, selectedUser } = props;
    const [selectedRole, setSelectedRole] = useState("STUDENT");
    const [isLoading, setIsLoading] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateRoleApi({ id: selectedUser._id, role: selectedRole });
            onClose(false);
        } catch (error) {
            console.error("Failed to update role:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            {/* Backdrop click to close */}
            <div className="fixed inset-0" onClick={() => onClose(false)}></div>

            {/* Modal Box */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Update User Role</h3>
                        <p className="text-sm text-gray-500">
                            Change permissions for <span className="font-medium text-gray-800">{selectedUser?.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => onClose(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-3">
                        {roles.map((role: any) => {
                            const isSelected = selectedRole === role.role;
                            return (
                                <label
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.role)}
                                    className={`flex items-start p-3.5 border rounded-xl cursor-pointer transition-all ${isSelected
                                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                >
                                    <div className="flex items-center h-5">
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role.role}
                                            checked={isSelected}
                                            onChange={() => setSelectedRole(role.role)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <span className={`font-medium block ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                                            {role.role}
                                        </span>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}