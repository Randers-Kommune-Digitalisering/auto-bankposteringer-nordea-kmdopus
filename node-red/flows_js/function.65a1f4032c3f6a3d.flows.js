const Node = {
  "id": "65a1f4032c3f6a3d",
  "type": "function",
  "z": "8983772ca1c7d013",
  "name": "Save token and access id",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1510,
  "y": 100,
  "wires": [
    [
      "45af9632b74daefd"
    ]
  ],
  "_order": 36
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  var jsonData = msg.payload;
  flow.set("client_token", jsonData.response.client_token);
  flow.set("access_id", jsonData.response.access_id);
}

module.exports = Node;