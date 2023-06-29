const Node = {
  "id": "e3bc033c77a282ba",
  "type": "function",
  "z": "e37c26303529a6e8",
  "name": "Lav normalized string",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 560,
  "y": 580,
  "wires": [
    [
      "da9b19575a4a50df"
    ]
  ],
  "_order": 116
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