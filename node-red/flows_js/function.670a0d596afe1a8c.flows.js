const Node = {
  "id": "670a0d596afe1a8c",
  "type": "function",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "Build account selector",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 595,
  "y": 260,
  "wires": [
    [
      "da13a3395ded5e11"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  var bankAccountIndex = global.get('accountStep');
  var bankAccounts = global.get('bankAccounts');
  
  // Check if the bank account index is within bounds
  if (bankAccountIndex >= 0 && bankAccountIndex < bankAccounts.length) {
      flow.set('selectedBankAccount', bankAccounts[bankAccountIndex]);
  } else {
      node.error('Invalid bank account index. Account step is larger than the size of array for bank accounts');
  }
  
  return msg;
}

module.exports = Node;