import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase"; // Pastikan path ini benar

// --- PERUBAHAN DI SINI ---
const produkCollectionRef = collection(db, "produk"); // Menggunakan nama koleksi "produk"

export const productService = {
  getAllProducts: async () => {
    const data = await getDocs(produkCollectionRef); // Menggunakan ref yang sudah diperbarui
    return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  },

  getProductById: async (id) => {
    // --- PERUBAHAN DI SINI ---
    const productDoc = doc(db, "produk", id); // Menggunakan path "produk"
    const docSnap = await getDoc(productDoc);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id };
    } else {
      // Bisa juga return null atau throw error sesuai kebutuhan
      console.error("Produk tidak ditemukan dengan ID:", id);
      throw new Error("Produk tidak ditemukan");
    }
  },

  addProduct: async (newProduct) => {
    return await addDoc(produkCollectionRef, { // Menggunakan ref yang sudah diperbarui
      ...newProduct,
      createdAt: serverTimestamp(), // Opsional: tambahkan timestamp
    });
  },

  updateProduct: async (id, updatedProductData) => {
    // --- PERUBAHAN DI SINI ---
    const productDoc = doc(db, "produk", id); // Menggunakan path "produk"
    return await updateDoc(productDoc, {
        ...updatedProductData,
        updatedAt: serverTimestamp(), // Opsional: tambahkan timestamp
    });
  },

  deleteProduct: async (id) => {
    // --- PERUBAHAN DI SINI ---
    const productDoc = doc(db, "produk", id); // Menggunakan path "produk"
    return await deleteDoc(productDoc);
  },
};