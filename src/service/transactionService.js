// src/service/transactionService.js
import { Transaction, TransactionType } from '../types/transactionTypes'; // Sesuaikan path

// Simulasi data in-memory
let transactions = [
  // Tambahkan data sampel seperti di kode Dart
  new Transaction('income1-1', TransactionType.income, 22000, new Date(), 'Penjualan Harian', [ {name: "Indomie Goreng", quantity: 3, price: 4000}, {name: "Aqua 600", quantity: 2, price: 5000}]),
  new Transaction('expense1-2', TransactionType.expense, 57000, new Date(Date.now() - 86400000), 'Beli stok Indomie'), // yesterday
  new Transaction('income2-3', TransactionType.income, 300000, new Date(Date.now() - 86400000), 'Pembayaran Proyek A'), // yesterday
  new Transaction('income-prev1', TransactionType.income, 250000, new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15)),
  new Transaction('income-prev2', TransactionType.income, 450000, new Date(new Date().getFullYear(), new Date().getMonth() - 2, 10)),
   new Transaction('income-prev3', TransactionType.income, 380000, new Date(new Date().getFullYear(), new Date().getMonth() - 3, 20)),
   new Transaction('income-prev4', TransactionType.income, 520000, new Date(new Date().getFullYear(), new Date().getMonth() - 4, 5)),
    new Transaction('income-prev5', TransactionType.income, 480000, new Date(new Date().getFullYear(), new Date().getMonth() - 5, 12)),
    new Transaction('income-prev6', TransactionType.income, 410000, new Date(new Date().getFullYear(), new Date().getMonth() - 6, 25)),
    new Transaction('income-prev7', TransactionType.income, 550000, new Date(new Date().getFullYear(), new Date().getMonth() - 7, 8)),
    new Transaction('income-prev8', TransactionType.income, 600000, new Date(new Date().getFullYear(), new Date().getMonth() - 8, 18)),
    new Transaction('income-prev9', TransactionType.income, 530000, new Date(new Date().getFullYear(), new Date().getMonth() - 9, 3)),
    new Transaction('income-prev10', TransactionType.income, 650000, new Date(new Date().getFullYear(), new Date().getMonth() - 10, 22)),
    new Transaction('income-prev11', TransactionType.income, 700000, new Date(new Date().getFullYear(), new Date().getMonth() - 11, 11)),
];

// Fungsi untuk mensimulasikan fetching data (bisa diganti dengan HTTP request)
const getTransactions = async () => {
  // Simulasi latency
  await new Promise(resolve => setTimeout(resolve, 500));
  // Kembalikan salinan data agar state di komponen tidak langsung dimutasi
  return [...transactions];
};

// Fungsi untuk mensimulasikan penambahan transaksi
const addTransaction = async (newTransaction) => {
   await new Promise(resolve => setTimeout(resolve, 300));
   // Tambahkan ke awal array (seperti di Dart)
   transactions.unshift(newTransaction);
   console.log("Simpan transaksi:", newTransaction);
   // Di aplikasi nyata, ini akan melibatkan pembaruan backend
};


// Mensimulasikan stream (ini bisa lebih kompleks di dunia nyata)
// Kita akan mengandalkan komponen UI untuk re-fetch atau menerima data baru
// saat addTransaction dipanggil, daripada stream real-time
// Untuk contoh ini, getTransactions akan dipanggil kembali setelah add.

export const TransactionService = {
  getTransactions,
  addTransaction,
  // getTransactionsStream: () => { /* Implementasi stream di web bisa rumit */ }
};