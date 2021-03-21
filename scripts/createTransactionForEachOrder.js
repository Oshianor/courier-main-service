const Transaction = require("../models/transaction");
const Entry = require("../models/entry");
const mongoose = require("mongoose");
const Order = require("../models/order");
const { nanoid } = require("nanoid");
const ObjectId = mongoose.Types.ObjectId


async function duplicateTransaction() {
  const transactions = await Transaction.find({
  }).lean();

  for await (let transaction of transactions) {
    const entry = await Entry.findById(transaction.entry);

    if (entry.orders.length > 1) {
      console.log("entry.orders", entry.orders);
      const trans = [];
      for await (let orderId of entry.orders) {
        const order = await Order.findOne({ _id: orderId });

        const commissionAmount = parseFloat(
          (order.estimatedCost * transaction.commissionPercent) / 100
        );

        const newTrans = new Transaction({
          ...transaction,
          order: orderId,
          _id: ObjectId(),
          amount: order.estimatedCost,
          commissionAmount,
          amountWOcommision: order.estimatedCost - commissionAmount,
          txRef: nanoid(10),
        });

        await newTrans.save();
        trans.push(newTrans._id)
        await order.updateOne({ transaction: newTrans._id });
      }

      await entry.updateOne({ transaction: trans });

      await Transaction.deleteOne({ _id: transaction._id, entry: entry._id });
    }

    await entry.updateOne({ transaction: transaction._id });
    await Transaction.updateOne({ _id: transaction._id, entry: entry._id }, { order: entry.orders[0] })
    
  } 
}


duplicateTransaction();