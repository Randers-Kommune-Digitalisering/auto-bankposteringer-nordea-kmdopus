const Node = {
  "id": "5dccac8a2a767f25",
  "type": "function",
  "z": "f91accb007eed9a2",
  "g": "6055094b02013d9b",
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
      "81b76fd2118c4795"
    ]
  ],
  "icon": "font-awesome/fa-question",
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