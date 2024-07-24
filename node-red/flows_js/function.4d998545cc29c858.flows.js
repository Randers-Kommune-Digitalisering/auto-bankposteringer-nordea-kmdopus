const Node = {
  "id": "4d998545cc29c858",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "4571d34d4f5bd1cf",
  "name": "Update new rule",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 635,
  "y": 780,
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