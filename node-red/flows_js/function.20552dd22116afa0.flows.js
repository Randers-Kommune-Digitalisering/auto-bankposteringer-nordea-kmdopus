const Node = {
  "id": "20552dd22116afa0",
  "type": "function",
  "z": "e37c26303529a6e8",
  "name": "Set Signature (header only)",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 580,
  "y": 820,
  "wires": [
    [
      "c82c5f62228321a8",
      "9a933d1570c9cbc3"
    ]
  ],
  "_order": 124
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