const Node = {
  "id": "10e9f7a1ecaf5cc5",
  "type": "function",
  "z": "0a57a34536934723",
  "g": "b9fd86e23e147a4d",
  "name": "Trim keys & save",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 735,
  "y": 260,
  "wires": [
    [
      "a979f58bc601a803"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let arr = msg.req.files[0].buffer; // forventer et array af objekter
  let masterObj = global.get("masterData");
  
  let trimmedArr = arr.map(rule => {
      let trimmedRule = {};
      for (let key in rule) {
          trimmedRule[key.trim()] = rule[key];
      }
      return trimmedRule;
  });
  
  masterObj.rules = trimmedArr;
  global.set("masterData", masterObj);
  
  return msg;
}

module.exports = Node;