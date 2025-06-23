const Node = {
  "id": "34aed80f407f8789",
  "type": "function",
  "z": "0a57a34536934723",
  "g": "a40dda636245513b",
  "name": "Trim keys",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 245,
  "y": 500,
  "wires": [
    [
      "db053a3a7abc90db"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let obj = msg.payload; // ét objekt med evt. nøgler med mellemrum
  let trimmed = {};
  for (let key in obj) {
      trimmed[key.trim()] = obj[key];
  }
  msg.payload = trimmed;
  return msg;
}

module.exports = Node;