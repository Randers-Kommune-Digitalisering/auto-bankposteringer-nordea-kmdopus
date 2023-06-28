const Node = {
  "id": "0da7be8f0bab134a",
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
  "y": 1020,
  "wires": [
    [
      "e88d07205354b450"
    ]
  ],
  "_order": 152
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