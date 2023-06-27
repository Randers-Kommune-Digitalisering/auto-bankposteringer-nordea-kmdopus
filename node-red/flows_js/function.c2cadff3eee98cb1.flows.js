const Node = {
  "id": "c2cadff3eee98cb1",
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
  "y": 120,
  "wires": [
    [
      "0829fdf9db94ed23"
    ]
  ],
  "_order": 163
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const date = new Date();
  const formattedDate = date.toUTCString();
  
  msg.headers['x-nordea-originating-date'] = formattedDate;
  
  return msg;
}

module.exports = Node;