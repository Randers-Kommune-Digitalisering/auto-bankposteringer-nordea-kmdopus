const Node = {
  "id": "9b45047f897779f2",
  "type": "function",
  "z": "257592181f6612d1",
  "name": "Generér dato",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 290,
  "y": 620,
  "wires": [
    [
      "d7b492e605d8917b"
    ]
  ],
  "_order": 108
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const date = new Date();
  const formattedDate = date.toUTCString();
  
  msg.headers['x-nordea-originating-date'] = formattedDate;
  
  return msg;
}

module.exports = Node;