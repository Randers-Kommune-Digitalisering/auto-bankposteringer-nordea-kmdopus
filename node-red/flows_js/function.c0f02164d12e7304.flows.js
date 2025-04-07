const Node = {
  "id": "c0f02164d12e7304",
  "type": "function",
  "z": "62eaf4407ee85a3a",
  "g": "be3c4fb5b3ea916b",
  "name": "Build account selector",
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
      "bb11954f600ef730"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const bankAccountIndex = global.get("transactions").accountStep;
  const bankAccounts = global.get("masterData").bankAccounts;
  let transactionsObj = global.get("transactions");
  let selectedAccount = {};
  
  // Check if the bank account index is within bounds
  if (bankAccountIndex >= 0 && bankAccountIndex < bankAccounts.length) {
      selectedAccount = bankAccounts[bankAccountIndex];
  } else {
      node.error('Invalid bank account index. Account step is larger than the size of array for bank accounts');
  }
  
  transactionsObj.selectedAccount = selectedAccount
  global.set("transactions", transactionsObj);
  
  return msg;
}

module.exports = Node;