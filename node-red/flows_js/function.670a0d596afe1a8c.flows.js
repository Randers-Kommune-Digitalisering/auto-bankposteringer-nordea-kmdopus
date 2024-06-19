const Node = {
  "id": "670a0d596afe1a8c",
  "type": "function",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "Build account pointer",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 325,
  "y": 280,
  "wires": [
    [
      "da13a3395ded5e11"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  var bankAccountIndex = global.get('account_step');
  var bankAccounts = global.get('bankkonti');
  
  // Check if the bank account index is within bounds
  if (bankAccountIndex >= 0 && bankAccountIndex < bankAccounts.length) {
      flow.set('selected_bank_account', bankAccounts[bankAccountIndex]);
  } else {
      node.error('Invalid bank account index. Account step is larger than the size of array for bank accounts');
  }
  
  return msg;
}

module.exports = Node;