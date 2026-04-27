const Stock = require("../models/StockTransaction");

exports.getItemBalance = async (itemId) => {
  const transactions = await Stock.find({ item: itemId });

  let balance = 0;

  transactions.forEach((t) => {
    if (t.type === "IN") balance += t.quantity;
    else balance -= t.quantity;
  });

  return balance;
};