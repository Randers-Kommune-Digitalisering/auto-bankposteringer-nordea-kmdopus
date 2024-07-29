const Node = {
  "id": "bef2131d8ffb8043",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "name": "Confirm deletion payload",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1285,
  "y": 360,
  "wires": [
    [
      "da6c3f011c091d52",
      "7ec82f7ba324aa55"
    ]
  ],
  "icon": "node-red/swap.svg",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  msg.payload = {
      groups: {
          show: ["Rediger regel:Bekræft slet"],
          hide: ["Rediger regel:Indstillinger"]
      }
  };
  
  return msg;
}

module.exports = Node;