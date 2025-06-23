const Node = {
  "id": "842e6350d3c9262f",
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
  "y": 580,
  "wires": [
    [
      "7de4c1a43d6ebdb4"
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