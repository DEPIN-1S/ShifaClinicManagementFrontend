import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { fetchDailyPharmacyPaymentStatsApi, fetchPharmacyPaymentsApi, downloadPharmacyRevenueApi } from "../../services/adminAllApi";
import { Menu, Search, FileText, ChevronLeft, ChevronRight, IndianRupee, Calendar, Download, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/ShifaClinicLogo.png";
import reportLogo from "../../assets/ShifaClinicLogo (1).png";
import Swal from "sweetalert2";

export default function PharmacyRevenue() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Download Modal State
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadStep, setDownloadStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // Dummy Data
    const [dailyStats, setDailyStats] = useState({
        totalCash: 0,
        totalOnline: 0,
        subtotal: 0
    });

    // API Integration for Stats
    const fetchStats = async () => {
        try {
            const result = await fetchDailyPharmacyPaymentStatsApi();
            if (result.status === 200 && result.data && result.data.data) {
                setLoading(false)
                setDailyStats(result.data.data);
            }
        } catch (error) {
            console.log(error);
        }
    }

    // API Integration for Table
    const fetchPayments = async () => {
        setLoading(true);
        try {
            const result = await fetchPharmacyPaymentsApi(currentPage, itemsPerPage, "");
            if (result.status === 200 && result.data) {
                setPrescriptions(result.data.data || []);
                // Handle pagination if provided by backend
                if (result.data.meta) {
                    setTotalPages(result.data.meta.totalPages || 1);
                } else if (result.data.totalPages) {
                    setTotalPages(result.data.totalPages);
                } else if (result.data.totalCount) {
                    setTotalPages(Math.ceil(result.data.totalCount / itemsPerPage));
                }
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchPayments();
    }, [currentPage]);

    // Client-side pagination logic is replaced by server-side, 
    // but if backend doesn't return total pages, we might default/disable 'next' if empty.
    // For now, mapping `prescriptions` directly as `paginatedData` since backend handles pagination.
    const paginatedData = prescriptions;

    // Use API data directly for stats
    const todayOnline = dailyStats.totalOnline || 0;
    const todayCash = dailyStats.totalCash || 0;
    const todayTotal = dailyStats.subtotal || 0;

    // Pagination helper variables
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const showingStart = totalPages > 0 ? indexOfFirstItem + 1 : 0;
    const showingEnd = indexOfFirstItem + paginatedData.length;

    const handleDownloadClick = () => {
        setDownloadStep(1);
        setSelectedDate("");
        setShowDownloadModal(true);
    };

    const handleDateSubmit = () => {
        if (!selectedDate) return;
        setDownloadStep(2);
    };

    const handleFinalDownload = async (type) => {
        setIsDownloading(true);

        try {
            const result = await downloadPharmacyRevenueApi(selectedDate);
            if (result.status === 200 && result.data) {
                let data = result.data;

                if (result.data.data) {
                    data = result.data.data;
                }

                if (!Array.isArray(data)) {
                    console.error("API response is not an array", data);
                    alert("Failed to download: Invalid data format.");
                    setIsDownloading(false);
                    return;
                }

                // Filter by Type if needed (Including combined payments)
                if (type === 'Online') {
                    data = data.filter(item =>
                        (parseFloat(item.onlinePayment || 0) > 0)
                    );
                }

                if (data.length === 0) {
                    setShowDownloadModal(false);
                    Swal.fire({
                        title: 'No Data!',
                        text: 'No records found for the selected date.',
                        icon: 'info',
                        confirmButtonColor: '#14B8A6'
                    });
                    setIsDownloading(false);
                    return;
                }

                // Add Logo attempt
                try {
                    const doc = new jsPDF('p', 'mm', 'a4');

                    const getLogoDataURL = (src) => {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.crossOrigin = "Anonymous";
                            img.onload = () => {
                                try {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0);
                                    resolve(canvas.toDataURL('image/png'));
                                } catch (e) {
                                    console.error("Canvas conversion failed:", e);
                                    resolve(null);
                                }
                            };
                            img.onerror = (e) => {
                                console.error("Logo image failed to load", e);
                                resolve(null);
                            };
                            img.src = src;
                        });
                    };

                    try {
                        const logoDataURL = await getLogoDataURL(reportLogo);
                        if (logoDataURL) {
                            // Match prescription logo placement
                            doc.addImage(logoDataURL, 'PNG', 10, 5, 20, 20);
                        }
                    } catch (imgError) {
                        console.error("Logo process failed:", imgError);
                    }

                    // Header Text - Matching Prescription Style
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(22);
                    doc.setTextColor(0, 0, 0); // Black
                    doc.text("SHIFA CLINIC", 32, 14);

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(12);
                    doc.setTextColor(80, 80, 80); // #505050
                    doc.text("KILIMANOOR", 32, 20);

                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text(`Report Date: ${new Date(selectedDate).toLocaleDateString()}`, 150, 14);

                    // Horizontal Line - Matching Prescription Style (#C8C8C8)
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.5);
                    doc.line(10, 28, 200, 28);

                    // Report Title
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(14);
                    doc.setTextColor(15, 23, 42); // Slate-900
                    let reportTypeTitle = type === 'Online' ? 'Online Payments' : (type === 'FullNoTotal' ? 'Full Data (Without Total)' : 'Full Data');
                    doc.text(`Pharmacy Revenue Report - ${reportTypeTitle}`, 10, 40);

                    // Table Data Preparation - Dynamic Columns based on type
                    let tableColumn = [];
                    let tableRows = [];

                    if (type === 'Online') {
                        // Online Only PDF: ID, Patient Name, Age, Type, Online, Total
                        tableColumn = ["ID", "Patient Name", "Age", "Type", "Online", "Total"];

                        data.forEach(item => {
                            const rowData = [
                                item.patientUniqueId || item.uniqueId || '-',
                                item.patientName || 'Unknown',
                                calculateAge(item.dob),
                                item.prescriptionType || '-',
                                parseFloat(item.onlinePayment || 0) > 0 ? `${parseFloat(item.onlinePayment).toFixed(2)}` : '-',
                                `${(parseFloat(item.total || item.pharmacyAmount) || 0).toFixed(2)}`
                            ];
                            tableRows.push(rowData);
                        });

                        // Calculate Totals for Online PDF
                        const totalOnline = data.reduce((acc, item) => acc + (parseFloat(item.onlinePayment) || 0), 0);
                        const grandTotal = data.reduce((acc, item) => acc + (parseFloat(item.total || item.pharmacyAmount) || 0), 0);

                        tableRows.push([
                            { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } },
                            { content: `${totalOnline.toFixed(2)}`, styles: { fontStyle: 'bold' } },
                            { content: `${grandTotal.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [20, 184, 166] } }
                        ]);
                    } else {
                        // Full Data PDF: ID, Patient Name, Age, Type, Cash, Online, Razorpay, Total
                        tableColumn = ["ID", "Patient Name", "Age", "Type", "Cash", "Online", "Razorpay", "Total"];

                        data.forEach(item => {
                            const rowData = [
                                item.patientUniqueId || item.uniqueId || '-',
                                item.patientName || 'Unknown',
                                calculateAge(item.dob),
                                item.prescriptionType || '-',
                                parseFloat(item.cash || 0) > 0 ? `${parseFloat(item.cash).toFixed(2)}` : '-',
                                parseFloat(item.onlinePayment || 0) > 0 ? `${parseFloat(item.onlinePayment).toFixed(2)}` : '-',
                                parseFloat(item.razorPay || 0) > 0 ? `${parseFloat(item.razorPay).toFixed(2)}` : '-',
                                `${(parseFloat(item.total || item.pharmacyAmount) || 0).toFixed(2)}`
                            ];
                            tableRows.push(rowData);
                        });

                        // Calculate Totals for Full PDF
                        const totalCash = data.reduce((acc, item) => acc + (parseFloat(item.cash) || 0), 0);
                        const totalOnline = data.reduce((acc, item) => acc + (parseFloat(item.onlinePayment) || 0), 0);
                        const totalRazorpay = data.reduce((acc, item) => acc + (parseFloat(item.razorPay) || 0), 0);
                        const grandTotal = data.reduce((acc, item) => acc + (parseFloat(item.total || item.pharmacyAmount) || 0), 0);

                        if (type !== 'FullNoTotal') {
                            tableRows.push([
                                { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } },
                                { content: `${totalCash.toFixed(2)}`, styles: { fontStyle: 'bold' } },
                                { content: `${totalOnline.toFixed(2)}`, styles: { fontStyle: 'bold' } },
                                { content: `${totalRazorpay.toFixed(2)}`, styles: { fontStyle: 'bold' } },
                                { content: `${grandTotal.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [20, 184, 166] } }
                            ]);
                        }
                    }

                    autoTable(doc, {
                        head: [tableColumn],
                        body: tableRows,
                        startY: 55,
                        theme: 'grid',
                        styles: {
                            fontSize: 8,
                            cellPadding: 2,
                        },
                        headStyles: {
                            fillColor: [248, 250, 252],
                            textColor: [71, 85, 105],
                            fontStyle: 'bold',
                            lineWidth: 0.1,
                            lineColor: [226, 232, 240]
                        },
                        columnStyles: type === 'Online' ? {
                            4: { halign: 'right' },
                            5: { halign: 'right', fontStyle: 'bold' }
                        } : {
                            4: { halign: 'right' },
                            5: { halign: 'right' },
                            6: { halign: 'right' },
                            7: { halign: 'right', fontStyle: 'bold' }
                        },
                        alternateRowStyles: {
                            fillColor: [255, 255, 255]
                        },
                        footStyles: {
                            fillColor: [241, 245, 249],
                            textColor: [15, 23, 42],
                            fontStyle: 'bold'
                        }
                    });

                    // Add Footer
                    const pageCount = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFontSize(8);
                        doc.setTextColor(148, 163, 184);
                        doc.text(`Generated on ${new Date().toLocaleString()}`, 15, doc.internal.pageSize.height - 10);
                        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
                    }

                    doc.save(`Pharmacy_Revenue_${selectedDate}_${type}.pdf`);
                    setShowDownloadModal(false);
                } catch (pdfError) {
                    console.error("PDF generation error details:", pdfError);
                    setShowDownloadModal(false);
                    Swal.fire({
                        title: 'Error!',
                        text: `An error occurred while generating the PDF: ${pdfError.message || "Unknown error"}`,
                        icon: 'error',
                        confirmButtonColor: '#14B8A6'
                    });
                }

            } else {
                setShowDownloadModal(false);
                Swal.fire({
                    title: 'Error!',
                    text: `Failed to fetch data for download: ${result.data?.message || "Unknown error"}`,
                    icon: 'error',
                    confirmButtonColor: '#14B8A6'
                });
            }
        } catch (error) {
            console.error("Download process error:", error);
            setShowDownloadModal(false);
            Swal.fire({
                title: 'Error!',
                text: `An error occurred while downloading: ${error.message || "Unknown error"}`,
                icon: 'error',
                confirmButtonColor: '#14B8A6'
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return '-';
        const birthDate = new Date(dob);
        const today = new Date();

        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            // Get days in previous month
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += prevMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        if (years > 0) return `${years} Years`;
        if (months > 0) return `${months} Months`;
        return `${days} Days`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-poppins">
            <AdminSidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={toggleSidebar}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out p-6 lg:p-10 ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
                {/* Mobile Header */}
                <div className="lg:hidden mb-6 flex justify-between items-center">
                    <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-slate-900 text-white shadow-lg">
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Shifa Clinic</h1>
                    <div className="w-10"></div>
                </div>

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Pharmacy Revenue</h1>
                    <p className="text-gray-500 mt-1">Track pharmacy sales and revenue</p>
                </div>

                {/* Revenue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Today's Total */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Today's Total</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">₹ {todayTotal.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <IndianRupee size={20} />
                        </div>
                    </div>

                    {/* Today's Cash */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Today's Cash</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">₹ {todayCash.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                            <IndianRupee size={20} />
                        </div>
                    </div>

                    {/* Today's Online */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Today's Online</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">₹ {todayOnline.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <IndianRupee size={20} />
                        </div>
                    </div>

                </div>

                {/* Revenue Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col items-start justify-center">
                            <h3 className="font-semibold text-xl text-slate-900">Revenue Details</h3>
                            <p className="text-sm text-gray-400">Overview of pharmacy transactions</p>
                        </div>

                        <div className="relative w-full md:w-auto flex gap-2 justify-end">
                            <button
                                onClick={handleDownloadClick}
                                className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-[#14B8A6] transition-colors border border-gray-50"
                                title="Download Data"
                            >
                                <Download size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 text-left">
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unique ID</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Cash</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Online</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                    <FileText size={24} className="text-gray-400" />
                                                </div>
                                                <p>No todays revenue records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">
                                                    #{item.patientUniqueId || item.uniqueId || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-slate-900 flex items-center gap-2">
                                                    {item.patientName || 'Unknown'}
                                                    {(item.prescriptionType === 'Quick' || item.prescriptionType === 'Quick Prescription' || item.type === 'Quick') && (
                                                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-bold border border-purple-100">
                                                            QP
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {calculateAge(item.dob)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                                {parseFloat(item.cash) > 0 ? `₹ ${parseFloat(item.cash).toLocaleString('en-IN')}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                                {parseFloat(item.onlinePayment) > 0 ? `₹ ${parseFloat(item.onlinePayment).toLocaleString('en-IN')}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="font-bold text-[#14B8A6]">₹ {(parseFloat(item.total || item.pharmacyAmount) || 0).toLocaleString('en-IN')}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium text-gray-900">{showingStart}</span> to <span className="font-medium text-gray-900">{showingEnd}</span> results
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
                                        let start = Math.max(1, currentPage - 1);
                                        let end = Math.min(totalPages, start + 2);
                                        if (end - start < 2 && totalPages >= 3) {
                                            start = Math.max(1, end - 2);
                                        }

                                        const pages = [];
                                        for (let i = start; i <= end; i++) {
                                            pages.push(i);
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

                {/* Download Modal */}
                {showDownloadModal && (
                    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-lg font-bold text-slate-800">
                                    {downloadStep === 1 ? "Select Date" : "Download Options"}
                                </h3>
                                <button onClick={() => setShowDownloadModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                {downloadStep === 1 ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-1 block">Download Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="date"
                                                    value={selectedDate}
                                                    onChange={(e) => setSelectedDate(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleDateSubmit}
                                            disabled={!selectedDate}
                                            className="w-full py-2.5 bg-[#14B8A6] hover:bg-teal-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                        >
                                            Next
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => handleFinalDownload('Full')}
                                            disabled={isDownloading}
                                            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#14B8A6] hover:bg-teal-50/30 transition-all group"
                                        >
                                            <div className="text-left">
                                                <p className="font-bold text-slate-800">Full Payment Data</p>
                                                <p className="text-xs text-gray-500">Download all transaction details with total</p>
                                            </div>
                                            <Download size={18} className="text-gray-400 group-hover:text-[#14B8A6]" />
                                        </button>

                                        <button
                                            onClick={() => handleFinalDownload('FullNoTotal')}
                                            disabled={isDownloading}
                                            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#14B8A6] hover:bg-teal-50/30 transition-all group"
                                        >
                                            <div className="text-left">
                                                <p className="font-bold text-slate-800">Full Payment Data (No Total)</p>
                                                <p className="text-xs text-gray-500">Download all details without grand total</p>
                                            </div>
                                            <Download size={18} className="text-gray-400 group-hover:text-[#14B8A6]" />
                                        </button>

                                        <button
                                            onClick={() => handleFinalDownload('Online')}
                                            disabled={isDownloading}
                                            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#14B8A6] hover:bg-teal-50/30 transition-all group"
                                        >
                                            <div className="text-left">
                                                <p className="font-bold text-slate-800">Online Payment Only</p>
                                                <p className="text-xs text-gray-500">Download online transactions</p>
                                            </div>
                                            <Download size={18} className="text-gray-400 group-hover:text-[#14B8A6]" />
                                        </button>

                                        <button
                                            onClick={() => setDownloadStep(1)}
                                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                                        >
                                            Back
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
