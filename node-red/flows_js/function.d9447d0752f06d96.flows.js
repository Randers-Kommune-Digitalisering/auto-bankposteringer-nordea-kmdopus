const Node = {
  "id": "d9447d0752f06d96",
  "type": "function",
  "z": "62eaf4407ee85a3a",
  "g": "9f0acbcfa0581c4a",
  "name": "Merge pages and add account",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 115,
  "y": 640,
  "wires": [
    [
      "467fddf2a063a289"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const accountValue = global.get("bankAccounts")[global.get("accountStep")];
  let transactions = global.get("transactions") ? global.get("transactions") : [];
  let addTransactions = global.get("addTransactions");
  
  // Ensure transactions is an array
  transactions = Array.isArray(transactions) ? transactions : [];
  
  // Concatenate add_transactions to transactions
  transactions = transactions.concat(addTransactions);
  
  const updatedTransactions = transactions.map(obj => ({
      ...obj,  // Spread the existing object properties
      account: accountValue  // Add the new key-value pair
  }));
  
  // Update the flow variable with the modified array
  global.set("transactions", transactions);
  global.set("addTransactions", {});
  
  return msg;
}

module.exports = Node;