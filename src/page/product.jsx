import React, { useEffect, useState } from 'react';
import { getAllProducts, addProduct, updateProduct, deleteProduct } from '../service/productService';
import { useNavigate } from 'react-router-dom';

function ProdukScreen() {
  const [produkList, setProdukList] = useState([]);
  const [filteredProdukList, setFilteredProdukList] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduk();
  }, []);

  useEffect(() => {
    filterProduk(search);
  }, [search, produkList]);

  const fetchProduk = async () => {
    try {
      const data = await getAllProducts();
      setProdukList(data);
      setFilteredProdukList(data);
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  };

  const filterProduk = (query) => {
    const q = query.toLowerCase();
    setFilteredProdukList(
      produkList.filter(p => p.nama.toLowerCase().includes(q))
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm("Semua data terkait produk juga akan dihapus. Lanjutkan?")) {
      await deleteProduct(id);
      fetchProduk();
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* Header background */}
      <div className="absolute top-0 left-0 right-0 h-36 bg-blue-400 rounded-b-2xl -z-10"></div>

      <div className="pt-12 px-5">
        <h1 className="text-white text-xl font-semibold mb-5">Produk</h1>

        {/* Search Box */}
        <div className="flex items-center bg-white rounded-lg border border-gray-300 px-4 py-2 mb-5 w-full max-w-md">
          <i className="fas fa-search text-gray-400 text-sm"></i>
          <input
            type="text"
            placeholder="Cari Produk"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-3 flex-grow outline-none text-sm"
          />
        </div>

        {/* Produk List */}
        <div className="bg-white rounded-xl shadow-md p-4">
          {filteredProdukList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <i className="fas fa-box-open text-5xl text-gray-400 mb-4"></i>
              <p className="font-semibold text-gray-800 mb-1">Belum Ada Produk</p>
              <p className="text-sm text-gray-600">
                Pilih 'Tambah Produk' untuk menambahkan produk kamu ke dalam inventori.
              </p>
            </div>
          ) : (
            <ul>
              {filteredProdukList.map((produk, index) => (
                <li key={produk.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-md" />
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{produk.nama}</p>
                      <p className="text-sm text-gray-600">Rp{produk.harga_jual}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-blue-500 font-bold">{produk.stok}</span>
                    <div className="relative group">
                      <button className="text-gray-600 hover:text-black">
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      <div className="absolute right-0 top-6 bg-white border border-gray-200 shadow-md rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                          onClick={() =>
                            navigate('/produk/edit', {
                              state: {
                                produk,
                                onSave: async (produkBaru) => {
                                  await updateProduct(produk.id, produkBaru);
                                  fetchProduk();
                                }
                              }
                            })
                          }
                        >
                          Edit Produk
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-100 w-full text-left"
                          onClick={() => handleDelete(produk.id)}
                        >
                          Hapus Produk
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Floating Button */}
      <button
        className="fixed bottom-5 right-5 bg-blue-400 text-white p-4 rounded-full shadow-lg hover:bg-blue-500"
        onClick={() =>
          navigate('/produk/tambah', {
            state: {
              onSave: async (produkBaru) => {
                await addProduct(produkBaru);
                fetchProduk();
              }
            }
          })
        }
      >
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
}

export default ProdukScreen;
