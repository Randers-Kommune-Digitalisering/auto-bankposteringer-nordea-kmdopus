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
  "x": 1170,
  "y": 280,
  "wires": [
    [
      "30572422ddba17b6"
    ]
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  for (let index = 0; index < msg.payload.length; index++) {
      
      const element = msg.payload[index];
      console.log("Parsing: " + element.data);
      msg.payload[index] = JSON.parse(element.data);
  
  }
  return msg;
}

module.exports = Node;