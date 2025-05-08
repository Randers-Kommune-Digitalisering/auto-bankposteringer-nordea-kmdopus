const Node = {
  "id": "225810e12abada52",
  "type": "function",
  "z": "30ea9c666c3d34a6",
  "g": "25a291d67b31ccca",
  "name": "Manual posting",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 155,
  "y": 900,
  "wires": [
    [
      "c265ac1bb029ed1e"
    ]
  ],
  "icon": "font-awesome/fa-handshake-o",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const masterDataObj = global.get("masterData");
  const transactions = global.get("transactions").manual;
  let erpObj = global.get("erp") || {};
  let postings = [];
  
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
      transaction.amount = parseFloat(transaction.amount.replace('.', '').replace(',', '.'));
      const absoluteAmount = Math.abs(transaction.amount);
      const statusDebetOrCredit = transaction.amount > 0 ? "Debet" : "Kredit";
      const landingDebetOrCredit = statusDebetOrCredit === "Debet" ? "Kredit" : "Debet";
      const relatedAccount = masterDataObj.bankAccounts.find(account => account.bankAccount === transaction.bankAccount);
      transaction.amount = absoluteAmount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
      generatePostings(relatedAccount.intermediateAccount, transaction.account, statusDebetOrCredit, landingDebetOrCredit, transaction.text, transaction.amount, transaction.accountSecondary, transaction.cpr);
  }
  
  if (transactions) {
      transactions.forEach(transaction => {
          processPosting(transaction);
      });
  }
  
  erpObj.postings = postings;
  global.set("erp", erpObj);
  
  return msg;
}

module.exports = Node;