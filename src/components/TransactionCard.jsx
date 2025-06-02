// src/components/TransactionCard.jsx
import React from 'react';
import { TransactionType } from '../types/transactionTypes'; // Sesuaikan path jika berbeda (misal: ../types.js)
// import { Intl } from 'intl'; // Built-in browser Intl - Tidak perlu di-import eksplisit

const TransactionCard = ({ transaction, isExpanded, onToggleExpansion }) => {
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    marginBottom: '8px',
    overflow: 'hidden', // Ensure details stay within bounds
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: isExpanded ? '1px solid #eee' : 'none', // Separator when expanded
  };

   // Menentukan warna berdasarkan tipe transaksi
   const textColor = transaction.type === TransactionType.income ? '#28a745' : '#dc3545'; // Green/Red

  const descriptionStyle = {
    fontSize: '15px',
    fontWeight: '500',
    color: textColor, // Gunakan warna yang sudah ditentukan
  };

  const amountStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: textColor, // Gunakan warna yang sudah ditentukan
  };

  const detailsStyle = {
    padding: isExpanded ? '8px 16px 12px' : '0 16px', // Padding only when expanded
    fontSize: '14px',
    color: '#555',
    // max-height dan opacity untuk transisi ekspansi/kolaps
    maxHeight: isExpanded ? '500px' : '0', // Tinggi maksimum saat expanded
    overflow: 'hidden', // Sembunyikan konten jika tinggi 0
    opacity: isExpanded ? 1 : 0, // Opacity untuk fade effect
    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out', // Transisi
  };

   const itemStyle = {
      marginBottom: '4px',
      fontSize: '13px',
      color: '#666',
   }

   // Fungsi format mata uang
  const currencyFormat = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0, // Sesuaikan jika Anda ingin menampilkan digit desimal
  });

  // --- PERBAIKAN: Fungsi formatCurrency yang lebih aman ---
  // Pastikan fungsi formatCurrency ini mengonversi input ke Number
   const safeFormatCurrency = (value) => {
       const numValue = Number(value || 0); // Konversi input ke Number, fallback ke 0 jika invalid
       return currencyFormat.format(numValue);
   };
  // --- AKHIR PERBAIKAN ---


  return (
    <div style={cardStyle}>
      <div style={headerStyle} onClick={onToggleExpansion}>
        {/* Tampilkan kode transaksi jika ada, atau deskripsi, atau tipe default */}
        <div style={descriptionStyle}>
            {transaction.kode ? `Penjualan #${transaction.kode}` : transaction.description || (transaction.type === TransactionType.income ? 'Pemasukkan' : 'Pengeluaran')}
        </div>
        {/* Tampilkan total amount. Pastikan amount adalah Number. */}
        {/* Menggunakan safeFormatCurrency untuk menjamin inputnya Number */}
        <div style={amountStyle}>{safeFormatCurrency(transaction.amount)}</div>
      </div>

      {/* Details Section (Muncul saat isExpanded true) */}
      <div style={detailsStyle}>
         {/* Cek apakah ada items dan items tidak kosong */}
         {transaction.items && Array.isArray(transaction.items) && transaction.items.length > 0 ? (
            <> {/* Gunakan Fragment */}
               <div>Items:</div>
               <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0 8px' }}>
                  {/* Loop melalui item-item */}
                  {transaction.items.map((item, index) => {
                     // --- PERBAIKAN: LAKUKAN KONVERSI Number() DI SINI UNTUK QUANTITY DAN PRICE ---
                     // Gunakan Number() dengan fallback || 0 untuk menangani nilai undefined, null, atau string kosong
                     const itemJumlah = Number(item.jumlah || 0);
                     const itemHargaJual = Number(item.harga_jual || 0);
                     // Jika Anda butuh harga beli di sini, konversi juga:
                     // const itemHargaBeli = Number(item.harga_beli || 0);
                     // --- AKHIR PERBAIKAN ---

                     // Hitung subtotal per item (menggunakan nilai yang sudah dikonversi)
                     const itemSubtotal = itemJumlah * itemHargaJual;


                     return (
                       <li key={index} style={itemStyle}>
                          {/* Tampilkan detail item menggunakan nilai yang sudah dijamin Number */}
                          {/* Gunakan safeFormatCurrency untuk harga */}
                         {itemJumlah}x {item.name} (@{safeFormatCurrency(itemHargaJual)}) = {safeFormatCurrency(itemSubtotal)}
                       </li>
                     );
                  })}
               </ul>
            </>
         ) : (
            // Pesan jika tidak ada items (untuk transaksi manual atau penjualan lama)
             <div>Detail item tidak tersedia.</div>
         )}

         {/* Tampilkan detail tambahan dari CashierPage jika ada */}
         {/* Cek apakah field spesifik penjualan ada dan bukan NaN */}
         {transaction.uangDiterima !== undefined && transaction.uangDiterima !== null && Number(transaction.uangDiterima) > 0 && (
             // Pastikan menggunakan nilai Number saat menampilkan/menghitung
              <div style={{marginTop: '8px'}}>
                   <p>Uang Diterima: {safeFormatCurrency(transaction.uangDiterima)}</p>
                   {/* Kembalian dihitung ulang di sini berdasarkan nilai numerik yang aman */}
                   <p>Kembalian: {safeFormatCurrency(Number(transaction.uangDiterima || 0) - Number(transaction.amount || 0))}</p>
              </div>
         )}
         {transaction.profit !== undefined && transaction.profit !== null && (
               <div style={{marginTop: '8px'}}>
                   <p>Profit dari Transaksi Ini: {safeFormatCurrency(transaction.profit)}</p>
               </div>
         )}

      </div>
    </div>
  );
};

export default TransactionCard;