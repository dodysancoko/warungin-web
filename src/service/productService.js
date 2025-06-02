import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { firebaseApp } from "../firebase"; // pastikan sudah inisialisasi firebaseApp

const db = getFirestore(firebaseApp);
const produkCollection = collection(db, "produk");

export const getAllProducts = async () => {
  try {
    const snapshot = await getDocs(produkCollection);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (e) {
    throw new Error("Error fetching products: " + e.message);
  }
};

export const addProduct = async (data) => {
  try {
    await addDoc(produkCollection, data);
  } catch (e) {
    throw new Error("Error adding product: " + e.message);
  }
};

export const updateProduct = async (id, data) => {
  try {
    const docRef = doc(db, "produk", id);
    await updateDoc(docRef, data);
  } catch (e) {
    throw new Error("Error updating product: " + e.message);
  }
};

export const deleteProduct = async (id) => {
  try {
    const docRef = doc(db, "produk", id);
    await deleteDoc(docRef);
  } catch (e) {
    throw new Error("Error deleting product: " + e.message);
  }
};
