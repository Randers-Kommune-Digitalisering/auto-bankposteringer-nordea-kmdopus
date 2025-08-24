const Node = {
  "id": "3ed886625239a5d0",
  "type": "function",
  "z": "4049a8755a332ca0",
  "name": "process.env",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "process",
      "module": "process"
    }
  ],
  "x": 410,
  "y": 80,
  "wires": [
    [
      "9ca3edbd6857853f"
    ]
  ]
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, process) {
  msg.payload = process.env
  return msg;
}

module.exports = Node;