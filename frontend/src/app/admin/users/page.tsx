"use client"
import { getAllUserApi } from "@/api/apiCall";
import UpdateRoleModal from "@/components/admin/UserRoleModel";
import { usersStore } from "@/store/examStore";
import { User } from "@/types/globalTypes";
import { useEffect, useState, } from "react"

const userManagement = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const users = usersStore((state) => state.users);
    console.log(users, 'users');

    useEffect(() => {

        getAllUserApi();
    }, []);

    const handleEdit = (user: any) => {
        setIsOpen(true);
        setSelectedUser(user);
    }
    return (
        <div className="p-6">

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">
                    Users Management
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage registered users and their roles.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">

                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr
                                key={user._id}
                                className="border-t border-slate-100"
                            >
                                <td className="p-4 font-medium text-slate-800">
                                    {user.name}
                                </td>

                                <td className="p-4 text-slate-600">
                                    {user.email}
                                </td>

                                <td className="p-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                        {user.role}
                                    </span>
                                </td>

                                <td className="p-4">
                                    <span className={
                                        user.isActive
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }>
                                        {user.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="px-3 py-2 cursor-pointer text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                                    >
                                        Update Role
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {users.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-500">
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {(isOpen && selectedUser) && <UpdateRoleModal
                onClose={setIsOpen}
                selectedUser={selectedUser}
            />}
        </div>
    )
}

export default userManagement;