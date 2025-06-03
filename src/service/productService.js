// src/service/productService.js
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  query,
  orderBy,
  runTransaction,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { TransactionType } from "../types/transactionTypes";
import { TransactionService } from "./transactionService";

const produkCollectionRef = collection(db, "produk");

const getCurrentUserId = () => {
    return auth.currentUser?.uid || null;
};


export const productService = {
  getAllProducts: async () => {
    try {
        const q = query(produkCollectionRef, orderBy("nama", "asc"));
        const snapshot = await getDocs(q);

        const products = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                harga_beli: Number(data.harga_beli || 0),
                harga_jual: Number(data.harga_jual || 0),
                stok: Number(data.stok || 0),
                minimum_stok: Number(data.minimum_stok || 0),
            };
        });
        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw new Error("Gagal memuat data produk.");
    }
  },

  getProductById: async (id) => {
    try {
        const productDoc = doc(db, "produk", id);
        const docSnap = await getDoc(productDoc);
        if (docSnap.exists()) {
             const data = docSnap.data();
             return {
                id: docSnap.id,
                ...data,
                harga_beli: Number(data.harga_beli || 0),
                harga_jual: Number(data.harga_jual || 0),
                stok: Number(data.stok || 0),
                minimum_stok: Number(data.minimum_stok || 0),
             };
        } else {
            console.warn("Produk tidak ditemukan dengan ID:", id);
            throw new Error("Produk tidak ditemukan");
        }
    } catch (error) {
        console.error(`Error getting product ${id}:`, error);
        throw new Error("Gagal mengambil detail produk.");
    }
  },

  addProduct: async (newProductData) => {
    const userId = getCurrentUserId();
    try {
        const dataToSave = {
            ...newProductData,
            harga_beli: Number(newProductData.harga_beli || 0),
            harga_jual: Number(newProductData.harga_jual || 0),
            stok: Number(newProductData.stok || 0),
            minimum_stok: Number(newProductData.minimum_stok || 0),
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(produkCollectionRef, dataToSave);

        const initialStock = Number(newProductData.stok || 0);
        const costPerItem = Number(newProductData.harga_beli || 0);
        const expenseAmount = initialStock * costPerItem;

        if (expenseAmount > 0) {
             const transactionData = {
                 type: TransactionType.expense,
                 amount: expenseAmount,
                 description: `Pembelian stok awal produk: ${newProductData.nama} (${initialStock} unit @Rp${costPerItem.toLocaleString('id-ID')})`,
                 items: [{ name: newProductData.nama, quantity: initialStock, price: costPerItem }],
                 userId: userId,
             };
             TransactionService.addTransaction(transactionData).catch(txError => {
                 console.error("Error creating expense transaction for add product:", txError);
             });
        }

        return docRef.id;
    } catch (error) {
        console.error("Error adding product:", error);
        throw new Error("Gagal menambahkan produk.");
    }
  },

  updateProduct: async (id, updatedProductData) => {
     const userId = getCurrentUserId();
     try {
        const oldProduct = await productService.getProductById(id);
        if (!oldProduct) {
            throw new Error("Produk lama tidak ditemukan untuk diupdate.");
        }

        const dataToUpdate = {
             ...updatedProductData,
             harga_beli: Number(updatedProductData.harga_beli || 0),
             harga_jual: Number(updatedProductData.harga_jual || 0),
             stok: Number(updatedProductData.stok || 0),
             minimum_stok: Number(updatedProductData.minimum_stok || 0),
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, "produk", id), dataToUpdate);

        const oldStock = Number(oldProduct.stok || 0);
        const newStock = Number(dataToUpdate.stok || 0);
        const stockIncrease = newStock - oldStock;
        const costPerItem = Number(dataToUpdate.harga_beli || 0);

        if (stockIncrease > 0 && costPerItem >= 0) {
             const expenseAmount = stockIncrease * costPerItem;
             const transactionData = {
                 type: TransactionType.expense,
                 amount: expenseAmount,
                 description: `Penambahan stok produk: ${dataToUpdate.nama} (+${stockIncrease} unit @Rp${costPerItem.toLocaleString('id-ID')})`,
                 items: [{ name: dataToUpdate.nama, quantity: stockIncrease, price: costPerItem }],
                 userId: userId,
             };
              TransactionService.addTransaction(transactionData).catch(txError => {
                 console.error("Error creating expense transaction for stock update:", txError);
             });
        }


     } catch (error) {
        console.error(`Error updating product ${id}:`, error);
        if (error.message === "Produk tidak ditemukan untuk diupdate.") {
             throw new Error("Gagal memperbarui produk: Produk tidak ditemukan.");
        }
        throw new Error("Gagal memperbarui produk.");
     }
  },

  deleteProduct: async (id) => {
     const userId = getCurrentUserId();
    try {
        const productToDelete = await productService.getProductById(id);
         if (!productToDelete) {
            console.warn("Produk tidak ditemukan saat mencoba menghapus:", id);
            return;
        }

        const remainingStock = Number(productToDelete.stok || 0);
        const costPerItem = Number(productToDelete.harga_beli || 0);
        const lossAmount = remainingStock * costPerItem;

        await deleteDoc(doc(db, "produk", id));

        // if (remainingStock > 0 && costPerItem >= 0) {
        //      const transactionData = {
        //          type: TransactionType.expense, // Bisa juga jenis lain jika ada (misal 'loss')
        //          amount: lossAmount,
        //          description: `Penghapusan stok produk: ${productToDelete.nama} (${remainingStock} unit @Rp${costPerItem.toLocaleString('id-ID')})`,
        //           // Opsional: tambahkan detail item
        //          items: [{ name: productToDelete.nama, quantity: remainingStock, price: costPerItem }],
        //          userId: userId,
        //      };
        //      TransactionService.addTransaction(transactionData).catch(txError => {
        //          console.error("Error creating expense transaction for delete product:", txError);
        //      });
        // }

    } catch (error) {
        console.error(`Error deleting product ${id}:`, error);
        if (error.message && error.message.includes("Produk tidak ditemukan")) {
             throw new Error("Gagal menghapus produk: Produk tidak ditemukan.");
        }
        throw new Error("Gagal menghapus produk.");
    }
  },
};