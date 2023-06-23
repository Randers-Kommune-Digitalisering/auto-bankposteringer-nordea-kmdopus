const Node = {
  "id": "0829fdf9db94ed23",
  "type": "function",
  "z": "257592181f6612d1",
  "name": "Lav normalized string",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 560,
  "y": 80,
  "wires": [
    [
      "fc46da1ec87b6916"
    ]
  ],
  "_order": 130
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const requestTarget = msg.payload.req.method.toLowerCase() + ' ' + msg.payload.req.url_path;
  const originatingHost = msg.headers['x-nordea-originating-host'];
  const originatingDate = msg.headers['x-nordea-originating-date'];
  
  msg.payload.norm_str = `(request-target): ${requestTarget}\n` +
      `x-nordea-originating-host: ${originatingHost}\n` +
      `x-nordea-originating-date: ${originatingDate}`;
  
  return msg;
}

module.exports = Node;