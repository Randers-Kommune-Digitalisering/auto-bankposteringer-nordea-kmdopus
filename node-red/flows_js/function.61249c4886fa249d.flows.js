const Node = {
  "id": "61249c4886fa249d",
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
  "y": 1060,
  "wires": [
    [
      "0da7be8f0bab134a"
    ]
  ],
  "_order": 147
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const date = new Date();
  const formattedDate = date.toUTCString();
  
  msg.headers['x-nordea-originating-date'] = formattedDate;
  
  return msg;
}

module.exports = Node;