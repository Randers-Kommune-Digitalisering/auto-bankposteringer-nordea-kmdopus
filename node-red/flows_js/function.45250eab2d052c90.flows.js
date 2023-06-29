const Node = {
  "id": "45250eab2d052c90",
  "type": "function",
  "z": "e37c26303529a6e8",
  "name": "Set Signature (header only)",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 560,
  "y": 1680,
  "wires": [
    [
      "0b86135e788bd7d8",
      "59713c23eb9178a8"
    ]
  ],
  "_order": 171
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const keyId = msg.headers['x-ibm-client-id'];
  const algorithm = 'rsa-sha256';
  const signatureHeaders = '(request-target) x-nordea-originating-host x-nordea-originating-date';
  const signature = msg.payload.sign;
  
  msg.headers.signature = `keyId="${keyId}", algorithm="${algorithm}", headers="${signatureHeaders}", signature="${signature}"`;
  
  return msg;
}

module.exports = Node;