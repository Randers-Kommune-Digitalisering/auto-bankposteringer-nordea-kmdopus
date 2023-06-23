const Node = {
  "id": "568774a15c7eb8d8",
  "type": "function",
  "z": "b2c910a3562c542e",
  "name": "Lav normalized string",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 540,
  "y": 80,
  "wires": [
    [
      "a592f8bba67125c8",
      "12bc8e8aefd490c9"
    ]
  ],
  "_order": 56
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const requestTarget = msg.req.method.toLowerCase() + ' ' + msg.req.url_path;
  const originatingHost = msg.headers['x-nordea-originating-host'];
  const originatingDate = msg.headers['x-nordea-originating-date'];
  
  msg.payload = `(request-target): ${requestTarget}\n` +
      `x-nordea-originating-host: ${originatingHost}\n` +
      `x-nordea-originating-date: ${originatingDate}`;
  
  return msg;
}

module.exports = Node;