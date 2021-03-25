const Company = require("../models/company");
const Pricing = require("../models/pricing");
const Transaction = require("../models/transaction");


async function updateTransactions(){
  const company = await Company.findOne({
    status: "active",
    verified: true,
    ownership: true
  });

  const pricing = await Pricing.findOne({_id: company.tier});


  const transactions = await Transaction.find({
    enterprise: {$ne: null},
    company: null
  }).lean();

  for await(let transaction of transactions){
    const commissionAmount = parseFloat((transaction.amount * pricing.transactionCost) / 100);

    let updateData = {
      company: company._id,
      commissionPercent: pricing.transactionCost,
      commissionAmount,
      amountWOcommision: transaction.amount - commissionAmount
    }

    const updatedTransaction = await Transaction.updateOne({_id: transaction._id},{
      $set: updateData
    });

    console.log(updatedTransaction);
  }

}

updateTransactions();
