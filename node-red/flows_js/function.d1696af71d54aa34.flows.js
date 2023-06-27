const Node = {
  "id": "d1696af71d54aa34",
  "type": "function",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
  "name": "Save token and access id",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1390,
  "y": 420,
  "wires": [
    [
      "cc8fcb22263bb704"
    ]
  ],
  "_order": 22
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  var jsonData = msg.payload;
  global.set("client_token", jsonData.response.client_token);
  global.set("access_id", jsonData.response.access_id);
  
  return msg;
}

module.exports = Node;