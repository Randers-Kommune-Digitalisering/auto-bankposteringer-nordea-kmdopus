const Node = {
  "id": "f7fbf9ba088e05e1",
  "type": "function",
  "z": "4049a8755a332ca0",
  "name": "Prepare File Write",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 330,
  "y": 340,
  "wires": [
    []
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  msg.filename = "/data/output/test.txt";
  return msg;
}

module.exports = Node;