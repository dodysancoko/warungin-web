import { useEffect, useState, useMemo } from "react";
import { auth, db, serverTimestamp } from "../firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  runTransaction, 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/sidebar"; 
import toast from "react-hot-toast";
import { Search, CheckCircle, ArrowLeft, Minus, Plus } from "lucide-react"; 

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
  const [paymentInputError, setPaymentInputError] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
      else {
        toast.error("Silakan login untuk mengakses halaman ini.");
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) fetchProducts();
  }, [currentUser]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const productsCollection = collection(db, "produk");
      const productSnapshot = await getDocs(productsCollection);
      let productList = productSnapshot.docs.map((doc) => {
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
      productList.sort((a, b) => a.nama?.localeCompare(b.nama || "") || 0);
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
      const productStock = Number(product.stok || 0);

      if (productStock <= 0 && !existingItem) {
        toast.error(`Stok ${product.nama} habis!`);
        return prevCart;
      }
      if (existingItem) {
        const existingQuantity = Number(existingItem.jumlah || 0);
        if (existingQuantity < productStock) {
          return prevCart.map((item) =>
            item.id === product.id ? { ...item, jumlah: existingQuantity + 1 } : item
          );
        } else {
          toast.error(`Stok ${product.nama} tidak mencukupi.`);
          return prevCart;
        }
      }
      return [...prevCart, { ...product, jumlah: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, change) => {
    setCart((prevCart) => {
      const cartItemIndex = prevCart.findIndex(item => item.id === productId);
      if (cartItemIndex === -1) return prevCart;

      const currentItem = prevCart[cartItemIndex];
      const originalProduct = products.find(p => p.id === productId);
      if (!originalProduct) return prevCart;

      const currentQuantity = Number(currentItem.jumlah || 0);
      const originalStock = Number(originalProduct.stok || 0);

      const newQuantity = currentQuantity + change;

      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }

      if (newQuantity > originalStock) {
        toast.error(`Stok ${originalProduct.nama} hanya ${originalStock}.`);
        return prevCart;
      }

      return prevCart.map(item =>
        item.id === productId ? { ...item, jumlah: newQuantity } : item
      );
    });
  };

  const calculateTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.harga_jual || 0) * Number(item.jumlah || 0)), 0);
  }, [cart]);

  const handleProceedToPayment = () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong. Tidak bisa melanjutkan ke pembayaran.");
      return;
    }
    setPaymentInputError(false);
    setUangDiterima("");
    setRightPanelView(RightPanelView.PAYMENT);
  };

  const handlePaymentSubmit = async () => {
    const numUangDiterima = Number(uangDiterima.replace(/\./g, "") || 0);
    const totalTagihan = calculateTotal; 

    if (numUangDiterima < totalTagihan) {
      toast.error("Uang yang diterima kurang dari total tagihan.");
      setPaymentInputError(true);
      return;
    }

    if (!currentUser) {
      toast.error("User tidak ditemukan. Silakan login ulang.");
      navigate("/login");
      return;
    }
    setPaymentInputError(false);
    setProcessingCheckout(true);

    try {
      const newTransactionDetails = await runTransaction(db, async (transaction) => {
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

          if (!productDocSnapshot.exists()) {
              throw new Error(`Produk "${item.nama || item.id}" tidak ditemukan.`);
          }

          const productData = productDocSnapshot.data();
          fetchedProductDataMap.set(item.id, productData); 

          const currentStockInFirestore = Number(productData.stok || 0);
          const quantityInCart = Number(item.jumlah || 0);

          if (currentStockInFirestore < quantityInCart) {
             throw new Error(`Stok produk "${item.nama || item.id}" tidak cukup. Tersedia: ${currentStockInFirestore}`);
          }

          const itemHargaJual = Number(item.harga_jual || 0);
          const productHargaBeli = Number(productData.harga_beli || 0);

          calculatedTotalHarga += itemHargaJual * quantityInCart;
          const profitPerItem = (itemHargaJual - productHargaBeli) * quantityInCart;
          calculatedTotalProfit += profitPerItem;

          transactionItems.push({
            productId: item.id,
            nama: item.nama,
            harga_jual: itemHargaJual, 
            harga_beli: productHargaBeli, 
            jumlah: quantityInCart, 
          });
        }

        let nextKode = (metadataDocSnapshot.exists() && metadataDocSnapshot.data().lastKode) ? Number(metadataDocSnapshot.data().lastKode) + 1 : 1;
        const formattedKode = `${nextKode.toString().padStart(5, "0")}`; 

        cart.forEach(item => {
          const productRef = doc(db, "produk", item.id);
          const originalProductData = fetchedProductDataMap.get(item.id);
          const currentStockInFirestore = Number(originalProductData.stok || 0);
          const quantityInCart = Number(item.jumlah || 0);
          const newStok = currentStockInFirestore - quantityInCart; 
          transaction.update(productRef, { stok: newStok }); 
          produkToUpdateWriteData.push({ id: item.id, newStok }); 
        });

        const newTransactionDocRef = doc(collection(db, "transaksi"));
        const finalTransactionData = {
          kode: formattedKode,
          tanggal: serverTimestamp(), 
          totalHarga: calculatedTotalHarga, 
          profit: calculatedTotalProfit, 
          items: transactionItems, 
          userId: currentUser.uid, 
          uangDiterima: numUangDiterima, 
          kembalian: numUangDiterima - calculatedTotalHarga, 
        };
        transaction.set(newTransactionDocRef, finalTransactionData); 

        transaction.set(metadataRef, { lastKode: nextKode }, { merge: true });

        return {
            ...finalTransactionData,
            id: newTransactionDocRef.id,
            updatedProducts: produkToUpdateWriteData,
            tanggalClient: new Date() 
        };
      });

      toast.success(`Transaksi ${newTransactionDetails.kode} berhasil!`);
      setLastTransactionDetails(newTransactionDetails); 
      setCart([]); 
      setUangDiterima(""); 

      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const updatedDetail = newTransactionDetails.updatedProducts.find(
            (up) => up.id === p.id
          );
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


  const formatCurrency = (value) => `Rp${Number(value || 0).toLocaleString("id-ID")}`;


  const handleUangDiterimaChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); 
    setUangDiterima(value === "" ? "" : Number(value).toLocaleString("id-ID").replace(/,/g, "."));
    if (paymentInputError) setPaymentInputError(false); 
  };


  const filteredProducts = useMemo(() => {
       const lowercasedQuery = searchTerm.toLowerCase();
       return products.filter((product) =>
         product.nama.toLowerCase().includes(lowercasedQuery)
       );
  }, [searchTerm, products]); 


  const quickPayOptions = useMemo(() => {
    const baseTotal = calculateTotal;
    const options = [
        baseTotal,
        Math.ceil((baseTotal + 1) / 1000) * 1000,
        Math.ceil((baseTotal + 1) / 5000) * 5000,
        Math.ceil((baseTotal + 1) / 10000) * 10000,
        10000, 20000, 50000, 100000, 200000, 500000
    ].filter(opt => opt >= baseTotal); 
    return [...new Set(options)].sort((a,b) => a-b).slice(0,6); 
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
      <h2 className="text-xl font-bold mb-4 text-gray-800">Keranjang</h2>
      {cart.length === 0 ? (
        <p className="text-gray-500 flex-grow flex items-center justify-center">Keranjang kosong.</p>
      ) : (
        <div className="flex-grow overflow-y-auto mb-4 pr-2 -mr-2"> 
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center mb-3 pb-3 border-b">
              <div>
                <h4 className="font-medium text-gray-800">{item.nama}</h4>
                <p className="text-xs text-gray-500">
                    {formatCurrency(item.harga_jual || 0)} x {item.jumlah || 0}
                </p>
              </div>
              <div className="flex items-center">
                <button onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded-full disabled:opacity-50"
                        disabled={processingCheckout}
                >
                    <Minus size={18}/>
                </button>
                <span className="w-10 text-center p-1 mx-1 text-gray-700 font-medium">{item.jumlah || 0}</span>
                <button onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="p-1 text-green-500 hover:bg-green-100 rounded-full disabled:opacity-50"
                        disabled={processingCheckout}
                >
                    <Plus size={18}/>
                </button>
                <span className="font-semibold w-20 text-right text-gray-800 ml-2">
                    {formatCurrency(Number(item.harga_jual || 0) * Number(item.jumlah || 0))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto border-t pt-4">
        <div className="flex justify-between font-bold text-lg mb-4 text-gray-800">
          <span>Total:</span>
          <span>{formatCurrency(calculateTotal)}</span> 
        </div>
        <button onClick={handleProceedToPayment} disabled={cart.length === 0 || processingCheckout}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-md font-semibold transition-colors disabled:bg-gray-400 disabled:text-gray-600">
          Lanjut ke Pembayaran
        </button>
      </div>
    </>
  );

  const renderPaymentView = () => (
    <>
      <div className="flex items-center mb-6">
        <button onClick={() => { setPaymentInputError(false); setRightPanelView(RightPanelView.CART);}}
                className="mr-3 p-2 rounded-full hover:bg-gray-200 text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Pembayaran</h2>
      </div>
      <div className="bg-sky-50 p-4 rounded-lg mb-6 text-center">
        <p className="text-sm text-sky-700">Total Tagihan</p>
        <p className="text-3xl font-bold text-sky-600 mt-1">{formatCurrency(calculateTotal)}</p>
      </div>
      <div>
        <label htmlFor="uangDiterima" className="block text-sm font-medium text-gray-700 mb-1">
          Uang yang diterima (Tunai)
        </label>
        <input id="uangDiterima" type="text" value={uangDiterima} 
          onChange={handleUangDiterimaChange} onFocus={(e) => e.target.select()} placeholder="0"
          className={`w-full p-3 border rounded-lg text-xl text-right text-gray-700 focus:ring-sky-500 focus:border-sky-500 ${
            paymentInputError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300' 
          }`}
          inputMode="numeric"
          disabled={processingCheckout}
        />
        {paymentInputError && <p className="mt-1 text-xs text-red-600">Uang yang diterima kurang dari total tagihan.</p>}
        <p className="mt-2 text-sm text-gray-600">
          Kembalian: <span className="font-semibold text-gray-800">{formatCurrency(Math.max(0, Number(uangDiterima.replace(/\./g, "") || 0) - calculateTotal))}</span> {/* Hitung kembalian menggunakan nilai numerik */}
        </p>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Pilih Cepat:</p>
          <div className="grid grid-cols-2 gap-3">
            {quickPayOptions.map(amount => (
              <button key={amount} onClick={() => {
                setUangDiterima(Number(amount).toLocaleString('id-ID').replace(/,/g, '.'));
                if (paymentInputError) setPaymentInputError(false);
              }}
                className="p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
                disabled={processingCheckout}>
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto border-t pt-6">
        <button onClick={handlePaymentSubmit} disabled={processingCheckout || !uangDiterima || Number(uangDiterima.replace(/\./g, "") || 0) < calculateTotal} 
          className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-md font-semibold transition-colors disabled:bg-gray-400 disabled:text-gray-600">
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
        {lastTransactionDetails?.tanggalClient ? new Date(lastTransactionDetails.tanggalClient).toLocaleString("id-ID", { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Baru saja"}
      </p>
      <div className="w-full bg-gray-50 p-4 rounded-lg shadow mb-6 text-left space-y-1">
        <div className="flex justify-between"><span className="text-gray-600">Total Tagihan:</span><span className="font-medium text-gray-800">{formatCurrency(lastTransactionDetails?.totalHarga || 0)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">Uang Diterima:</span><span className="font-medium text-gray-800">{formatCurrency(lastTransactionDetails?.uangDiterima || 0)}</span></div>
        <div className="flex justify-between"><span className="text-red-600 font-semibold">Kembalian:</span><span className="font-semibold text-red-500">{formatCurrency(lastTransactionDetails?.kembalian || 0)}</span></div>
      </div>
      <button onClick={() => { setRightPanelView(RightPanelView.CART); setLastTransactionDetails(null); fetchProducts(); }} 
        className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-md font-semibold transition-colors">
        Transaksi Baru
      </button>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar className="w-64 flex-shrink-0" />
        <main className="flex-1 p-6 md:p-8 flex gap-6 overflow-hidden">

          <div className="flex flex-col w-full md:w-[60%] lg:w-[65%] bg-white rounded-xl shadow-lg p-6 overflow-hidden">
            <h1 className="text-2xl font-bold mb-1 text-gray-800">Pilih Produk</h1>
            <p className="text-sm text-gray-500 mb-4">Klik produk untuk menambahkannya ke keranjang.</p>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input type="text" placeholder="Cari produk..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md text-gray-700 focus:ring-sky-500 focus:border-sky-500"/>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
              {loadingProducts ? (
                <p className="text-center py-10 text-gray-600">Memuat produk...</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-center py-10 text-gray-500">Tidak ada produk ditemukan.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id}
                      className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${Number(product.stok || 0) <= 0 ? "bg-gray-100 opacity-60 cursor-not-allowed" : "bg-white hover:border-sky-500"}`}
                      onClick={() => Number(product.stok || 0) > 0 && !processingCheckout && handleAddToCart(product)}> 
                      <h3 className="font-semibold text-md text-gray-800">{product.nama}</h3>
                      <p className="text-sm text-gray-600">{formatCurrency(product.harga_jual || 0)}</p>
                      <p className={`text-xs mt-1 font-medium ${Number(product.stok || 0) > Number(product.minimum_stok || 0) ? 'text-green-600' : Number(product.stok || 0) > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                        Stok: {product.stok || 0} {product.minimum_stok !== undefined && `(Min: ${product.minimum_stok || 0})`} 
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col w-full md:w-[40%] lg:w-[35%] bg-white rounded-xl shadow-lg p-6 overflow-hidden"> 
            {rightPanelView === RightPanelView.CART && renderCartView()}
            {rightPanelView === RightPanelView.PAYMENT && renderPaymentView()}
            {rightPanelView === RightPanelView.SUCCESS && renderSuccessView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CashierPage;