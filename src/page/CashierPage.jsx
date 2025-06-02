// src/page/CashierPage.jsx
import { useEffect, useState, useMemo } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/sidebar";
import toast from "react-hot-toast";
import { Search, CheckCircle, ArrowLeft } from "lucide-react"; // X bisa dihapus jika tidak dipakai di cart

// Enum untuk tampilan/mode panel kanan
const RightPanelView = {
  CART: "CART",
  PAYMENT: "PAYMENT",
  SUCCESS: "SUCCESS",
};

const CashierPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const navigate = useNavigate();

  const [rightPanelView, setRightPanelView] = useState(RightPanelView.CART);
  const [uangDiterima, setUangDiterima] = useState("");
  const [lastTransactionDetails, setLastTransactionDetails] = useState(null);

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
    fetchProducts();
  }, [currentUser]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const productsCollection = collection(db, "produk");
      const productSnapshot = await getDocs(productsCollection);
      const productList = productSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productList);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat produk.");
    }
    setLoadingProducts(false);
  };

  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (product.stok <= 0 && !existingItem) {
        toast.error(`Stok ${product.nama} habis!`);
        return prevCart;
      }
      if (existingItem) {
        if (existingItem.jumlah < product.stok) {
          return prevCart.map((item) =>
            item.id === product.id
              ? { ...item, jumlah: item.jumlah + 1 }
              : item
          );
        } else {
          toast.error(`Stok ${product.nama} tidak mencukupi.`);
          return prevCart;
        }
      } else {
        return [...prevCart, { ...product, jumlah: 1 }];
      }
    });
    // Tidak perlu toast success setiap add, bisa jadi terlalu banyak notifikasi
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    const productInCart = cart.find(item => item.id === productId);
    const originalProduct = products.find(p => p.id === productId);

    if (newQuantity <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
      return;
    }
    
    if (originalProduct && newQuantity > originalProduct.stok) {
        toast.error(`Stok ${originalProduct.nama} hanya ${originalProduct.stok}.`);
        setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, jumlah: originalProduct.stok } : item
        )
      );
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, jumlah: newQuantity } : item
      )
    );
  };

  const calculateTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.harga_jual * item.jumlah, 0);
  }, [cart]);

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong. Tidak bisa melanjutkan ke pembayaran.");
      return;
    }
    setRightPanelView(RightPanelView.PAYMENT);
  };

  const handlePaymentSubmit = async () => {
    if (Number(uangDiterima.replace(/\./g, '')) < calculateTotal) {
        toast.error("Uang yang diterima kurang dari total tagihan.");
        return;
    }
    if (!currentUser) {
      toast.error("User tidak ditemukan. Silakan login ulang.");
      navigate("/login");
      return;
    }

    setProcessingCheckout(true);
    try {
      const newTransactionData = await runTransaction(db, async (transaction) => {
        const productRefPromises = cart.map(item => transaction.get(doc(db, "produk", item.id)));
        const productDocsSnapshots = await Promise.all(productRefPromises);
        const metadataRef = doc(db, "metadata", "penjualan");
        const metadataDocSnapshot = await transaction.get(metadataRef);

        const produkToUpdateWriteData = [];
        let calculatedTotalHarga = 0;
        let calculatedTotalProfit = 0;
        const transactionItems = [];
        const fetchedProductDataMap = new Map();

        for (let i = 0; i < cart.length; i++) {
          const item = cart[i];
          const productDocSnapshot = productDocsSnapshots[i];
          if (!productDocSnapshot.exists()) throw new Error(`Produk ${item.nama} tidak ditemukan.`);
          const productData = productDocSnapshot.data();
          fetchedProductDataMap.set(item.id, productData);
          if (productData.stok < item.jumlah) throw new Error(`Stok ${item.nama} tidak cukup.`);
          
          calculatedTotalHarga += item.harga_jual * item.jumlah;
          const profitPerItem = (item.harga_jual - (productData.harga_beli || 0)) * item.jumlah;
          calculatedTotalProfit += profitPerItem;
          transactionItems.push({
            productId: item.id, nama: item.nama, harga_jual: item.harga_jual,
            harga_beli: productData.harga_beli || 0, jumlah: item.jumlah,
          });
        }

        let nextKode = (metadataDocSnapshot.exists() && metadataDocSnapshot.data().lastKode) ? metadataDocSnapshot.data().lastKode + 1 : 1;
        const formattedKode = `${nextKode.toString().padStart(5, "0")}`;

        cart.forEach(item => {
          const productRef = doc(db, "produk", item.id);
          const originalProductData = fetchedProductDataMap.get(item.id);
          const newStok = originalProductData.stok - item.jumlah;
          transaction.update(productRef, { stok: newStok });
          produkToUpdateWriteData.push({ id: item.id, newStok });
        });

        const newTransactionDocRef = doc(collection(db, "transaksi"));
        const finalTransactionData = {
          kode: formattedKode, tanggal: serverTimestamp(), totalHarga: calculatedTotalHarga,
          profit: calculatedTotalProfit, items: transactionItems, userId: currentUser.uid,
          uangDiterima: Number(uangDiterima.replace(/\./g, '')),
          kembalian: Number(uangDiterima.replace(/\./g, '')) - calculatedTotalHarga,
        };
        transaction.set(newTransactionDocRef, finalTransactionData);
        transaction.set(metadataRef, { lastKode: nextKode }, { merge: true });
        
        return { ...finalTransactionData, id: newTransactionDocRef.id, updatedProducts: produkToUpdateWriteData, tanggalClient: new Date() };
      });

      toast.success(`Transaksi ${newTransactionData.kode} berhasil!`);
      setLastTransactionDetails(newTransactionData);
      setCart([]);
      setUangDiterima("");
      setProducts(prevProducts =>
        prevProducts.map(p => {
          const updatedDetail = newTransactionData.updatedProducts.find(up => up.id === p.id);
          return updatedDetail ? { ...p, stok: updatedDetail.newStok } : p;
        })
      );
      setRightPanelView(RightPanelView.SUCCESS);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Gagal checkout: ${error.message}`);
    } finally {
      setProcessingCheckout(false);
    }
  };
  
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "Rp0";
    return `Rp${Number(value).toLocaleString("id-ID")}`;
  };

  const handleUangDiterimaChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setUangDiterima(value === '' ? '' : Number(value).toLocaleString('id-ID').replace(/,/g, '.'));
  };

  const filteredProducts = products.filter((product) =>
    product.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const quickPayOptions = useMemo(() => {
    const baseTotal = calculateTotal;
    const options = [baseTotal, baseTotal + 1000, baseTotal + 2000, baseTotal + 5000, 10000, 20000, 50000, 100000];
    return [...new Set(options.filter(opt => opt >= baseTotal))].sort((a,b) => a-b).slice(0,4);
  }, [calculateTotal]);


  if (!currentUser) {
    return (
      <div className="min-h-screen w-screen flex justify-center items-center bg-gray-100">
        <p>Memuat...</p>
      </div>
    );
  }

  const renderCartView = () => (
    <>
      <h2 className="text-xl font-bold mb-4">Keranjang</h2>
      {cart.length === 0 ? (
        <p className="text-gray-500 flex-grow text-center content-center">Keranjang kosong.</p>
      ) : (
        <div className="flex-grow overflow-y-auto mb-4 pr-2">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center mb-3 pb-3 border-b"
            >
              <div>
                <h4 className="font-medium">{item.nama}</h4>
                <p className="text-xs text-gray-500">
                  {formatCurrency(item.harga_jual)} x {item.jumlah}
                </p>
              </div>
              <div className="flex items-center">
                <input 
                  type="number"
                  value={item.jumlah}
                  onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                  className="w-16 text-center border rounded-md p-1 mx-2"
                  min="0" // Seharusnya 1, atau handle 0 untuk hapus
                />
                <span className="font-semibold w-24 text-right">
                  {formatCurrency(item.harga_jual * item.jumlah)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto border-t pt-4">
        <div className="flex justify-between font-bold text-lg mb-4">
          <span>Total:</span>
          <span>{formatCurrency(calculateTotal)}</span>
        </div>
        <button
          onClick={handleProceedToPayment}
          disabled={cart.length === 0}
          className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-md font-semibold transition-colors disabled:bg-gray-400"
        >
          Lanjut ke Pembayaran
        </button>
      </div>
    </>
  );

  const renderPaymentView = () => (
    <>
      <div className="flex items-center mb-6">
          <button onClick={() => setRightPanelView(RightPanelView.CART)} className="mr-3 p-2 rounded-full hover:bg-gray-200">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold">Pembayaran</h2>
      </div>
      
      <div className="bg-sky-50 p-4 rounded-lg mb-6 text-center">
        <p className="text-sm text-sky-700">Total Tagihan</p>
        <p className="text-3xl font-bold text-sky-600 mt-1">{formatCurrency(calculateTotal)}</p>
      </div>

      <div>
        <label htmlFor="uangDiterima" className="block text-sm font-medium text-gray-700 mb-1">
            Uang yang diterima (Tunai)
        </label>
        <input
            id="uangDiterima"
            type="text"
            value={uangDiterima}
            onChange={handleUangDiterimaChange}
            onFocus={(e) => e.target.select()}
            placeholder="0"
            className="w-full p-3 border border-gray-300 rounded-lg text-xl text-right focus:ring-sky-500 focus:border-sky-500"
            inputMode="numeric"
        />
        <p className="mt-2 text-sm text-gray-600">
            Kembalian: <span className="font-semibold">{formatCurrency(Math.max(0, Number(uangDiterima.replace(/\./g, '')) - calculateTotal))}</span>
        </p>

        <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Pilih Cepat:</p>
            <div className="grid grid-cols-2 gap-3">
                {quickPayOptions.map(amount => (
                    <button
                        key={amount}
                        onClick={() => setUangDiterima(amount.toLocaleString('id-ID').replace(/,/g, '.'))}
                        className="p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                        {formatCurrency(amount)}
                    </button>
                ))}
            </div>
        </div>
      </div>
      <div className="mt-auto border-t pt-6">
        <button
          onClick={handlePaymentSubmit}
          disabled={processingCheckout || Number(uangDiterima.replace(/\./g, '')) < calculateTotal}
          className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-md font-semibold transition-colors disabled:bg-gray-400"
        >
          {processingCheckout ? "Memproses..." : "Terima Pembayaran"}
        </button>
      </div>
    </>
  );

  const renderSuccessView = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <CheckCircle size={60} className="text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaksi Berhasil!</h2>
        <p className="text-gray-600 mb-1">Kode Transaksi: {lastTransactionDetails?.kode}</p>
        <p className="text-sm text-gray-500 mb-6">
            {lastTransactionDetails?.tanggalClient ? 
                new Date(lastTransactionDetails.tanggalClient).toLocaleString("id-ID", {
                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : "Baru saja"}
        </p>

        <div className="w-full bg-gray-50 p-4 rounded-lg shadow mb-6 text-left space-y-1">
            <div className="flex justify-between">
                <span className="text-gray-600">Total Tagihan:</span>
                <span className="font-medium text-gray-800">{formatCurrency(lastTransactionDetails?.totalHarga)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Uang Diterima:</span>
                <span className="font-medium text-gray-800">{formatCurrency(lastTransactionDetails?.uangDiterima)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-red-600 font-semibold">Kembalian:</span>
                <span className="font-semibold text-red-500">{formatCurrency(lastTransactionDetails?.kembalian)}</span>
            </div>
        </div>
        
        <button 
            onClick={() => {
                setRightPanelView(RightPanelView.CART); // Kembali ke tampilan keranjang (kosong)
                setLastTransactionDetails(null);
                // fetchProducts(); // Produk sudah diupdate setelah transaksi
            }}
            className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-md font-semibold transition-colors"
        >
            Transaksi Baru
        </button>
    </div>
  );


  return (
    <div className="min-h-screen w-screen flex bg-gray-100 text-gray-800">
      <Sidebar className="w-64" />
      <main className="flex-1 p-6 md:p-10 flex flex-col md:flex-row gap-6">
        {/* Products Section (Kiri) */}
        <div className="md:w-3/5 bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-1">Pilih Produk</h1>
          <p className="text-sm text-gray-500 mb-4">Klik produk untuk menambahkannya ke keranjang.</p>
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
            </div>
            <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          {loadingProducts ? (
            <p>Memuat produk...</p>
          ) : filteredProducts.length === 0 ? (
             <p>Tidak ada produk ditemukan atau belum ada produk.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-2"> {/* Sesuaikan max-h */}
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                    product.stok <= 0 ? "bg-gray-100 opacity-60 cursor-not-allowed" : "bg-white hover:border-sky-500"
                  }`}
                  onClick={() => product.stok > 0 && handleAddToCart(product)}
                >
                  <h3 className="font-semibold text-md">{product.nama}</h3>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(product.harga_jual)}
                  </p>
                  <p className={`text-xs mt-1 font-medium ${product.stok > 5 ? 'text-green-600' : product.stok > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    Stok: {product.stok}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel (Keranjang/Pembayaran/Sukses) */}
        <div className="md:w-2/5 bg-white rounded-xl shadow-lg p-6 flex flex-col">
          {rightPanelView === RightPanelView.CART && renderCartView()}
          {rightPanelView === RightPanelView.PAYMENT && renderPaymentView()}
          {rightPanelView === RightPanelView.SUCCESS && renderSuccessView()}
        </div>
      </main>
    </div>
  );
};

export default CashierPage;