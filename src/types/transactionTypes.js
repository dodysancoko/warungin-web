// src/types.js atau src/types.ts (jika pakai TypeScript)

export const TransactionType = {
  income: 'income',
  expense: 'expense',
};

export class TransactionItem {
  constructor(name, quantity, price) {
    this.name = name;
    this.quantity = quantity;
    this.price = price;
  }
}

export class Transaction {
  constructor(id, type, amount, date, description, items = []) {
    this.id = id;
    this.type = type; // Use TransactionType enum values
    this.amount = amount;
    this.date = date; // Date object
    this.description = description;
    this.items = items.map(item => new TransactionItem(item.name, item.quantity, item.price)); // Ensure items are TransactionItem instances
  }
}