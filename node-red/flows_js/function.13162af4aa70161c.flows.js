const Node = {
  "id": "13162af4aa70161c",
  "type": "function",
  "z": "257592181f6612d1",
  "name": "Generér dato",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 270,
  "y": 1480,
  "wires": [
    [
      "6a1c39ae2620001d"
    ]
  ],
  "_order": 194
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const date = new Date();
  const formattedDate = date.toUTCString();
  
  msg.headers['x-nordea-originating-date'] = formattedDate;
  
  return msg;
}

module.exports = Node;