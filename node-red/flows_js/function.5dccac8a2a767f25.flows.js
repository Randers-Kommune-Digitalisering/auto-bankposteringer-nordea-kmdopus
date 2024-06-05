const Node = {
  "id": "5dccac8a2a767f25",
  "type": "function",
  "z": "f91accb007eed9a2",
  "g": "6055094b02013d9b",
  "name": "account_step += 1",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 555,
  "y": 60,
  "wires": [
    [
      "81b76fd2118c4795"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let account_step = global.get("account_step");
  
  if (account_step + 1 === global.get("bankkonti").len) {
      global.set("account_step", 0);
  } else {
      global.set("account_step", account_step += 1);
  }
  
  return msg;
}

module.exports = Node;