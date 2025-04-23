const Node = {
  "id": "0dce993c4dd47043",
  "type": "function",
  "z": "2380efc0fb66c87e",
  "g": "73b9b3deaf04ef3b",
  "name": "Build account selector",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 205,
  "y": 460,
  "wires": [
    [
      "e16b8ce01e871a6f"
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