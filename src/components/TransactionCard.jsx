// src/components/TransactionCard.jsx
import React from 'react';
import { TransactionType } from '../types/transactionTypes'; // Sesuaikan path
// import { Intl } from 'intl'; // Built-in browser Intl

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

  const descriptionStyle = {
    fontSize: '15px',
    fontWeight: '500',
    color: transaction.type === TransactionType.income ? '#28a745' : '#dc3545', // Green/Red
  };

  const amountStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: transaction.type === TransactionType.income ? '#28a745' : '#dc3545', // Green/Red
  };

  const detailsStyle = {
    padding: isExpanded ? '8px 16px 12px' : '0 16px', // Padding only when expanded
    fontSize: '14px',
    color: '#555',
    transition: 'padding 0.3s ease-out', // Optional: animation
    maxHeight: isExpanded ? '500px' : '0', // Max height for expansion effect
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

  return (
    <div style={cardStyle}>
      <div style={headerStyle} onClick={onToggleExpansion}>
        <div style={descriptionStyle}>{transaction.description || (transaction.type === TransactionType.income ? 'Pemasukkan' : 'Pengeluaran')}</div>
        <div style={amountStyle}>{currencyFormat.format(transaction.amount)}</div>
      </div>
      {/* Details Section (conditionally rendered/styled based on isExpanded) */}
      <div style={detailsStyle}>
         {transaction.items && transaction.items.length > 0 && (
            <>
               <div>Items:</div>
               <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0 8px' }}>
                  {transaction.items.map((item, index) => (
                     <li key={index} style={itemStyle}>
                        {item.quantity}x {item.name} (@{currencyFormat.format(item.price)})
                     </li>
                  ))}
               </ul>
            </>
         )}
         {!transaction.items || transaction.items.length === 0 && (
            <div>Detail transaksi tidak tersedia.</div>
         )}
      </div>
    </div>
  );
};

export default TransactionCard;