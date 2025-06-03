// src/page/AddTransactionPage.jsx
import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import { Transaction, TransactionType } from '../types/transactionTypes';
import { TransactionService } from '../service/transactionService';

const styles = {
   container: {
       display: 'flex',
       flexDirection: 'column',
       padding: '20px',
   },
  modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '15px',
      borderBottom: '1px solid #eee',
      marginBottom: '20px',
  },
  modalTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#333',
  },
  closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#555',
      padding: '4px',
  },
  form: {
   display: 'flex',
   flexDirection: 'column',
   gap: '16px',
  },
   segmentedButtonStyle: {
     display: 'flex',
     borderRadius: '4px',
     overflow: 'hidden',
     border: '1px solid #ccc',
   },
   segmentStyle: (isSelected, type) => ({
     flex: 1,
     padding: '10px 12px',
     textAlign: 'center',
     cursor: 'pointer',
     fontWeight: '500',
     backgroundColor: isSelected
       ? (type === TransactionType.income ? '#e8f5e9' : '#ffebee')
       : 'white',
     color: isSelected
       ? (type === TransactionType.income ? '#2e7d32' : '#c62828')
       : '#555',
     border: 'none',
     outline: 'none',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     gap: '8px',
   }),
   iconStyle: {
     fontSize: '18px',
   },
   inputStyle: {
      padding: '10px 12px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '16px',
      width: '100%',
      boxSizing: 'border-box',
      color: '#333',
   },
   labelStyle: {
      display: 'block',
      marginBottom: '4px',
      fontWeight: '500',
      color: '#333',
      fontSize: '14px',
   },
   errorStyle: {
      color: 'red',
      fontSize: '12px',
      marginTop: '4px',
   },
   buttonStyle: (type, isSaving) => ({
     padding: '14px 16px',
     fontSize: '16px',
     fontWeight: '600',
     color: 'white',
     backgroundColor: type === TransactionType.income ? (isSaving ? '#4CAF50' : 'green') : (isSaving ? '#EF5350' : 'red'),
     border: 'none',
     borderRadius: '8px',
     cursor: isSaving ? 'not-allowed' : 'pointer',
     opacity: isSaving ? 0.8 : 1,
     marginTop: '20px',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     gap: '8px',
     transition: 'background-color 0.3s ease',
   }),
};


function AddTransactionPage({ onSave, onCancel }) {
  const [selectedType, setSelectedType] = useState(TransactionType.income);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleAmountChange = (e) => {
       const value = e.target.value;
       const numericValue = value.replace(/\D/g, '');
      setAmount(numericValue);
  };

   const handleSave = async (e) => {
      e.preventDefault();

      if (isSaving) return;

      const validationErrors = {};
      const parsedAmount = parseInt(amount, 10);

      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
         validationErrors.amount = 'Masukkan jumlah angka yang valid';
      }

      if (Object.keys(validationErrors).length > 0) {
         setErrors(validationErrors);
         return;
      }

      setErrors({});
      setIsSaving(true);

      const newTransaction = new Transaction(
         Date.now().toString() + Math.random().toString(16).slice(2),
         selectedType,
         parsedAmount,
         new Date(),
         description,
         []
      );

      try {
         if (onSave) {
           await onSave(newTransaction);
         }
      } catch (err) {
         console.error("Error during save process:", err);
         setIsSaving(false);
      }
   };

  return (
    <div style={styles.container}>
        {/* Header Modal */}
        <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>
                {selectedType === TransactionType.income ? "Tambah Pemasukkan" : "Tambah Pengeluaran"}
            </h2>
            {/* Tombol Tutup */}
            <button style={styles.closeButton} onClick={onCancel} aria-label="Tutup">
                 <X size={24} />
            </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={styles.form}>
            {/* Transaction Type Selector */}
            <div style={styles.segmentedButtonStyle}>
              <button type="button" style={styles.segmentStyle(selectedType === TransactionType.income, TransactionType.income)} onClick={() => setSelectedType(TransactionType.income)}>
                 <span style={styles.iconStyle}><ArrowUp size={18} /></span> Pemasukkan
              </button>
              <button type="button" style={styles.segmentStyle(selectedType === TransactionType.expense, TransactionType.expense)} onClick={() => setSelectedType(TransactionType.expense)}>
                 <span style={styles.iconStyle}><ArrowDown size={18} /></span> Pengeluaran
              </button>
            </div>

            {/* Amount Field */}
            <div>
               <label htmlFor="amount" style={styles.labelStyle}>Jumlah (Rp)</label>
               <input
                  id="amount"
                  type="text"
                  style={styles.inputStyle}
                  placeholder="Contoh: 50000"
                  value={amount}
                  onChange={handleAmountChange}
                   inputMode="numeric"
               />
               {errors.amount && <div style={styles.errorStyle}>{errors.amount}</div>}
            </div>

            {/* Description Field */}
            <div>
               <label htmlFor="description" style={styles.labelStyle}>Deskripsi</label>
               <textarea
                  id="description"
                  style={styles.inputStyle}
                  placeholder={selectedType === TransactionType.income ? "Contoh: Penjualan Harian" : "Contoh: Beli Stok ATK"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
               />
            </div>

            {/* Save Button */}
            <button type="submit" style={styles.buttonStyle(selectedType, isSaving)} disabled={isSaving}>
               {isSaving ? 'Menyimpan...' : (
                  <>
                     <Save size={20} />
                     Simpan
                  </>
               )}
            </button>
        </form>
    </div>
  );
}

export default AddTransactionPage;