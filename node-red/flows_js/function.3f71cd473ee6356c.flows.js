const Node = {
  "id": "3f71cd473ee6356c",
  "type": "function",
  "z": "a1dc9966e881ac6b",
  "g": "704dc03174bd43e2",
  "name": "Insert",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 805,
  "y": 280,
  "wires": [
    [
      "47554be7fa0c6e02"
    ]
  ],
  "icon": "font-awesome/fa-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let transactionsObj = global.get("transactions");
  let data = transactionsObj.unmatched;
  
  let sqlQuery = data.map(transaction => {
      let transactionID = `'${transaction.transaction_id.replace(/'/g, "''")}'`;
      let counterpartyName = transaction.counterparty_name ? `'${transaction.counterparty_name.replace(/'/g, "''")}'` : 'NULL';
      let narrative = transaction.narrative ? `'${transaction.narrative.replace(/'/g, "''")}'` : 'NULL';
      let bankAccount = `'${transaction.account.bankAccount.replace(/'/g, "''")}'`;
      let amount = `'${transaction.amount.replace(/'/g, "''")}'`;
      let bookingDate = transaction.booking_date ? `'${transaction.booking_date}'` : 'NULL';
  
      return `(${transactionID}, ${counterpartyName}, ${narrative}, ${bankAccount}, ${amount}, ${bookingDate})`;
  }).join(",\n");
  
  msg.sql = `INSERT INTO transactionsWithNoMatch (transactionID, counterpartyName, narrative, bankAccount, amount, bookingDate) 
              VALUES ${sqlQuery};`;
  
  transactionsObj.unmatched = [];
  global.set("transactions", transactionsObj);
  
  return msg;
  
  
  // let data = global.get("transactionsWithNoMatch");
  
  // let sqlQueries = data.map(transaction => {
  //     let transactionID = transaction.transaction_id ? `'${transaction.transaction_id.replace(/'/g, "''")}'` : 'NULL';
  //     let counterpartyName = transaction.counterparty_account ? `'${transaction.counterparty_account.replace(/'/g, "''")}'` : 'NULL';
  //     let narrative = transaction.narrative ? `'${transaction.narrative.replace(/'/g, "''")}'` : 'NULL';
  //     let bankAccount = transaction.account?.bankAccount ? `'${transaction.account.bankAccount.replace(/'/g, "''")}'` : 'NULL';
  //     let amount = transaction.amount ? parseFloat(transaction.amount.replace(/\./g, '').replace(',', '.')) : 'NULL';
  //     let bookingDate = transaction.booking_date ? `'${transaction.booking_date}'` : 'NULL';
  
  //     return `INSERT INTO transactionsWithNoMatch (transactionID, counterpartyName, narrative, bankAccount, amount, bookingDate) 
  //             VALUES (${transactionID}, ${counterpartyName}, ${narrative}, ${bankAccount}, ${amount}, ${bookingDate});`;
  // });
  
  // msg.sql = sqlQueries.join("\n");
  
  // global.set("transactionsWithNoMatch", []);
  
  // return msg;
  
}

module.exports = Node;