const Node = {
  "id": "d9447d0752f06d96",
  "type": "function",
  "z": "8c354b8d2ca56b7b",
  "g": "9f0acbcfa0581c4a",
  "name": "Merge pages and add account",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 105,
  "y": 360,
  "wires": [
    [
      "467fddf2a063a289"
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
  
      // Merge new transactions with existing ones
      transactions = transactions.concat(addTransactions);
  
      // Update the flow variable with the modified array
      transactionsObj.list = transactions;
      global.set("transactions", transactionsObj);
  
  } else {
      node.error("No transactions to add");
  }
  
  return msg;
}

module.exports = Node;