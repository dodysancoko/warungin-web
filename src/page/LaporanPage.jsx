// src/page/LaporanPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Import komponen-komponen yang dibutuhkan
import Sidebar from '../components/ui/sidebar'; // SESUAIKAN PATH INI
import SummaryCard from '../components/SummaryCard'; // SESUAIKAN PATH
import TransactionCard from '../components/TransactionCard'; // SESUAIKAN PATH
import GrafikOmsetPage from './GrafikOmsetPage'; // Pastikan GrafikOmsetPage ada di folder page
import AddTransactionPage from './AddTransactionPage'; // Pastikan AddTransactionPage ada di folder page

// Import service dan types
import { TransactionService } from '../service/transactionService'; // SESUAIKAN PATH
import { TransactionType } from '../types/transactionTypes'; // SESUAIKAN PATH

// Import pustaka formatting tanggal dan mata uang
// import { Intl } from 'intl';

// Menggunakan Tailwind classes untuk layout utama dan beberapa elemen
// Sisa styling inline untuk elemen spesifik LaporanPage atau modal
const pageStyles = {
   // --- Gaya Baru untuk Modal Pop-up ---
   modalOverlay: {
       position: 'fixed', // Tetap di viewport
       top: 0,
       left: 0,
       right: 0,
       bottom: 0,
       backgroundColor: 'rgba(0, 0, 0, 0.6)', // Latar belakang gelap transparan (bg-black opacity-60)
       display: 'flex',
       justifyContent: 'center', // Pusatkan horizontal
       alignItems: 'center', // Pusatkan vertikal
       zIndex: 1000, // Pastikan di atas semua elemen lain (sidebar, konten, FAB)
       padding: '20px', // Padding agar modal tidak terlalu mepet ke tepi di layar kecil
   },
   modalContent: {
       backgroundColor: 'white', // bg-white
       borderRadius: '8px', // rounded-lg
       boxShadow: '0 5px 15px rgba(0,0,0,0.3)', // custom shadow
       // --- UBAH LEBAR MENJADI PERSENTASE DI SINI ---
       width: '70%',      // Ambil 70% dari lebar parent (overlay = viewport)
       maxWidth: '600px', // Batasi lebar maksimum di layar sangat lebar (opsional, sesuaikan)
       // Anda bisa juga mencoba: width: '65%', maxWidth: '75%'
       // Atau jika ingin murni proporsional tanpa batas atas (hati-hati di layar besar):
       // width: '70%',
       // maxWidth: 'none', // atau hilangkan baris maxWidth sepenuhnya

       maxHeight: '90vh', // Tinggi maksimum agar bisa scroll jika form panjang
       overflowY: 'auto', // Aktifkan scroll di dalam modal
       // Konten internal modal (AddTransactionPage) akan menyesuaikan ukuran ini
   },

   // --- Gaya Lain di pageStyles Tetap Sama ---
    mainLayoutContainer: {
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6', // bg-gray-100 equivalent
    },
    contentAreaWrapper: {
        flexGrow: 1,
        overflowY: 'auto', // Scrolling di area ini
        display: 'flex',
        flexDirection: 'column',
    },
     laporanPageContainer: {
         display: 'flex',
         flexDirection: 'column',
     },
    header: {
      height: '139px',
      width: '100%',
      backgroundColor: '#64b5f6', // bg-sky-400 equivalent
      borderRadius: '0 0 20px 20px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.26)',
      padding: '40px 16px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
    },
    headerTextGroup: { display: 'flex', alignItems: 'center' },
    headerText: { fontSize: '20px', color: 'white', fontWeight: '600', cursor: 'pointer' },
    headerSeparator: { height: '24px', width: '1.5px', backgroundColor: 'rgba(255,255,255,0.5)', margin: '0 10px' },
    monthSelector: {
       padding: '8px 16px',
       border: '1.5px solid rgba(255,255,255,0.8)',
       borderRadius: '30px',
       color: 'white',
       fontSize: '15px',
       fontWeight: '500',
       cursor: 'pointer',
       display: 'flex',
       alignItems: 'center',
    },
     summaryCardsArea: {
        padding: '0 20px', // px-5
        marginTop: '-40px', // -mt-10
        zIndex: 10, // z-10
        flexShrink: 0, // flex-shrink-0
    },
    contentArea: {
       flexGrow: 1,
       backgroundColor: 'white', // bg-white
       marginTop: '20px', // mt-5
       padding: '20px', // p-5
       boxShadow: '0 5px 15px rgba(0,0,0,0.1)', // shadow-lg equivalent
       borderRadius: '12px 12px 0 0', // rounded-t-xl equivalent
       overflowY: 'hidden', // Jangan scroll di sini
    },
     transactionDateHeader: {
       marginTop: '16px',
       marginBottom: '8px',
       color: 'rgba(0,0,0,0.6)', // text-gray-600
       fontSize: '14px',
       fontWeight: '600', // font-semibold
    },
    noTransactionsMessage: {
       padding: '40px 0',
       textAlign: 'center',
       color: 'grey',
       fontSize: '16px',
    },
    fabButton: {
       position: 'fixed',
       bottom: '24px',
       right: '24px',
       backgroundColor: '#0EA5E9', // bg-sky-500
       color: 'white',
       borderRadius: '9999px', // rounded-full
       width: '56px', // p-4 ~ 16*2 + 24 = 56
       height: '56px',
       border: 'none',
       cursor: 'pointer',
       fontSize: '30px',
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
       boxShadow: '0 4px 6px rgba(0,0,0,0.1)', // shadow-lg
       zIndex: 30, // z-30
    },

};


function LaporanPage() {
  const navigate = useNavigate();
  const [isChartViewActive, setIsChartViewActive] = useState(false);
  const [allTransactions, setAllTransactions] = useState([]);
  const [isExpanded, setIsExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false); // State untuk modal

  // --- Derived State (Memoization) --- (Kode sama seperti sebelumnya)
   const groupedTransactions = useMemo(() => {
     if (!allTransactions) return {};
     const grouped = {};
     allTransactions.forEach(transaction => {
       const dateKey = new Date(transaction.date).toISOString().split('T')[0];
       if (!grouped[dateKey]) grouped[dateKey] = [];
       grouped[dateKey].push(transaction);
     });
     const sortedDateKeys = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
     const sortedGrouped = {};
     sortedDateKeys.forEach(dateKey => {
        sortedGrouped[dateKey] = grouped[dateKey].sort((a, b) => b.date.getTime() - a.date.getTime());
     });
     return sortedGrouped;
   }, [allTransactions]);

   const { chartSpots, chartMaxY, chartMonthLabels, selectedMonthIncome } = useMemo(() => {
     if (!allTransactions) return { chartSpots: [], chartMaxY: 50000, chartMonthLabels: [], selectedMonthIncome: 0 };
     const allIncomeTransactions = allTransactions.filter(t => t.type === TransactionType.income);
     const now = new Date();
     let maxIncome = 0;
     const monthLabels = [];
     const spots = [];
     const monthFormat = new Intl.DateTimeFormat('id-ID', { month: 'short' });
     let currentMonthIncome = 0;

     for (let i = 0; i < 12; i++) {
       const targetDate = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
       const targetMonth = targetDate.getMonth();
       const targetYear = targetDate.getFullYear();
       const total = allIncomeTransactions
           .filter(t => { const txDate = new Date(t.date); return txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear; })
           .reduce((sum, item) => sum + item.amount, 0.0);
       spots.push({ x: i, y: total });
       monthLabels.push(monthFormat.format(targetDate));
       if (total > maxIncome) maxIncome = total;
       if (i === 11) currentMonthIncome = total;
     }
     const calculatedMaxY = maxIncome === 0 ? 100000 : maxIncome * 1.2;
     return { chartSpots: spots, chartMaxY: calculatedMaxY, chartMonthLabels: monthLabels, selectedMonthIncome: currentMonthIncome };
   }, [allTransactions]);

   const { totalIncomeThisMonth, totalExpenseThisMonth } = useMemo(() => {
        if (!allTransactions) return { totalIncomeThisMonth: 0, totalExpenseThisMonth: 0 };
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const income = allTransactions
            .filter(t => { const txDate = new Date(t.date); return t.type === TransactionType.income && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear; })
            .reduce((sum, item) => sum + item.amount, 0.0);
         const expense = allTransactions
            .filter(t => { const txDate = new Date(t.date); return t.type === TransactionType.expense && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear; })
            .reduce((sum, item) => sum + item.amount, 0.0);
         return { totalIncomeThisMonth: income, totalExpenseThisMonth: expense };
    }, [allTransactions]);

   const currencyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 });


  // --- Effects --- (Kode sama seperti sebelumnya)
   useEffect(() => {
     const fetchData = async () => {
       try {
         setLoading(true);
         const data = await TransactionService.getTransactions();
         const processedData = data.map(tx => ({
             ...tx,
             date: tx.date instanceof Date ? tx.date : new Date(tx.date)
         }));
         const initialExpandedState = {};
         processedData.forEach(tx => { initialExpandedState[tx.id] = false; });
         setAllTransactions(processedData);
         setIsExpanded(initialExpandedState);
         setError(null);
       } catch (err) {
         console.error("Error fetching transactions:", err);
         setError("Gagal memuat transaksi.");
         setAllTransactions([]);
       } finally {
         setLoading(false);
       }
     };
     fetchData();
   }, []);

  // --- Handlers --- (Kode sama seperti sebelumnya)
   const handleSetView = (isChart) => {
     if (isChartViewActive !== isChart) {
       setIsChartViewActive(isChart);
     }
   };

   const handleToggleExpansion = (transactionId) => {
     setIsExpanded(prev => ({
       ...prev,
       [transactionId]: !(prev[transactionId] ?? false),
     }));
   };

   const handleTransactionSaved = async (newTransaction) => {
      console.log("Transaksi disimpan dari modal:", newTransaction);
      try {
         await TransactionService.addTransaction(newTransaction);
         const updatedTransactions = await TransactionService.getTransactions();
          const processedData = updatedTransactions.map(tx => ({
              ...tx,
              date: tx.date instanceof Date ? tx.date : new Date(tx.date)
          }));
         const newExpandedState = {};
         processedData.forEach(tx => {
              newExpandedState[tx.id] = isExpanded[tx.id] ?? false;
         });
         setAllTransactions(processedData);
         setIsExpanded(newExpandedState);
         setError(null);
      } catch (err) {
         console.error("Error saving transaction via service:", err);
          setError("Gagal menyimpan transaksi.");
      } finally {
          setShowAddModal(false);
      }
   };

    const handleCancelAdd = () => {
       setShowAddModal(false);
    };


  // --- Render Logic for the Transaction List Content --- (Kode sama seperti sebelumnya)
    const buildListViewContent = () => {
       const sortedDates = Object.keys(groupedTransactions);

       if (sortedDates.length === 0 && !loading && !error) {
         return (
           <div className="flex justify-center items-center h-full text-center">
              <p className="mt-4 text-lg font-poppins font-semibold text-gray-700">
                 Belum ada transaksi.
              </p>
           </div>
         );
       }

       return (
         <div className="flex flex-col">
            {sortedDates.map(dateKey => (
              <React.Fragment key={dateKey}>
                <div className={isChartViewActive ? '' : "mt-4 mb-2 text-gray-600 text-sm font-semibold"}>
                  {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateKey))}
                </div>
                {groupedTransactions[dateKey].map(transaction => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    isExpanded={isExpanded[transaction.id] ?? false}
                    onToggleExpansion={() => handleToggleExpansion(transaction.id)}
                  />
                ))}
              </React.Fragment>
            ))}
            <div className="h-20"></div>
         </div>
       );
    };


  // --- Main Render Function ---
  return (
    // Wrapper utama flex: Sidebar + Konten Laporan
    <div className="flex h-screen overflow-hidden bg-gray-100">
        {/* Komponen Sidebar Anda */}
        <Sidebar />

        {/* Wrapper untuk Area Konten yang Bisa Di-scroll */}
        <div className="flex-1 flex flex-col overflow-hidden">

            {/* Header LaporanPage - Mirip header Produk */}
            <div className="bg-sky-400 p-5 rounded-b-xl shadow-md relative h-[139px] flex-shrink-0">
               <div className="mt-5 flex justify-between items-center">
                   {/* Toggle Laporan | Bulanan */}
                   <div className="flex items-center">
                       <span
                         className={`text-white text-xl font-poppins font-semibold cursor-pointer ${isChartViewActive ? 'opacity-70' : 'opacity-100'}`}
                         onClick={() => handleSetView(false)}
                       >
                         Laporan
                       </span>
                       <div className="h-6 w-0.5 bg-white bg-opacity-50 mx-2.5"></div>
                       <span
                         className={`text-white text-xl font-poppins font-semibold cursor-pointer ${isChartViewActive ? 'opacity-100' : 'opacity-40'}`}
                         onClick={() => handleSetView(true)}
                       >
                         Bulanan
                       </span>
                   </div>
                   {/* Month Selector Button (hanya di mode Laporan List) */}
                   <span
                      className={`px-4 py-2 border border-white border-opacity-80 rounded-full text-white text-sm font-medium cursor-pointer flex items-center ${isChartViewActive ? 'opacity-40 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
                      onClick={() => { if (!isChartViewActive) console.log("Month selector tapped"); }}
                   >
                      {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date())}
                   </span>
               </div>
            </div>

            {/* Area Tumpang Tindih (-mt-10) - untuk Summary Cards */}
            <div className="px-5 -mt-10 z-10 flex-shrink-0">
                <div className="flex justify-center gap-4">
                   <SummaryCard
                       title="Pemasukkan Bulan Ini"
                       value={currencyFormat.format(totalIncomeThisMonth)}
                       isIncome={true}
                   />
                   <SummaryCard
                       title="Pengeluaran Bulan Ini"
                       value={currencyFormat.format(totalExpenseThisMonth)}
                       isIncome={false}
                   />
                </div>
            </div>

            {/* Area Konten Utama yang Bisa Di-scroll - List Transaksi atau Grafik */}
            <div className="flex-grow bg-white mt-5 p-5 shadow-lg rounded-t-xl overflow-y-auto">
              {loading && !allTransactions.length ? (
                 <div className="flex justify-center items-center h-full">
                   <p className="text-gray-500 font-poppins">Memuat laporan...</p>
                 </div>
               ) : error ? (
                  <div className="flex justify-center items-center h-full">
                   <p className="text-center text-red-500 font-poppins">{error}</p>
                 </div>
               ) : (
                  isChartViewActive
                  ? <GrafikOmsetPage
                      totalIncomeForMonth={selectedMonthIncome}
                      monthlyIncomeSpots={chartSpots}
                      maxYValue={chartMaxY}
                      monthLabels={chartMonthLabels}
                    />
                  : buildListViewContent()
               )}
            </div>

         </div> {/* Akhir wrapper area konten */}


      {/* Tombol FAB (Tetap di LaporanPage, posisinya fixed ke viewport) */}
       {/* Munculkan hanya saat di tampilan Laporan (List View) jika diinginkan */}
       {!isChartViewActive && (
         <button
             className="fixed bottom-6 right-6 bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-full shadow-lg z-30" // z-index 30
             onClick={() => setShowAddModal(true)}
             aria-label="Tambah Transaksi"
         >
             +
         </button>
       )}

      {/* Render Modal AddTransactionPage secara kondisional */}
      {showAddModal && (
          // Wrapper Overlay dan Kontainer Modal
          <div style={pageStyles.modalOverlay} onClick={handleCancelAdd}> {/* Klik overlay untuk tutup */}
              <div style={pageStyles.modalContent} onClick={(e) => e.stopPropagation()}> {/* Stop propagation */}
                   {/* Komponen AddTransactionPage (sekarang isinya saja) */}
                  <AddTransactionPage
                      onSave={handleTransactionSaved}
                      onCancel={handleCancelAdd}
                  />
              </div>
          </div>
      )}
    </div> // Akhir main layout container
  );
}

export default LaporanPage;