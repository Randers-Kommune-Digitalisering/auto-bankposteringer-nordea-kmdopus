const Node = {
  "id": "ed08e76cd0ce1272",
  "type": "function",
  "z": "b2c910a3562c542e",
  "name": "Generér dato",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 270,
  "y": 120,
  "wires": [
    [
      "568774a15c7eb8d8"
    ]
  ],
  "_order": 47
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const date = new Date();
  const formattedDate = date.toUTCString();
  
  msg.headers['x-nordea-originating-date'] = formattedDate;
  
  return msg;
}

module.exports = Node;