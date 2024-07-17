const Node = {
  "id": "296418615162d50e",
  "type": "function",
  "z": "9b998b2e60b3c784",
  "name": "Parse JSON",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1150,
  "y": 320,
  "wires": [
    [
      "91b06b6df33983e7"
    ]
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  for (let index = 0; index < msg.payload.length; index++) {
      
      const element = msg.payload[index];
      const elementId = element.id;
      msg.payload[index] = JSON.parse(element.data);
      msg.payload[index].id = elementId;
  
  }
  return msg;
}

module.exports = Node;