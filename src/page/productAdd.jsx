// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { productService } from "../service/productService";
// import toast from "react-hot-toast";
// import { FiArrowLeft } from "react-icons/fi";

// const ProductAddPage = () => {
//   const navigate = useNavigate();
//   const { productId } = useParams(); // For editing
//   const isEditMode = Boolean(productId);

//   const [formData, setFormData] = useState({
//     kode: "",
//     nama: "",
//     harga_beli: "",
//     harga_jual: "",
//     stok: "",
//     minimum_stok: "",
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [errors, setErrors] = useState({});

//   useEffect(() => {
//     if (isEditMode && productId) {
//       const fetchProduct = async () => {
//         setIsLoading(true);
//         try {
//           const product = await productService.getProductById(productId);
//           setFormData({
//             kode: product.kode || "",
//             nama: product.nama || "",
//             harga_beli: product.harga_beli?.toString() || "",
//             harga_jual: product.harga_jual?.toString() || "",
//             stok: product.stok?.toString() || "",
//             minimum_stok: product.minimum_stok?.toString() || "",
//           });
//         } catch (error) {
//           toast.error("Gagal memuat data produk: " + error.message);
//           navigate("/product");
//         }
//         setIsLoading(false);
//       };
//       fetchProduct();
//     }
//   }, [isEditMode, productId, navigate]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//         setErrors(prev => ({ ...prev, [name]: null }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.kode.trim()) newErrors.kode = "Kode produk tidak boleh kosong";
//     if (!formData.nama.trim()) newErrors.nama = "Nama produk tidak boleh kosong";
//     if (!formData.harga_beli.trim()) newErrors.harga_beli = "Harga beli tidak boleh kosong";
//     else if (isNaN(Number(formData.harga_beli))) newErrors.harga_beli = "Harga beli harus berupa angka";
//     if (!formData.harga_jual.trim()) newErrors.harga_jual = "Harga jual tidak boleh kosong";
//     else if (isNaN(Number(formData.harga_jual))) newErrors.harga_jual = "Harga jual harus berupa angka";
//     if (!formData.stok.trim()) newErrors.stok = "Stok tidak boleh kosong";
//     else if (isNaN(Number(formData.stok))) newErrors.stok = "Stok harus berupa angka";
//     if (!formData.minimum_stok.trim()) newErrors.minimum_stok = "Minimum stok tidak boleh kosong";
//     else if (isNaN(Number(formData.minimum_stok))) newErrors.minimum_stok = "Minimum stok harus berupa angka";
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) {
//       toast.error("Silakan periksa kembali form Anda.");
//       return;
//     }

//     setIsLoading(true);
//     const productData = {
//       kode: formData.kode,
//       nama: formData.nama,
//       harga_beli: parseInt(formData.harga_beli, 10),
//       harga_jual: parseInt(formData.harga_jual, 10),
//       stok: parseInt(formData.stok, 10),
//       minimum_stok: parseInt(formData.minimum_stok, 10),
//     };

//     try {
//       if (isEditMode && productId) {
//         await productService.updateProduct(productId, productData);
//         toast.success("Produk berhasil diperbarui!");
//       } else {
//         await productService.addProduct(productData);
//         toast.success("Produk berhasil ditambahkan!");
//       }
//       navigate("/product", { state: { refresh: true } }); // Navigate back and signal refresh
//     } catch (error) {
//       toast.error("Gagal menyimpan produk: " + error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (isEditMode && isLoading && !formData.nama) {
//     return <div className="p-10">Memuat data produk...</div>; // Basic loading state
//   }

//   return (
//     <div className="min-h-screen bg-white">
//       <header className="bg-white shadow-sm sticky top-0 z-10">
//         <div className="container mx-auto px-4 h-16 flex items-center">
//           <button onClick={() => navigate(-1)} className="text-gray-700 mr-4">
//             <FiArrowLeft size={24} />
//           </button>
//           <h1 className="text-lg font-poppins font-semibold text-gray-700">
//             {isEditMode ? "Edit Produk" : "Tambah Produk"}
//           </h1>
//         </div>
//       </header>

//       <main className="p-5">
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label htmlFor="kode" className="block text-sm font-poppins font-medium text-gray-600">
//               Kode Produk
//             </label>
//             <input
//               type="text"
//               name="kode"
//               id="kode"
//               value={formData.kode}
//               onChange={handleChange}
//               placeholder="Masukkan kode produk"
//               className={`mt-1 block w-full px-3 py-2 border ${errors.kode ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`}
//             />
//             {errors.kode && <p className="text-red-500 text-xs mt-1">{errors.kode}</p>}
//           </div>

//           <div>
//             <label htmlFor="nama" className="block text-sm font-poppins font-medium text-gray-600">
//               Nama Produk
//             </label>
//             <input
//               type="text"
//               name="nama"
//               id="nama"
//               value={formData.nama}
//               onChange={handleChange}
//               placeholder="Masukkan nama produk"
//               className={`mt-1 block w-full px-3 py-2 border ${errors.nama ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`}
//             />
//              {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
//           </div>

//           <div className="pt-4">
//             <h2 className="text-md font-poppins font-semibold text-gray-800">Harga</h2>
//           </div>

//           <div>
//             <label htmlFor="harga_beli" className="block text-sm font-poppins font-medium text-gray-600">
//               Harga Beli
//             </label>
//             <input
//               type="number"
//               name="harga_beli"
//               id="harga_beli"
//               value={formData.harga_beli}
//               onChange={handleChange}
//               placeholder="Masukkan harga beli"
//               className={`mt-1 block w-full px-3 py-2 border ${errors.harga_beli ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`}
//             />
//             {errors.harga_beli && <p className="text-red-500 text-xs mt-1">{errors.harga_beli}</p>}
//           </div>

//           <div>
//             <label htmlFor="harga_jual" className="block text-sm font-poppins font-medium text-gray-600">
//               Harga Jual
//             </label>
//             <input
//               type="number"
//               name="harga_jual"
//               id="harga_jual"
//               value={formData.harga_jual}
//               onChange={handleChange}
//               placeholder="Masukkan harga jual"
//               className={`mt-1 block w-full px-3 py-2 border ${errors.harga_jual ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`}
//             />
//             {errors.harga_jual && <p className="text-red-500 text-xs mt-1">{errors.harga_jual}</p>}
//           </div>

//           <div className="pt-4">
//             <h2 className="text-md font-poppins font-semibold text-gray-800">Kuantitas</h2>
//           </div>
          
//           <div>
//             <label htmlFor="stok" className="block text-sm font-poppins font-medium text-gray-600">
//               Stok
//             </label>
//             <input
//               type="number"
//               name="stok"
//               id="stok"
//               value={formData.stok}
//               onChange={handleChange}
//               placeholder="Masukkan stok"
//               className={`mt-1 block w-full px-3 py-2 border ${errors.stok ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`}
//             />
//             {errors.stok && <p className="text-red-500 text-xs mt-1">{errors.stok}</p>}
//           </div>

//           <div>
//             <label htmlFor="minimum_stok" className="block text-sm font-poppins font-medium text-gray-600">
//               Minimum Stok
//             </label>
//             <input
//               type="number"
//               name="minimum_stok"
//               id="minimum_stok"
//               value={formData.minimum_stok}
//               onChange={handleChange}
//               placeholder="Masukkan minimum stok"
//               className={`mt-1 block w-full px-3 py-2 border ${errors.minimum_stok ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-black focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm font-poppins`}
//             />
//             {errors.minimum_stok && <p className="text-red-500 text-xs mt-1">{errors.minimum_stok}</p>}
//           </div>

//           <div className="pt-8">
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-sky-500 hover:bg-sky-600 text-white font-poppins font-semibold py-3 px-4 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 disabled:opacity-50"
//             >
//               {isLoading ? "Menyimpan..." : "Simpan"}
//             </button>
//           </div>
//         </form>
//       </main>
//     </div>
//   );
// };

// export default ProductAddPage;