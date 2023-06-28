const Node = {
  "id": "b2666f00189aa8de",
  "type": "function",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
  "name": "Save tokens",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1350,
  "y": 540,
  "wires": [
    [
      "614955044e2dc328"
    ]
  ],
  "_order": 62
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  var jsonData = msg.payload;
  global.set("access_token", jsonData.response.access_token);
  global.set("refresh_token", jsonData.response.refresh_token);
  
  return msg;
}

module.exports = Node;