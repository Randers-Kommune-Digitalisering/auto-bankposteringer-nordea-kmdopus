const Node = {
  "id": "ad9c8a6c6ee7e198",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "name": "Cancel deletion payload",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1135,
  "y": 620,
  "wires": [
    [
      "7ec82f7ba324aa55"
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