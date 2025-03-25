const Node = {
  "id": "a445693334ae4264",
  "type": "function",
  "z": "8c354b8d2ca56b7b",
  "g": "dc3f1bccec7ebeb1",
  "name": "accountStep += 1 (= 0 if no more accounts)",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 295,
  "y": 360,
  "wires": [
    [
      "b3b1b0fc24ded8c9"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let transactionsObj = global.get("transactions");
  let accountStep = transactionsObj.accountStep;
  let accountLength = global.get("masterData").bankAccounts.length;
  
  if (accountStep + 1 !== accountLength) {
      accountStep += 1;
  } else {
      // When there are no more accounts to check
      accountStep = 0;
  }
  
  transactionsObj.accountStep = accountStep;
  global.set("transactions", transactionsObj);
  
  return msg;
}

module.exports = Node;