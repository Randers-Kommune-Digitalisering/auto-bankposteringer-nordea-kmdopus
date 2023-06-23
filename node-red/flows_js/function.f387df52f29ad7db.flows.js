const Node = {
  "id": "f387df52f29ad7db",
  "type": "function",
  "z": "8983772ca1c7d013",
  "name": "Generér dato",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 380,
  "y": 580,
  "wires": [
    [
      "5293eaa99a9d9c16"
    ]
  ],
  "_order": 24
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const date = new Date();
  const formattedDate = date.toUTCString();
  
  msg.headers['x-nordea-originating-date'] = formattedDate;
  
  return msg;
}

module.exports = Node;