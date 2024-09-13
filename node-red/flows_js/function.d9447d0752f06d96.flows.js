const Node = {
  "id": "d9447d0752f06d96",
  "type": "function",
  "z": "62eaf4407ee85a3a",
  "g": "be3c4fb5b3ea916b",
  "name": "Merge pages",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 745,
  "y": 300,
  "wires": [
    [
      "467fddf2a063a289"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let transactions = global.get("transactions") ? global.get("transactions") : [];
  let addTransactions = global.get("addTransactions");
  
  // Ensure transactions is an array
  transactions = Array.isArray(transactions) ? transactions : [];
  
  // Concatenate add_transactions to transactions
  transactions = transactions.concat(addTransactions);
  
  // Update the flow variable with the modified array
  global.set("transactions", transactions);
  global.set("addTransactions", {});
  
  return msg;
}

module.exports = Node;