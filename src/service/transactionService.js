// src/service/transactionService.js
// Import TransactionType untuk konsistensi
import { TransactionType } from '../types/transactionTypes'; // SESUAIKAN PATH INI jika berbeda (misal: ../types.js)

// Import db dan serverTimestamp dari firebase.js
import { db, serverTimestamp } from "../firebase"; // SESUAIKAN PATH INI
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";

const transactionCollectionRef = collection(db, "transaksi"); // Nama koleksi transaksi di Firestore

// Mendapatkan semua transaksi dari Firestore
// Mengambil transaksi penjualan (dari CashierPage) dan transaksi manual (dari AddTransactionPage/productService)
const getTransactions = async () => {
  try {
    // Query untuk mengambil semua transaksi, diurutkan berdasarkan tanggal DESC
    // Menggunakan 'tanggal' karena CashierPage menyimpan serverTimestamp() dengan nama itu
    const q = query(transactionCollectionRef, orderBy("tanggal", "desc"));
    const snapshot = await getDocs(q);

    const transactions = snapshot.docs.map((doc) => {
       const data = doc.data();

       // Menentukan tipe transaksi.
       // Jika ada field 'type' (dari AddTransactionPage/productService), gunakan itu.
       // Jika tidak, asumsikan transaksi dari CashierPage (yang punya field 'items' dan 'totalHarga') adalah 'income', dan lainnya 'expense'.
       const determinedType = data.type || (data.items && data.items.length > 0 ? TransactionType.income : TransactionType.expense); // Default ke expense jika tidak ada tipe dan tidak ada item (misal: data lama)

       return {
          id: doc.id,
          type: determinedType,
          // Amount: ambil dari 'amount' (manual/productService) atau 'totalHarga' (CashierPage)
          amount: Number(data.amount || data.totalHarga || 0), // Pastikan Number
          date: data.tanggal?.toDate() || new Date(), // Konversi Firestore Timestamp ke Date object
          description: data.description || (data.items && data.items.length > 0 ? `Penjualan #${data.kode || doc.id}` : 'Transaksi Manual'), // Default deskripsi
          userId: data.userId || null,
          kode: data.kode || null, // Kode transaksi dari CashierPage

          // Items: Konversi array item (jika ada) dan pastikan nilai numerik adalah Number
          items: (data.items || []).map(item => ({
               productId: item.productId || null,
               nama: item.nama || 'Produk Tidak Dikenal',
               // --- KONVERSI TIPE DATA NUMERIK UNTUK ITEM TRANSAKSI SAAT MEMBACA ---
               harga_jual: Number(item.harga_jual || 0),
               harga_beli: Number(item.harga_beli || 0),
               jumlah: Number(item.jumlah || 0),
               // --- AKHIR KONVERSI ---
          })),

          // Field spesifik penjualan (dari CashierPage)
          profit: Number(data.profit || 0), // Pastikan Number
          uangDiterima: Number(data.uangDiterima || 0), // Pastikan Number
          kembalian: Number(data.kembalian || 0), // Pastikan Number
       };
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Gagal memuat data transaksi.");
  }
};

// Menambah transaksi baru (dari modal atau dari productService)
const addTransaction = async (newTransactionData) => {
   try {
      // Data bisa dari modal (type, amount, description)
      // atau dari productService (type, amount, description, items, userId)
      // atau dari CashierPage (kode, totalHarga, profit, items, userId, uangDiterima, kembalian, TANGGAL OTOMATIS)
      // Kita akan menambahkan serverTimestamp di sini secara default jika tanggal belum diset.
      // Namun, CashierPage sudah menambahkannya sendiri. Jadi, kita set tanggal jika tidak ada.

      const dataToSave = {
         ...newTransactionData, // Sertakan semua data yang diberikan (termasuk items, userId, profit, dll jika ada)
         tanggal: newTransactionData.tanggal || serverTimestamp(), // Gunakan tanggal yang ada (dari CashierPage) atau buat baru
         // --- KONVERSI TIPE DATA NUMERIK UNTUK FIELD UTAMA SAAT MENULIS ---
         amount: Number(newTransactionData.amount || 0),
         totalHarga: Number(newTransactionData.totalHarga || 0),
         profit: Number(newTransactionData.profit || 0),
         uangDiterima: Number(newTransactionData.uangDiterima || 0),
         kembalian: Number(newTransactionData.kembalian || 0),
         // --- AKHIR KONVERSI ---
         // items: array, biarkan apa adanya dari input (Asumsikan input sudah Number dari pengirim seperti CashierPage/productService)
      };

      // Hapus field yang mungkin undefined atau null dari input sebelum disimpan (opsional tapi bagus)
      Object.keys(dataToSave).forEach(key => {
          if (dataToSave[key] === undefined || dataToSave[key] === null) { // Hapus juga null jika tidak diinginkan
              delete dataToSave[key];
          }
      });

      // Khusus untuk array items, pastikan setiap item juga diolah jika perlu (opsional jika pengirim sudah memastikan)
      if (dataToSave.items && Array.isArray(dataToSave.items)) {
           dataToSave.items = dataToSave.items.map(item => ({
               ...item,
               harga_jual: Number(item.harga_jual || 0),
               harga_beli: Number(item.harga_beli || 0),
               jumlah: Number(item.jumlah || 0),
           }));
      }


      await addDoc(transactionCollectionRef, dataToSave);
      // Opsional: return docRef.id;
   } catch (error) {
      console.error("Error adding transaction:", error);
      throw new Error("Gagal menambahkan transaksi.");
   }
};


export const TransactionService = {
  getTransactions,
  addTransaction,
  // Anda bisa menambahkan fungsi lain seperti deleteTransaction jika diperlukan
};