const Node = {
  "id": "7934c39968338f4d",
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
  "y": 280,
  "wires": [
    [
      "21fbcf4a40ba942d"
    ]
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  msg.filename = "/data/output/test.txt";
  return msg;
}

module.exports = Node;