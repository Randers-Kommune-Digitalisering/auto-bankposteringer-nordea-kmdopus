const Node = {
  "id": "f4d4d34cf69fcc8b",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "35de195cfdfd282b",
  "name": "Update new rule",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 745,
  "y": 1720,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-repeat",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let key = msg.topic;
  let value = msg.payload; 
  let newRule = global.get("newRule");
  
  newRule[key] = value;
  
  global.set("newRule", newRule);
  
  return msg;
}

module.exports = Node;