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
  "x": 395,
  "y": 620,
  "wires": [
    [
      "b3b1b0fc24ded8c9"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let accountStep = global.get("accountStep");
  let accountLength = global.get("bankAccounts").length;
  
  if (accountStep + 1 !== accountLength) {
      global.set("accountStep", accountStep += 1);
  } else {
      // When there are no more accounts to check
      global.set("accountStep", 0);
  }
  
  return msg;
}

module.exports = Node;