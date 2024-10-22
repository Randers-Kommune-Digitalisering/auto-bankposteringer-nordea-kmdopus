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
  "x": 595,
  "y": 320,
  "wires": [
    [
      "bb11954f600ef730"
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
      flow.set('selectedBankAccount', bankAccounts[bankAccountIndex].bankAccount);
  } else {
      node.error('Invalid bank account index. Account step is larger than the size of array for bank accounts');
  }
  
  return msg;
}

module.exports = Node;