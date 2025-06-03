import React from 'react';
import { TransactionType } from '../types/transactionTypes';

const TransactionCard = ({ transaction, isExpanded, onToggleExpansion }) => {
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    marginBottom: '8px',
    overflow: 'hidden',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: isExpanded ? '1px solid #eee' : 'none',
  };
   const textColor = transaction.type === TransactionType.income ? '#28a745' : '#dc3545';

  const descriptionStyle = {
    fontSize: '15px',
    fontWeight: '500',
    color: textColor,
  };

  const amountStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: textColor,
  };

  const detailsStyle = {
    padding: isExpanded ? '8px 16px 12px' : '0 16px',
    fontSize: '14px',
    color: '#555',
    maxHeight: isExpanded ? '500px' : '0', 
    overflow: 'hidden',
    opacity: isExpanded ? 1 : 0,
    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
  };

   const itemStyle = {
      marginBottom: '4px',
      fontSize: '13px',
      color: '#666',
   }

  const currencyFormat = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

   const safeFormatCurrency = (value) => {
       const numValue = Number(value || 0); 
       return currencyFormat.format(numValue);
   };

  return (
    <div style={cardStyle}>
      <div style={headerStyle} onClick={onToggleExpansion}>
        <div style={descriptionStyle}>
            {transaction.kode ? `Penjualan #${transaction.kode}` : transaction.description || (transaction.type === TransactionType.income ? 'Pemasukkan' : 'Pengeluaran')}
        </div>
        <div style={amountStyle}>{safeFormatCurrency(transaction.amount)}</div>
      </div>

      <div style={detailsStyle}>
         {transaction.items && Array.isArray(transaction.items) && transaction.items.length > 0 ? (
            <>
               <div>Items:</div>
               <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0 8px' }}>
                  {transaction.items.map((item, index) => {
                     const itemJumlah = Number(item.jumlah || 0);
                     const itemHargaJual = Number(item.harga_jual || 0);
                     const itemSubtotal = itemJumlah * itemHargaJual;

                     return (
                       <li key={index} style={itemStyle}>
                         {itemJumlah}x {item.name} (@{safeFormatCurrency(itemHargaJual)}) = {safeFormatCurrency(itemSubtotal)}
                       </li>
                     );
                  })}
               </ul>
            </>
         ) : (
             <div>Detail item tidak tersedia.</div>
         )}

         {transaction.uangDiterima !== undefined && transaction.uangDiterima !== null && Number(transaction.uangDiterima) > 0 && (
              <div style={{marginTop: '8px'}}>
                   <p>Uang Diterima: {safeFormatCurrency(transaction.uangDiterima)}</p>
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