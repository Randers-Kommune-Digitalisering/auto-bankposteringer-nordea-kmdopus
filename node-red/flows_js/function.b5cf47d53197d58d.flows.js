const Node = {
  "id": "b5cf47d53197d58d",
  "type": "function",
  "z": "8983772ca1c7d013",
  "name": "Set Signature (header only)",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 720,
  "y": 780,
  "wires": [
    [
      "9cf3689d165feb0c",
      "3b741b57f1b5bb0f"
    ]
  ],
  "_order": 31
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