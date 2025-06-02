import React, { useState, useEffect, useCallback, useRef } from "react"; // Tambahkan useRef
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

  // State untuk mengontrol popup kecil untuk opsi
  const [activeOptionsMenu, setActiveOptionsMenu] = useState(null); // Akan menyimpan ID produk yang opsinya aktif
  const [showDeleteConfirmForProduct, setShowDeleteConfirmForProduct] = useState(null);
  
  const optionsMenuRef = useRef(null); // Ref untuk menu popup

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

  // Effect untuk menutup popup jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        // Cek juga agar tidak menutup jika target adalah tombol trigger itu sendiri
        // Namun, logika toggle sudah menangani ini.
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
    setActiveOptionsMenu(null); // Tutup menu opsi setelah aksi
    setIsLoading(false);
  };

  const toggleOptionsMenu = (productId, event) => {
    event.stopPropagation(); // Mencegah event bubbling yang mungkin langsung menutup menu
    setActiveOptionsMenu(activeOptionsMenu === productId ? null : productId);
  };

  const handleEdit = (productId) => {
    navigate(`/product/edit/${productId}`);
    setActiveOptionsMenu(null);
  };

  const openDeleteConfirmModal = (product) => {
    setShowDeleteConfirmForProduct(product);
    setActiveOptionsMenu(null); // Tutup menu opsi
  };
  
  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirmForProduct(null);
  };


  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-sky-400 p-5 rounded-b-xl shadow-md relative h-[139px]">
          <div className="mt-5">
            <h1 className="text-white text-xl font-poppins font-semibold">
              Produk
            </h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-5 -mt-10 z-10">
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

        {/* Product List Area */}
        <div className="flex-1 bg-white mt-5 p-5 shadow-lg rounded-t-xl overflow-y-auto">
          {isLoading && !filteredProdukList.length ? (
            <p className="text-center text-gray-500">Memuat produk...</p>
          ) : !filteredProdukList.length && !searchQuery ? (
            <div className="text-center py-10">
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
             <p className="text-center text-gray-500 font-poppins">
                Tidak ada produk yang cocok dengan "{searchQuery}".
            </p>
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
                  {/* Container untuk tombol dan menu popup agar positioning lebih mudah */}
                  <div className="relative"> 
                    <button
                      onClick={(e) => toggleOptionsMenu(produk.id, e)}
                      className="p-1.5 text-slate-700 hover:bg-gray-200 rounded-full focus:outline-none" // Warna ikon hitam (slate-700), bg transparan, p-1.5 untuk area klik
                      aria-haspopup="true"
                      aria-expanded={activeOptionsMenu === produk.id}
                    >
                      <FiMoreVertical size={20} />
                    </button>

                    {/* Menu Opsi Popup Kecil */}
                    {activeOptionsMenu === produk.id && (
                      <div
                        ref={optionsMenuRef} // Tambahkan ref di sini
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="options-menu"
                      >
                        <button
                          onClick={() => handleEdit(produk.id)}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem"
                        >
                          <FiEdit className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                          Edit Produk
                        </button>
                        <button
                          onClick={() => openDeleteConfirmModal(produk)}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem"
                        >
                          <FiTrash2 className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
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
        
        {/* Delete Confirmation Modal (tetap sama) */}
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

        {/* Floating Action Button */}
        <button
          onClick={() => navigate("/product/add")}
          className="fixed bottom-6 right-6 bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-full shadow-lg z-30" // z-index lebih tinggi dari popup jika perlu
          aria-label="Tambah Produk"
        >
          <FiPlus size={24} />
        </button>
      </div>
    </div>
  );
};

export default ProductPage;