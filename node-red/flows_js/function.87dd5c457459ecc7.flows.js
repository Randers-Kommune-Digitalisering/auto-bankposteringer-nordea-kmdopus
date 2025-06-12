const Node = {
  "id": "87dd5c457459ecc7",
  "type": "function",
  "z": "30ea9c666c3d34a6",
  "g": "c042cd94dbdb461d",
  "name": "Merge pages and add account",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 105,
  "y": 600,
  "wires": [
    [
      "fe7319571f6b8a81"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let transactionsObj = global.get("transactions");
  const accountValue = global.get("transactions").selectedAccount;
  let transactions = transactionsObj.list ? transactionsObj.list : [];
  let addTransactions = transactionsObj.add;
  
  // Ensure addTransactions is an array
  if (Array.isArray(addTransactions)) {
  
      // Add appropiate account to each transaction
      addTransactions = addTransactions.map(obj => ({
          ...obj,  // Spread the existing object properties
          relatedAccount: accountValue  // Add the new key-value pair
      }));
  
      // Add new transactions at the beginning of the list
      transactions = addTransactions.concat(transactions);
  
      // Update the flow variable with the modified array
      transactionsObj.list = transactions;
      global.set("transactions", transactionsObj);
  
  } else {
      node.warn("No transactions to add");
  }
  
  return msg;
}

module.exports = Node;