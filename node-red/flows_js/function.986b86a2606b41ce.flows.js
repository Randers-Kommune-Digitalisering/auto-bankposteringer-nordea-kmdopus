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
  "x": 945,
  "y": 280,
  "wires": [
    [
      "f2e76e0f25073c0c"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let transactions = flow.get("transactions");
  let add_transactions = flow.get("add_transactions");
  
  // Ensure transactions is an array
  transactions = Array.isArray(transactions) ? transactions : [];
  
  // Concatenate add_transactions to transactions
  transactions = transactions.concat(add_transactions);
  
  // Update the flow variable with the modified array
  flow.set("transactions", transactions);
  flow.set("add_transactions", {});
  
  return msg;
}

module.exports = Node;