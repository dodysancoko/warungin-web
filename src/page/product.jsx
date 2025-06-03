import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { productService } from "../service/productService";
import toast from "react-hot-toast";
import { FiSearch, FiArchive, FiMoreVertical, FiPlus, FiEdit, FiTrash2, FiX } from "react-icons/fi";
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

  // --- STATE UNTUK MODAL TAMBAH/EDIT PRODUK ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentEditingProduct, setCurrentEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
    harga_beli: "",
    harga_jual: "",
    stok: "",
    minimum_stok: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  // --- AKHIR STATE MODAL ---


  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const products = await productService.getAllProducts();
      products.sort((a,b) => a.nama?.localeCompare(b.nama || '') || 0);
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

  const resetFormData = () => {
    setFormData({
      kode: "",
      nama: "",
      harga_beli: "",
      harga_jual: "",
      stok: "",
      minimum_stok: "",
    });
    setFormErrors({});
  };

  const openModal = (mode = "add", product = null) => {
    setModalMode(mode);
    setIsModalOpen(true);
    resetFormData();
    if (mode === "edit" && product) {
      setCurrentEditingProduct(product);
      setFormData({
        kode: product.kode || "",
        nama: product.nama || "",
        harga_beli: product.harga_beli?.toString() || "",
        harga_jual: product.harga_jual?.toString() || "",
        stok: product.stok?.toString() || "",
        minimum_stok: product.minimum_stok?.toString() || "",
      });
    } else {
      setCurrentEditingProduct(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEditingProduct(null);
    resetFormData();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.kode.trim()) newErrors.kode = "Kode produk tidak boleh kosong";
    if (!formData.nama.trim()) newErrors.nama = "Nama produk tidak boleh kosong";
    if (formData.harga_beli.trim() === "") newErrors.harga_beli = "Harga beli tidak boleh kosong";
    else if (isNaN(Number(formData.harga_beli))) newErrors.harga_beli = "Harga beli harus berupa angka";
    if (formData.harga_jual.trim() === "") newErrors.harga_jual = "Harga jual tidak boleh kosong";
    else if (isNaN(Number(formData.harga_jual))) newErrors.harga_jual = "Harga jual harus berupa angka";
    if (formData.stok.trim() === "") newErrors.stok = "Stok tidak boleh kosong";
    else if (isNaN(Number(formData.stok))) newErrors.stok = "Stok harus berupa angka";
    if (formData.minimum_stok.trim() === "") newErrors.minimum_stok = "Minimum stok tidak boleh kosong";
    else if (isNaN(Number(formData.minimum_stok))) newErrors.minimum_stok = "Minimum stok harus berupa angka";
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Silakan periksa kembali form Anda.");
      return;
    }

    setIsSubmitting(true);
    const productData = {
      kode: formData.kode,
      nama: formData.nama,
      harga_beli: parseInt(formData.harga_beli, 10),
      harga_jual: parseInt(formData.harga_jual, 10),
      stok: parseInt(formData.stok, 10),
      minimum_stok: parseInt(formData.minimum_stok, 10),
    };

    try {
      if (modalMode === "edit" && currentEditingProduct?.id) {
        await productService.updateProduct(currentEditingProduct.id, productData);
        toast.success("Produk berhasil diperbarui!");
      } else {
        await productService.addProduct(productData);
        toast.success("Produk berhasil ditambahkan!");
      }
      fetchProducts();
      closeModal();    
    } catch (error) {
      toast.error("Gagal menyimpan produk: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeleteProduct = async (productId) => {
    if (!productId) return;
    setIsSubmitting(true);
    try {
      await productService.deleteProduct(productId);
      toast.success("Produk berhasil dihapus!");
      fetchProducts();
    } catch (error) {
      toast.error("Gagal menghapus produk: " + error.message);
    }
    setShowDeleteConfirmForProduct(null);
    setActiveOptionsMenu(null);
    setIsSubmitting(false);
  };

  const toggleOptionsMenu = (productId, event) => {
    event.stopPropagation();
    setActiveOptionsMenu(activeOptionsMenu === productId ? null : productId);
  };

  const handleEditAction = (product) => {
    openModal("edit", product);
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
                Pilih 'Tambah Produk' untuk menambahkan produk baru.
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
                      className="p-1.5 bg-white text-slate-700 hover:bg-gray-100 rounded-md shadow focus:outline-none border border-gray-300" 
                      aria-haspopup="true"
                      aria-expanded={activeOptionsMenu === produk.id}
                    >
                      <FiMoreVertical size={20} />
                    </button>

                    {activeOptionsMenu === produk.id && (
                      <div
                        ref={optionsMenuRef}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="options-menu"
                      >
                        <button
                          onClick={() => handleEditAction(produk)}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-t-md"
                          role="menuitem"
                        >
                          <FiEdit className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                          Edit Produk
                        </button>
                        <button
                          onClick={() => openDeleteConfirmModal(produk)}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-b-md"
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
        
        {/* MODAL UNTUK TAMBAH/EDIT PRODUK */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-transparant bg-opacity-60 flex items-center justify-center z-40 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"> {/* Max height dan flex-col */}
                {/* Header Modal */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-poppins font-semibold text-gray-800">
                    {modalMode === 'edit' ? 'Edit Produk' : 'Tambah Produk'}
                    </h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Form Modal (Scrollable) */}
                <form onSubmit={handleFormSubmit} className="p-5 space-y-5 overflow-y-auto flex-grow"> {/* flex-grow dan overflow-y-auto */}
                    <div>
                        <label htmlFor="modal-kode" className="block text-sm font-poppins font-medium text-gray-600">Kode Produk</label>
                        <input type="text" name="kode" id="modal-kode" value={formData.kode} onChange={handleFormChange} placeholder="Masukkan kode produk"
                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.kode ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`} />
                        {formErrors.kode && <p className="text-red-500 text-xs mt-1">{formErrors.kode}</p>}
                    </div>
                    <div>
                        <label htmlFor="modal-nama" className="block text-sm font-poppins font-medium text-gray-600">Nama Produk</label>
                        <input type="text" name="nama" id="modal-nama" value={formData.nama} onChange={handleFormChange} placeholder="Masukkan nama produk"
                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.nama ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`} />
                        {formErrors.nama && <p className="text-red-500 text-xs mt-1">{formErrors.nama}</p>}
                    </div>
                    
                    <div className="pt-2"><h2 className="text-md font-poppins font-semibold text-gray-800">Harga</h2></div>
                    <div>
                        <label htmlFor="modal-harga_beli" className="block text-sm font-poppins font-medium text-gray-600">Harga Beli</label>
                        <input type="number" name="harga_beli" id="modal-harga_beli" value={formData.harga_beli} onChange={handleFormChange} placeholder="Masukkan harga beli"
                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.harga_beli ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`} />
                        {formErrors.harga_beli && <p className="text-red-500 text-xs mt-1">{formErrors.harga_beli}</p>}
                    </div>
                    <div>
                        <label htmlFor="modal-harga_jual" className="block text-sm font-poppins font-medium text-gray-600">Harga Jual</label>
                        <input type="number" name="harga_jual" id="modal-harga_jual" value={formData.harga_jual} onChange={handleFormChange} placeholder="Masukkan harga jual"
                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.harga_jual ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`} />
                        {formErrors.harga_jual && <p className="text-red-500 text-xs mt-1">{formErrors.harga_jual}</p>}
                    </div>

                    <div className="pt-2"><h2 className="text-md font-poppins font-semibold text-gray-800">Kuantitas</h2></div>
                    <div>
                        <label htmlFor="modal-stok" className="block text-sm font-poppins font-medium text-gray-600">Stok</label>
                        <input type="number" name="stok" id="modal-stok" value={formData.stok} onChange={handleFormChange} placeholder="Masukkan stok"
                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.stok ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`} />
                        {formErrors.stok && <p className="text-red-500 text-xs mt-1">{formErrors.stok}</p>}
                    </div>
                    <div>
                        <label htmlFor="modal-minimum_stok" className="block text-sm font-poppins font-medium text-gray-600">Minimum Stok</label>
                        <input type="number" name="minimum_stok" id="modal-minimum_stok" value={formData.minimum_stok} onChange={handleFormChange} placeholder="Masukkan minimum stok"
                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.minimum_stok ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`} />
                        {formErrors.minimum_stok && <p className="text-red-500 text-xs mt-1">{formErrors.minimum_stok}</p>}
                    </div>
                </form>
                {/* Footer Modal */}
                <div className="flex justify-end items-center p-5 border-t border-gray-200 sticky bottom-0 bg-white z-10">
                    <button type="button" onClick={closeModal}
                            className="px-4 py-2 text-sm font-poppins font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md mr-3">
                        Batal
                    </button>
                    <button type="button" onClick={handleFormSubmit} disabled={isSubmitting}
                            className="bg-sky-500 hover:bg-sky-600 text-white font-poppins font-semibold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 disabled:opacity-50">
                        {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS */}
        {showDeleteConfirmForProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
              <h3 className="text-lg font-poppins font-semibold text-gray-800">
                Hapus produk
              </h3>
              <p className="text-sm font-poppins text-gray-600 mt-2">
                Yakin ingin menghapus produk "{showDeleteConfirmForProduct.nama}"? Tindakan ini tidak bisa dibatalkan.
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => openModal("add")}
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