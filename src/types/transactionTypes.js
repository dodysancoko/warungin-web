// src/types.js 

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
    this.type = type;
    this.amount = amount;
    this.date = date;
    this.description = description;
    this.items = items.map(item => new TransactionItem(item.name, item.quantity, item.price));
  }
}