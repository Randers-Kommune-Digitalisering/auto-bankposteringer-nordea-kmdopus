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
  "x": 845,
  "y": 280,
  "wires": [
    [
      "47554be7fa0c6e02",
      "78ddcf765998b0c2"
    ]
  ],
  "icon": "font-awesome/fa-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = global.get("transactionsWithNoMatch");
  
  // Get the keys from the first object to use as column names
  let columns = Object.keys(data);
  
  // Map over the array to generate values strings
  let values = columns.map(col => {
      let value = data[col];
      if (value === null) {
          return 'NULL';
      } else if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`;
      } else if (typeof value === 'boolean') {
          return value ? 'TRUE' : 'FALSE';
      } else {
          return value;
      }
  });
  
  let sqlQuery = `INSERT INTO transactionsWithNoMatch (${columns.join(', ')}) VALUES (${values.join(', ')});`;
  msg.sql = sqlQuery;
  
  global.set("transactionsWithNoMatch", [])
  
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