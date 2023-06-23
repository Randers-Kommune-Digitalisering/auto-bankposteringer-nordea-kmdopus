const Node = {
  "id": "d46c63e1d4119363",
  "type": "function",
  "z": "aff40520a8419466",
  "name": "Transform Data",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 300,
  "y": 40,
  "wires": [
    [
      "328085be39dc6983"
    ]
  ],
  "_order": 72
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  var transactions = msg.payload;
  
  for(var i = 0; i < transactions.length; i++) {
      // Apply your rules here and modify each transaction object
      // Example rule - Rename the 'currency' key to 'Currency'
      transactions[i].Currency = transactions[i].currency;
      delete transactions[i].currency;
  }
  
  msg.payload = transactions;
  return msg;
}

module.exports = Node;