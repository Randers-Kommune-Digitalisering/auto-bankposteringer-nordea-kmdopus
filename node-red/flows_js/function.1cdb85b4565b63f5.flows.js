const Node = {
  "id": "1cdb85b4565b63f5",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "name": "Options reset",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1305,
  "y": 120,
  "wires": [
    [
      "bb3c6c847747d9fc"
    ]
  ],
  "icon": "node-red/swap.svg",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  msg.payload = {
      groups: {
          show: ["Rediger regel:Indstillinger"],
          hide: ["Rediger regel:Bekræft slet"]
      }
  };
  
  return msg;
}

module.exports = Node;