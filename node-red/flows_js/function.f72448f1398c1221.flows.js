const Node = {
  "id": "f72448f1398c1221",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "1c9d2e5a1088096c",
  "name": "Format",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 215,
  "y": 300,
  "wires": [
    [
      "e647e7e80e1b8c83"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erpFileHeaders = flow.get("erpFileHeaders");
  
  flow.set("erpFileHeaders", erpFileHeaders.join(', '));    
  
  return msg;
}

module.exports = Node;