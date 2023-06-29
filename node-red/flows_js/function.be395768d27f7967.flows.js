const Node = {
  "id": "be395768d27f7967",
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
  "y": 320,
  "wires": [
    [
      "5825ef8c7af3218f",
      "9a16fffc3bca566d"
    ]
  ],
  "_order": 140
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