const Node = {
  "id": "40f90ab745f25c39",
  "type": "function",
  "z": "8983772ca1c7d013",
  "name": "Save exchange code",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1440,
  "y": 220,
  "wires": [
    [
      "ea7e7a38266e9a0e"
    ]
  ],
  "_order": 37
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  var jsonData = msg.payload;
  global.set("exchange_code", jsonData.response.code);
  
  return msg;
}

module.exports = Node;