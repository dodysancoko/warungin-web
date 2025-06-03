// src/service/transactionService.js
import { TransactionType } from '../types/transactionTypes';
import { db, serverTimestamp } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";

const transactionCollectionRef = collection(db, "transaksi");

const getTransactions = async () => {
  try {
    const q = query(transactionCollectionRef, orderBy("tanggal", "desc"));
    const snapshot = await getDocs(q);

    const transactions = snapshot.docs.map((doc) => {
       const data = doc.data();

       const determinedType = data.type || (data.items && data.items.length > 0 ? TransactionType.income : TransactionType.expense); // Default ke expense jika tidak ada tipe dan tidak ada item (misal: data lama)

       return {
          id: doc.id,
          type: determinedType,
          amount: Number(data.amount || data.totalHarga || 0),
          date: data.tanggal?.toDate() || new Date(),
          description: data.description || (data.items && data.items.length > 0 ? `Penjualan #${data.kode || doc.id}` : 'Transaksi Manual'), // Default deskripsi
          userId: data.userId || null,
          kode: data.kode || null,

          items: (data.items || []).map(item => ({
               productId: item.productId || null,
               nama: item.nama || 'Produk Tidak Dikenal',
               harga_jual: Number(item.harga_jual || 0),
               harga_beli: Number(item.harga_beli || 0),
               jumlah: Number(item.jumlah || 0),
          })),

          profit: Number(data.profit || 0),
          uangDiterima: Number(data.uangDiterima || 0),
          kembalian: Number(data.kembalian || 0),
       };
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Gagal memuat data transaksi.");
  }
};

const addTransaction = async (newTransactionData) => {
   try {
      const dataToSave = {
         ...newTransactionData,
         tanggal: newTransactionData.tanggal || serverTimestamp(),
         amount: Number(newTransactionData.amount || 0),
         totalHarga: Number(newTransactionData.totalHarga || 0),
         profit: Number(newTransactionData.profit || 0),
         uangDiterima: Number(newTransactionData.uangDiterima || 0),
         kembalian: Number(newTransactionData.kembalian || 0),
      };

      Object.keys(dataToSave).forEach(key => {
          if (dataToSave[key] === undefined || dataToSave[key] === null) {
              delete dataToSave[key];
          }
      });

      if (dataToSave.items && Array.isArray(dataToSave.items)) {
           dataToSave.items = dataToSave.items.map(item => ({
               ...item,
               harga_jual: Number(item.harga_jual || 0),
               harga_beli: Number(item.harga_beli || 0),
               jumlah: Number(item.jumlah || 0),
           }));
      }


      await addDoc(transactionCollectionRef, dataToSave);
   } catch (error) {
      console.error("Error adding transaction:", error);
      throw new Error("Gagal menambahkan transaksi.");
   }
};


export const TransactionService = {
  getTransactions,
  addTransaction,
};