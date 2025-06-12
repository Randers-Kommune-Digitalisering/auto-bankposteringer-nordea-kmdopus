const Node = {
  "id": "90568743a2ccc4bd",
  "type": "function",
  "z": "47254dd1b3ed3b06",
  "g": "bae1c13f6f716fe4",
  "name": "Insert",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "dayjs",
      "module": "dayjs"
    }
  ],
  "x": 115,
  "y": 860,
  "wires": [
    [
      "ef5df748b7523f13"
    ]
  ],
  "icon": "font-awesome/fa-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, dayjs) {
  let transactionsObj = global.get("transactions");
  const data = transactionsObj.addUnmatched;
  
  let sqlQuery = data.map(transaction => {
      let transactionID = `'${transaction.transaction_id.replace(/'/g, "''")}'`;
      let sender = transaction.counterparty_name ? `'${transaction.counterparty_name.replace(/'/g, "''")}'` : 'NULL';
      let reference = transaction.narrative ? `'${transaction.narrative.replace(/'/g, "''")}'` : 'NULL';
      let typeDescription = transaction.type_description ? `'${transaction.type_description.replace(/'/g, "''")}'` : 'NULL';
      let bankAccount = `'${transaction.relatedAccount.bankAccount.replace(/'/g, "''")}'`;
      let amount = `'${transaction.amount.replace(/'/g, "''")}'`;
      let bookingDate = transaction.booking_date ? `'${transaction.booking_date.replace(/'/g, "''")}'` : 'NULL';
      let direction = transaction.direction ? `'${transaction.direction.replace(/'/g, "''")}'` : 'NULL';
  
      return `(${transactionID}, ${sender}, ${reference}, ${typeDescription}, ${bankAccount}, ${amount}, ${direction}, ${bookingDate})`;
  }).join(",\n");
  
  msg.sql = `INSERT INTO transactionsWithNoMatch (transactionID, sender, reference, typeDescription, bankAccount, amount, direction, bookingDate) 
              VALUES ${sqlQuery};`;
  
  transactionsObj.addUnmatched = [];
  global.set("transactions", transactionsObj);
  
  return msg;
}

module.exports = Node;