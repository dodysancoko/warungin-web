// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase"; // Sesuaikan path jika perlu
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc, // getDoc masih mungkin dibutuhkan untuk toko
  getDoc, // Duplikat, bisa dihapus salah satu jika tidak ada getDoc untuk dokumen tunggal toko
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/sidebar"; // Sesuaikan path jika perlu
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helper Functions
const formatCurrency = (amount) => {
  if (typeof amount !== "number" || isNaN(amount)) return "Rp0,00";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatToK = (num) => {
  if (typeof num !== "number" || isNaN(num)) return "0";
  if (num === 0) return "0"; // Tangani kasus 0 secara eksplisit

  const numAbs = Math.abs(num);

  if (numAbs < 1000) {
    return new Intl.NumberFormat("id-ID").format(num); // Format angka biasa
  }

  // Untuk nilai 1000 atau lebih
  const K = Math.floor(numAbs / 1000);
  // Ambil satu digit desimal jika ada sisa yang signifikan (misalnya 1.5k bukan 1k untuk 1500)
  const H = Math.round((numAbs % 1000) / 100);

  let result = "";
  if (num < 0) result += "-";

  result += K.toString();
  if (H > 0 && K < 1000) {
    // Hanya tampilkan desimal jika K masih di bawah 1000 (misal 1.5k, 10.2k, tapi 1500k jadi 1.5M)
    // Untuk kasus > 1000k (jutaan), kita akan buat formatToM
    result += "." + H.toString();
  }
  result += "k";
  return result;
};

// Opsional: Fungsi untuk format ke Jutaan (M) jika angka sangat besar
const formatToM = (num) => {
  if (typeof num !== "number" || isNaN(num)) return "0";
  if (num === 0) return "0";

  const numAbs = Math.abs(num);

  if (numAbs < 1000000) {
    // Jika kurang dari 1 juta, gunakan formatToK
    return formatToK(num);
  }

  // Untuk nilai 1 juta atau lebih
  const M = Math.floor(numAbs / 1000000);
  const K_remainder = Math.round((numAbs % 1000000) / 100000); // Satu digit desimal (ratusan ribu)

  let result = "";
  if (num < 0) result += "-";

  result += M.toString();
  if (K_remainder > 0) {
    result += "." + K_remainder.toString();
  }
  result += "M";
  return result;
};

const smartTickFormatter = (value) => {
  if (typeof value !== "number" || isNaN(value)) return "0";
  if (Math.abs(value) >= 1000000) {
    return formatToM(value);
  }
  if (Math.abs(value) >= 1000) {
    return formatToK(value);
  }
  return new Intl.NumberFormat("id-ID").format(value);
};

const getStartAndEndOfWeek = (dateParam = new Date()) => {
  const now = new Date(dateParam);
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    weekStart: Timestamp.fromDate(monday),
    weekEnd: Timestamp.fromDate(sunday),
  };
};

const getStartAndEndOfDay = (dateParam = new Date()) => {
  const start = new Date(dateParam);
  start.setHours(0, 0, 0, 0);

  const end = new Date(dateParam);
  end.setHours(23, 59, 59, 999);

  return {
    dayStart: Timestamp.fromDate(start),
    dayEnd: Timestamp.fromDate(end),
  };
};

const daysInIndonesian = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const orderedDays = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [shopName, setShopName] = useState("Toko Anda");
  const [loading, setLoading] = useState(true);

  const [totalProfit, setTotalProfit] = useState(0);
  const [totalPemasukan, setTotalPemasukan] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);

  const [pemasukanData, setPemasukanData] = useState([]);
  const [pengeluaranData, setPengeluaranData] = useState([]);

  const [hampirHabis, setHampirHabis] = useState([]);
  const [transaksiHariIni, setTransaksiHariIni] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Shop Name (Diasumsikan masih dari collection 'toko')
        const tokoQuery = query(collection(db, "toko"), limit(1));
        const tokoSnap = await getDocs(tokoQuery);
        if (!tokoSnap.empty) {
          setShopName(tokoSnap.docs[0].data().shopname || "Toko Anda");
        }

        const { weekStart, weekEnd } = getStartAndEndOfWeek();
        console.log(
          "fetchData: Fetching weekly transactions for range:",
          weekStart.toDate(),
          "to",
          weekEnd.toDate()
        );

        // Mengambil SEMUA transaksi mingguan dari collection "transaksi"
        const allWeeklyTransactionsQuery = query(
          collection(db, "transaksi"), // TARGET COLLECTION "transaksi"
          where("tanggal", ">=", weekStart), // FIELD "tanggal"
          where("tanggal", "<=", weekEnd) // FIELD "tanggal"
        );
        const transactionsSnap = await getDocs(allWeeklyTransactionsQuery);

        console.log(
          `fetchData: Found ${transactionsSnap.docs.length} documents in 'transaksi' collection this week.`
        );

        let currentWeekPemasukan = 0;
        let currentWeekPengeluaran = 0;
        const dailyPemasukan = Object.fromEntries(
          orderedDays.map((day) => [day, 0])
        );
        const dailyPengeluaran = Object.fromEntries(
          orderedDays.map((day) => [day, 0])
        );

        if (transactionsSnap.empty) {
          console.log(
            "fetchData: No documents found in 'transaksi' for this week."
          );
        }

        transactionsSnap.forEach((docSnap) => {
          // Mengganti 'doc' menjadi 'docSnap'
          const data = docSnap.data();
          console.log("fetchData: Processing document from 'transaksi':", data);

          // Pastikan field 'tanggal' ada dan merupakan Timestamp
          if (!data.tanggal || typeof data.tanggal.toDate !== "function") {
            console.warn(
              "fetchData: Document skipped, missing or invalid 'tanggal' field:",
              data
            );
            return; // Lewati dokumen ini jika tanggal tidak valid
          }
          const transactionDate = data.tanggal.toDate(); // Gunakan field 'tanggal'
          const dayName = daysInIndonesian[transactionDate.getDay()];

          if (data.hasOwnProperty("type")) {
            // Cek apakah field 'type' ada
            if (data.type === "income") {
              currentWeekPemasukan += data.amount || 0; // Gunakan field 'amount'
              if (dailyPemasukan.hasOwnProperty(dayName)) {
                dailyPemasukan[dayName] += data.amount || 0;
              }
            } else if (data.type === "expense") {
              currentWeekPengeluaran += data.amount || 0; // Gunakan field 'amount'
              if (dailyPengeluaran.hasOwnProperty(dayName)) {
                dailyPengeluaran[dayName] += data.amount || 0;
              }
            }
          } else {
            // Jika TIDAK ada field 'type', asumsikan ini adalah transaksi kasir (pemasukan)
            // dan gunakan field 'totalHarga'
            currentWeekPemasukan += data.totalHarga || 0;
            if (dailyPemasukan.hasOwnProperty(dayName)) {
              dailyPemasukan[dayName] += data.totalHarga || 0;
            }
            console.log(
              "fetchData: Processed as cashier income (no 'type' field):",
              data.totalHarga
            );
          }
        });

        console.log("fetchData: Calculated weekly totals:", {
          currentWeekPemasukan,
          currentWeekPengeluaran,
        });

        setTotalPemasukan(currentWeekPemasukan);
        setTotalPengeluaran(currentWeekPengeluaran);
        setTotalProfit(currentWeekPemasukan - currentWeekPengeluaran);

        const pemasukanChartData = orderedDays.map((day) => ({
          // Variabel baru untuk menghindari konflik
          name: day,
          Pemasukan: dailyPemasukan[day] || 0,
        }));
        const pengeluaranChartData = orderedDays.map((day) => ({
          // Variabel baru
          name: day,
          Pengeluaran: dailyPengeluaran[day] || 0,
        }));

        setPemasukanData(pemasukanChartData);
        setPengeluaranData(pengeluaranChartData);

        console.log(
          "fetchData: Pemasukan chart data (final):",
          pemasukanChartData
        );
        console.log(
          "fetchData: Pengeluaran chart data (final):",
          pengeluaranChartData
        );

        // Fetch Low Stock Products (Diasumsikan collection 'produk' dan fieldnya benar)
        const produkQuery = query(collection(db, "produk"));
        const produkSnap = await getDocs(produkQuery);
        const lowStockItems = [];
        produkSnap.forEach((docSnap) => {
          const produk = docSnap.data();
          if (produk.stok <= produk.minimum_stok) {
            lowStockItems.push({ id: docSnap.id, ...produk });
          }
        });
        setHampirHabis(
          lowStockItems.sort((a, b) => a.stok - b.stok).slice(0, 5)
        );

        // Fetch Recent Sales Today (Dari collection "transaksi", field "tanggal" dan "totalHarga")
        const { dayStart, dayEnd } = getStartAndEndOfDay();
        const salesQuery = query(
          collection(db, "transaksi"),
          where("tanggal", ">=", dayStart),
          where("tanggal", "<=", dayEnd),

          orderBy("tanggal", "desc"),
          limit(5)
        );
        const salesSnap = await getDocs(salesQuery);
        const recentSales = [];
        salesSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data.kode &&
            data.hasOwnProperty("totalHarga") &&
            !data.hasOwnProperty("type")
          ) {
            recentSales.push({
              id: docSnap.id,
              kode: data.kode,
              totalHarga: data.totalHarga,
            });
          }
        });
        setTransaksiHariIni(recentSales.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.code) {
          console.error("Firebase error code:", error.code);
          console.error("Firebase error message:", error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);
  if (loading) {
    return (
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />
        <main className="flex-grow p-6 lg:p-8 flex items-center justify-center">
          <p className="text-gray-600 text-lg">Loading dashboard data...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {" "}
      {/* dashboard-container */}
      <Sidebar />
      <main className="flex-grow p-6 lg:p-8 overflow-y-auto">
        {" "}
        {/* dashboard-main */}
        <header className="mb-6 lg:mb-8">
          {" "}
          {/* dashboard-header */}
          <h1 className="text-lg lg:text-xl poppins-semibold text-gray-800">
            Halo, {shopName}!
          </h1>
        </header>
        {/* summary-cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6 lg:mb-8">
          {/* card */}
          <div className="bg-white p-5 rounded-lg shadow-md">
            <h2 className="text-sm font-medium text-gray-500 mb-1">
              Total Profit
            </h2>
            {/* profit */}
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">
              {formatCurrency(totalProfit)}
            </p>
            <span className="text-xs text-gray-400">Minggu Ini</span>
          </div>
          {/* card */}
          <div className="bg-white p-5 rounded-lg shadow-md">
            <h2 className="text-sm font-medium text-gray-500 mb-1">
              Total Pemasukan
            </h2>
            {/* pemasukan */}
            <p className="text-2xl lg:text-3xl font-bold text-sky-500">
              {formatCurrency(totalPemasukan)}
            </p>
            <span className="text-xs text-gray-400">Minggu Ini</span>
          </div>
          {/* card */}
          <div className="bg-white p-5 rounded-lg shadow-md">
            <h2 className="text-sm font-medium text-gray-500 mb-1">
              Total Pengeluaran
            </h2>
            {/* pengeluaran */}
            <p className="text-2xl lg:text-3xl font-bold text-red-500">
              {formatCurrency(totalPengeluaran)}
            </p>
            <span className="text-xs text-gray-400">Minggu Ini</span>
          </div>
        </section>
        {/* charts-section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:mb-8">
          {/* chart-container card */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-base lg:text-lg poppins-semibold text-gray-600 mb-4">
              Pemasukan Mingguan
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pemasukanData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tickFormatter={smartTickFormatter}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  domain={[
                    0,
                    (dataMax) => Math.max(dataMax + dataMax * 0.1, 200000),
                  ]}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelStyle={{ color: "#374151", fontWeight: "bold" }}
                  itemStyle={{ color: "#00A6F4" }} // Warna Pemasukan Chart
                  wrapperStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.25rem",
                    padding: "0.5rem",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
                <Line
                  type="monotone"
                  dataKey="Pemasukan"
                  stroke="#00A6F4" // Warna Pemasukan Chart
                  fill="#B8E6FE" // Fill Pemasukan Chart
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#00A6F4" }} // Warna Pemasukan Chart
                  activeDot={{ r: 6, stroke: "#007嬤C", strokeWidth: 2 }} // Warna Pemasukan Chart lebih gelap
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* chart-container card */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-base lg:text-lg poppins-semibold text-gray-600 mb-4">
              Pengeluaran Mingguan
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pengeluaranData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tickFormatter={smartTickFormatter}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  domain={[
                    0,
                    (dataMax) => Math.max(dataMax + dataMax * 0.1, 200000),
                  ]}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelStyle={{ color: "#374151", fontWeight: "bold" }}
                  itemStyle={{ color: "#ef4444" }}
                  wrapperStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.25rem",
                    padding: "0.5rem",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                />
                <Line
                  type="monotone"
                  dataKey="Pengeluaran"
                  stroke="#ef4444" // red-500
                  fill="#fecaca" // red-200
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#ef4444" }}
                  activeDot={{ r: 6, stroke: "#dc2626", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        {/* details-section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* card list-card */}
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-base lg:text-lg poppins-semibold text-gray-600 mb-4">
              Hampir Habis
            </h3>
            {hampirHabis.length > 0 ? (
              <ul className="space-y-3">
                {hampirHabis.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center text-sm pb-3 border-b border-gray-200 last:border-b-0 last:pb-0"
                  >
                    <span className="text-gray-700">{item.nama}</span>
                    <span className="text-gray-500 font-medium">
                      sisa {item.stok}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Tidak ada produk yang stoknya hampir habis.
              </p>
            )}
          </div>
          {/* card list-card */}
          <div className="bg-white p-5 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-base lg:text-lg poppins-semibold text-gray-600 mb-4">
              Transaksi Hari Ini
            </h3>
            {transaksiHariIni.length > 0 ? (
              <ul className="space-y-3">
                {transaksiHariIni.map((trx) => (
                  <li
                    key={trx.id}
                    className="flex justify-between items-center text-sm pb-3 border-b border-gray-200 last:border-b-0 last:pb-0"
                  >
                    <span className="text-gray-700">Penjualan {trx.kode}</span>
                    <span className="text-gray-600 font-medium">
                      {formatCurrency(trx.totalHarga)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Belum ada transaksi hari ini.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
export default Dashboard;
