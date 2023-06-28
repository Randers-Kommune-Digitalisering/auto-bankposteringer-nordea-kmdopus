const Node = {
  "id": "4440ebb9e8e87707",
  "type": "function",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
  "name": "Save exchange code",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1380,
  "y": 500,
  "wires": [
    [
      "16f473e8921a2a39"
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