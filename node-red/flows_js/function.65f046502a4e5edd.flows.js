const Node = {
  "id": "65f046502a4e5edd",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "85a5e54522cd21cc",
  "name": "Merge pages and add account",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 225,
  "y": 460,
  "wires": [
    [
      "2a1716f1529ef50c"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const accountValue = global.get("bankAccounts")[0];
  let transactions = global.get("transactions") ? global.get("transactions") : [];
  
  // Ensure transactions is an array
  transactions = Array.isArray(transactions) ? transactions : [];
  
  const updatedTransactions = transactions.map(obj => ({
      ...obj,  // Spread the existing object properties
      account: accountValue  // Add the new key-value pair
  }));
  
  // Update the flow variable with the modified array
  global.set("transactions", updatedTransactions);
  
  return msg;
}

module.exports = Node;