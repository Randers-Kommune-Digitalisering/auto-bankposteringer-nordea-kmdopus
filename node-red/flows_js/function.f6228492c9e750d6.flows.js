const Node = {
  "id": "f6228492c9e750d6",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "6c0b1c62a8bd2bbc",
  "name": "Format",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 975,
  "y": 60,
  "wires": [
    [
      "bc39db2b4eed507a"
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