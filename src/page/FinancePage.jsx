// src/page/FinancePage.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/sidebar";
import toast from "react-hot-toast";

const FinancePage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        toast.error("Silakan login untuk mengakses halaman ini.");
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "transaksi"),
          where("userId", "==", currentUser.uid),
          orderBy("tanggal", "desc")
        );
        const querySnapshot = await getDocs(q);
        const transactionList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactions(transactionList);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Gagal memuat data transaksi.");
      }
      setLoading(false);
    };

    fetchTransactions();
  }, [currentUser]);
  
  if (!currentUser) {
    return (
      <div className="min-h-screen w-screen flex justify-center items-center bg-gray-100">
        <p>Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex bg-gray-100 text-gray-800">
      <Sidebar className="w-64" />
      <main className="flex-1 p-6 md:p-10">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Laporan Keuangan</h1>
          {loading ? (
            <p>Memuat transaksi...</p>
          ) : transactions.length === 0 ? (
            <p>Belum ada transaksi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detail Item
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((trx) => (
                    <tr key={trx.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trx.kode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trx.tanggal
                          ? new Date(
                              trx.tanggal.seconds * 1000
                            ).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rp {trx.totalHarga.toLocaleString()}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        Rp {trx.profit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <ul>
                          {trx.items.map((item, index) => (
                            <li key={index}>
                              {item.nama} ({item.jumlah} x Rp {item.harga_jual.toLocaleString()})
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FinancePage;