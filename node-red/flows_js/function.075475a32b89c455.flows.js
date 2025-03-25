const Node = {
  "id": "075475a32b89c455",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "202a6b173abfc606",
  "name": "Manual posting",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 715,
  "y": 60,
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
  
  
  function generatePostings(statusAccount, landingAccount, statusDebetOrCredit, landingDebetOrCredit, text, amount, psp, cpr) {
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
              psp: psp,
              debetOrCredit: landingDebetOrCredit,
              amount: amount,
              text: text,
              cpr: cpr
          }
      )
  }
  
  function processPosting(transaction) {
      let absoluteAmount = Math.abs(parseFloat(transaction.amount));
      let cleanedAmount = absoluteAmount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      transaction.amount = cleanedAmount;
      let statusDebetOrCredit = transaction.amount > 0 ? "Debet" : "Kredit";
      let landingDebetOrCredit = statusDebetOrCredit === "Debet" ? "Kredit" : "Debet";
      let relatedAccount = masterDataObj.bankAccounts.find(account => account.bankAccount === transaction.bankAccount);
      let statusAccount = relatedAccount.intermediateAccount
  
      generatePostings(statusAccount, transaction.Artskonto, statusDebetOrCredit, landingDebetOrCredit, transaction.Posteringstekst, cleanedAmount, transaction.PSP, transaction.cpr);
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