const Node = {
  "id": "ec6eb0551b979f4b",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "fafde89af20cbe51",
  "name": "accountStep += 1 (= 0 if no more accounts)",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 525,
  "y": 160,
  "wires": [
    [
      "ccb74ec631aaebd6"
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