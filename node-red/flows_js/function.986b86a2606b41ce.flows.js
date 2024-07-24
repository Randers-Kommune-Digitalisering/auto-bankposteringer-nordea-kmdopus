const Node = {
  "id": "986b86a2606b41ce",
  "type": "function",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "Merge pages",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 585,
  "y": 300,
  "wires": [
    [
      "f2e76e0f25073c0c"
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