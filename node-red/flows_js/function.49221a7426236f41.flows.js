const Node = {
  "id": "49221a7426236f41",
  "type": "function",
  "z": "30ea9c666c3d34a6",
  "g": "28fa0d73a52eaed0",
  "name": "accountStep += 1 (= 0 if no more accounts)",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 295,
  "y": 600,
  "wires": [
    [
      "01b55438bc7e1174"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let transactionsObj = global.get("transactions");
  let accountStep = transactionsObj.accountStep;
  const accountLength = global.get("masterData").bankAccounts.length;
  
  if (accountStep + 1 === accountLength) {
      // When there are no more accounts to check
      accountStep = 0;
  } else {
      accountStep += 1;
  }
  
  transactionsObj.accountStep = accountStep;
  global.set("transactions", transactionsObj);
  
  return msg;
}

module.exports = Node;