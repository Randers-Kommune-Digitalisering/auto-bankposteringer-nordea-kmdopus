const Node = {
  "id": "7f607bfbdd2aae54",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "ada765780fa31438",
  "name": "Insert new account",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 475,
  "y": 300,
  "wires": [
    [
      "f40583628c60754b"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  global.set("bankAccountNames", global.get("bankAccountNames").concat(msg.payload["Navn"]))
  global.set("bankAccounts", global.get("bankAccounts").concat(msg.payload["IBAN"]))
  global.set("statusAccounts", global.get("statusAccounts").concat(msg.payload["Statuskonto"]))
  global.set("intermediateAccounts", global.get("intermediateAccounts").concat(msg.payload["Mellemregningskonto"]))
  
  return msg;
}

module.exports = Node;