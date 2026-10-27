import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AddUserModal from "../components/AddUserModal";
import EditUserModal from "../components/EditUserModal";
import { Search, Plus, Pencil, User, Menu, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { deleteUserApi, fetchUsersApi } from "../../services/adminAllApi";
import Swal from 'sweetalert2';

export default function AdminUsers() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userData, setUserData] = useState([])

    // Search and Pagination State
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsEditUserModalOpen(true);
    };

    const fetchUsers = async () => {
        try {
            // Fetch all users with a high limit to handle client-side pagination for now
            const result = await fetchUsersApi("limit=1000");
            console.log("result:::", result);
            if (result.status === 200) {
                setUserData(result.data.data || []);
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    const deleteUser = async (user) => {
        console.log("Delete User Triggered for:", user);

        const confirmResult = await Swal.fire({
            title: 'Are you sure?',
            text: `You want to delete ${user.fullName || "this user"}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#14B8A6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (confirmResult.isConfirmed) {
            try {
                if (!user.id) {
                    Swal.fire('Error', "Cannot delete user without an ID.", 'error');
                    return;
                }

                const result = await deleteUserApi(user.id);

                if (result.status === 200) {
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'User has been deleted.',
                        icon: 'success',
                        iconColor: '#14B8A6'
                    });
                    fetchUsers();
                } else {
                    Swal.fire(
                        'Error!',
                        'Failed to delete user.',
                        'error'
                    );
                }
            }
            catch (error) {
                console.error("Delete function error:", error);
                Swal.fire(
                    'Error!',
                    'An unexpected error occurred.',
                    'error'
                );
            }
        }
    }

    useEffect(() => {
        fetchUsers();
    }, [])

    // Filter Logic
    const filteredUsers = userData.filter(user =>
        (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.mobile && user.mobile.includes(searchTerm))
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Mock Data
    // Mock Data removed

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            {/* Sidebar */}
            <AdminSidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={toggleSidebar}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            {/* Main Content Area */}
            <main
                className={`flex-1 min-h-screen transition-all duration-300 ease-in-out p-6 lg:p-10
            ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
        `}
            >
                {/* Mobile Header */}
                <div className="lg:hidden mb-6 flex justify-between items-center">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-lg bg-slate-900 text-white shadow-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Shifa Clinic</h1>
                    <div className="w-10"></div>
                </div>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                        <p className="text-gray-500 mt-1">Add and manage clinic staff accounts</p>
                    </div>
                    <button
                        onClick={() => setIsAddUserModalOpen(true)}
                        className="bg-[#14B8A6] hover:bg-teal-600 text-white px-5 text-sm py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-teal-900/10"
                    >
                        <Plus size={20} />
                        Add User
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or mobile..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all bg-white"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>

                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {currentUsers.length > 0 ? (
                                    currentUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-teal-50 text-[#14B8A6] flex items-center justify-center shrink-0">
                                                        <User size={18} />
                                                    </div>
                                                    <span className="font-medium text-slate-900 border-b border-transparent group-hover:border-gray-300 transition-all cursor-pointer">
                                                        {user.fullName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                {user.mobile}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.role}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-center gap-3" >
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="text-gray-400 hover:text-[#14B8A6] p-2 hover:bg-teal-50 rounded-lg transition-colors"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(user)}
                                                        className="text-red-500 hover:text-[#14B8A6] p-2 hover:bg-teal-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                            No users found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium text-gray-900">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-900">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of <span className="font-medium text-gray-900">{filteredUsers.length}</span> results
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-lg border border-gray-200 transition-colors
                                        ${currentPage === 1
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#14B8A6]'}`}
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                <div className="flex items-center gap-1">
                                    {(() => {
                                        let pages = [];
                                        if (totalPages <= 3) {
                                            pages = [...Array(totalPages).keys()].map(i => i + 1);
                                        } else {
                                            if (currentPage === 1) pages = [1, 2, 3];
                                            else if (currentPage === totalPages) pages = [totalPages - 2, totalPages - 1, totalPages];
                                            else pages = [currentPage - 1, currentPage, currentPage + 1];
                                        }
                                        return pages.map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => paginate(page)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                                                ${currentPage === page
                                                        ? 'bg-[#14B8A6] text-white shadow-sm'
                                                        : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {page}
                                            </button>
                                        ));
                                    })()}
                                </div>

                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-lg border border-gray-200 transition-colors
                                        ${currentPage === totalPages
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#14B8A6]'}`}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <AddUserModal
                    isOpen={isAddUserModalOpen}
                    onClose={() => setIsAddUserModalOpen(false)}
                    onUpdate={fetchUsers}
                />

                <EditUserModal
                    isOpen={isEditUserModalOpen}
                    onClose={() => setIsEditUserModalOpen(false)}
                    user={selectedUser}
                    onUpdate={fetchUsers}
                />

            </main>
        </div>
    );
}
