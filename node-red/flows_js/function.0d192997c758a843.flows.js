const Node = {
  "id": "0d192997c758a843",
  "type": "function",
  "z": "257592181f6612d1",
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
      "729d76a5cbb0d8b3",
      "99b55dc2e2d769bd"
    ]
  ],
  "_order": 168
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