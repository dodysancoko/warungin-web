import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { productService } from "../service/productService";
import toast from "react-hot-toast";
import { FiSearch, FiArchive, FiMoreVertical, FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import Sidebar from "../components/ui/sidebar";

const ProductPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [produkList, setProdukList] = useState([]);
  const [filteredProdukList, setFilteredProdukList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeOptionsMenu, setActiveOptionsMenu] = useState(null);
  const [showDeleteConfirmForProduct, setShowDeleteConfirmForProduct] = useState(null);
  const optionsMenuRef = useRef(null);

  // ... (useEffect dan fungsi lainnya tetap sama) ...
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const products = await productService.getAllProducts();
      setProdukList(products);
      setFilteredProdukList(products);
    } catch (error) {
      toast.error("Gagal memuat produk: " + error.message);
      setProdukList([]);
      setFilteredProdukList([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchProducts();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, fetchProducts, navigate, location.pathname]);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = produkList.filter((produk) =>
      produk.nama.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredProdukList(filtered);
  }, [searchQuery, produkList]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setActiveOptionsMenu(null);
      }
    };
    if (activeOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeOptionsMenu]);

  const handleDeleteProduct = async (productId) => {
    if (!productId) return;
    setIsLoading(true);
    try {
      await productService.deleteProduct(productId);
      toast.success("Produk berhasil dihapus!");
      fetchProducts();
    } catch (error) {
      toast.error("Gagal menghapus produk: " + error.message);
    }
    setShowDeleteConfirmForProduct(null);
    setActiveOptionsMenu(null);
    setIsLoading(false);
  };

  const toggleOptionsMenu = (productId, event) => {
    event.stopPropagation();
    setActiveOptionsMenu(activeOptionsMenu === productId ? null : productId);
  };

  const handleEdit = (productId) => {
    navigate(`/product/edit/${productId}`);
    setActiveOptionsMenu(null);
  };

  const openDeleteConfirmModal = (product) => {
    setShowDeleteConfirmForProduct(product);
    setActiveOptionsMenu(null);
  };

  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirmForProduct(null);
  };


  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <div className="bg-sky-400 p-5 rounded-b-xl shadow-md relative h-[139px] flex-shrink-0">
          <div className="mt-5">
            <h1 className="text-white text-xl font-poppins font-semibold">
              Produk
            </h1>
          </div>
        </div>

        <div className="px-5 -mt-10 z-10 flex-shrink-0">
            <div className="bg-white w-full max-w-md mx-auto h-12 flex items-center px-4 rounded-xl border border-gray-300 shadow">
              <FiSearch className="text-gray-400 mr-3" size={16} />
              <input
                type="text"
                placeholder="Cari Produk"
                className="flex-grow text-sm font-poppins text-gray-700 focus:outline-none placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
        </div>

        <div className="flex-grow bg-white mt-5 p-5 shadow-lg rounded-t-xl overflow-y-auto"> 
          {isLoading && !filteredProdukList.length ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Memuat produk...</p>
            </div>
          ) : !filteredProdukList.length && !searchQuery ? (
            <div className="flex flex-col justify-center items-center h-full text-center">
              <FiArchive size={64} className="mx-auto text-gray-400" />
              <p className="mt-4 text-lg font-poppins font-semibold text-gray-700">
                Belum Ada Produk
              </p>
              <p className="mt-2 text-sm font-poppins text-gray-500">
                Pilih 'Tambah Produk' untuk menambahkan
                <br />
                produk kamu ke dalam inventori.
              </p>
            </div>
          ) : !filteredProdukList.length && searchQuery ? (
            <div className="flex justify-center items-center h-full">
             <p className="text-center text-gray-500 font-poppins">
                Tidak ada produk yang cocok dengan "{searchQuery}".
            </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredProdukList.map((produk) => (
                <li key={produk.id} className="py-4 flex items-center">
                  <div className="w-11 h-11 bg-gray-300 rounded-md mr-4 flex-shrink-0">
                    {/* Placeholder for image */}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-poppins font-semibold text-gray-800">
                      {produk.nama}
                    </p>
                    <p className="text-xs font-poppins text-gray-500">
                      Rp{produk.harga_jual?.toLocaleString("id-ID") || "N/A"}
                    </p>
                  </div>
                  <p className="text-md font-poppins font-semibold text-sky-600 mr-2">
                    {produk.stok}
                  </p>
                  <div className="relative"> 
                    <button
                      onClick={(e) => toggleOptionsMenu(produk.id, e)}
                      // --- PERUBAHAN DI SINI untuk tombol titik tiga ---
                      className="p-1.5 bg-white text-slate-700 hover:bg-gray-100 rounded-md shadow focus:outline-none border border-gray-300" 
                      aria-haspopup="true"
                      aria-expanded={activeOptionsMenu === produk.id}
                    >
                      <FiMoreVertical size={20} />
                    </button>

                    {activeOptionsMenu === produk.id && (
                      <div
                        ref={optionsMenuRef}
                        // --- PERUBAHAN DI SINI untuk menu popup ---
                        // bg-white sudah ada, pastikan tidak ada class lain yang membuatnya transparan
                        // shadow-xl dan ring memberikan efek visual yang baik
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="options-menu"
                      >
                        <button
                          onClick={() => handleEdit(produk.id)}
                          // Warna teks item menu dan ikon tetap, background item hover:bg-gray-100
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-t-md" // rounded-t-md jika ini item pertama
                          role="menuitem"
                        >
                          <FiEdit className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                          Edit Produk
                        </button>
                        <button
                          onClick={() => openDeleteConfirmModal(produk)}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-b-md" // rounded-b-md jika ini item terakhir
                          role="menuitem"
                        >
                          <FiTrash2 className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                          Hapus Produk
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {showDeleteConfirmForProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
              <h3 className="text-lg font-poppins font-semibold text-gray-800">
                Hapus produk
              </h3>
              <p className="text-sm font-poppins text-gray-600 mt-2">
                Semua data terkait dengan produk juga akan dihapus. Tindakan ini tidak bisa dibatalkan.
              </p>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeDeleteConfirmModal}
                  className="px-4 py-2 text-sm font-poppins font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteProduct(showDeleteConfirmForProduct.id)}
                  className="px-4 py-2 text-sm font-poppins font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/product/add")}
          className="fixed bottom-6 right-6 bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-full shadow-lg z-30"
          aria-label="Tambah Produk"
        >
          <FiPlus size={24} />
        </button>
      </div>
    </div>
  );
};

export default ProductPage;