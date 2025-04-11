const Node = {
  "id": "075475a32b89c455",
  "type": "function",
  "z": "8c354b8d2ca56b7b",
  "g": "202a6b173abfc606",
  "name": "Manual posting",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 155,
  "y": 880,
  "wires": [
    [
      "c49c5be7601cebc5"
    ]
  ],
  "icon": "font-awesome/fa-handshake-o",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erpObj = global.get("erp") || {};
  let transactionsObj = global.get("transactions");
  const masterDataObj = global.get("masterData");
  let postings = [];
  const transactions = transactionsObj.manual;
  const statusAccount = global.get("masterData").bankAccounts;
  
  
  function generatePostings(statusAccount, landingAccount, statusDebetOrCredit, landingDebetOrCredit, text, amount, landingAccountSecondary, cpr) {
      postings.push(
          {
              account: statusAccount,
              debetOrCredit: statusDebetOrCredit,
              amount: amount,
              text: text
          }
      )
      postings.push(
          {
              account: landingAccount,
              accountSecondary: landingAccountSecondary,
              debetOrCredit: landingDebetOrCredit,
              amount: amount,
              text: text,
              cpr: cpr
          }
      )
  }
  
  function processPosting(transaction) {
      const absoluteAmount = Math.abs(parseFloat(transaction.amount));
      const cleanedAmount = absoluteAmount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      const statusDebetOrCredit = transaction.amount > 0 ? "Debet" : "Kredit";
      const landingDebetOrCredit = statusDebetOrCredit === "Debet" ? "Kredit" : "Debet";
      const relatedAccount = masterDataObj.bankAccounts.find(account => account.bankAccount === transaction.bankAccount);
      transaction.amount = cleanedAmount;
  
      generatePostings(relatedAccount.intermediateAccount, transaction.account, statusDebetOrCredit, landingDebetOrCredit, transaction.text, cleanedAmount, transaction.accountSecondary, transaction.cpr);
  }
  
  if (transactions) {
      transactions.forEach(transaction => {
          processPosting(transaction);
      });
  }
  
  erpObj.postings = postings;
  global.set("erp", erpObj);
  
  transactionsObj.manual = []
  global.set("transactions", transactionsObj);
  
  return msg;
}

module.exports = Node;