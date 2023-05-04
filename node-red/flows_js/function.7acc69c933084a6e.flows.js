const Node = {
  "id": "7acc69c933084a6e",
  "type": "function",
  "z": "8983772ca1c7d013",
  "name": "Set Signature",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 340,
  "y": 320,
  "wires": [
    [
      "718e1576ed7ad36b"
    ]
  ],
  "_order": 24
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const keyId = msg.headers.Signature.keyId;
  const algorithm = msg.headers.Signature.algorithm;
  const signature_headers = JSON.parse(msg.headers.Signature.headers);
  const signature = msg.headers.Signature.signature;
  
  msg.headers.Signature = `keyId="${keyId}",algorithm="${algorithm}",headers="${signature_headers}",signature="${signature}"`;
  
  return msg;
}

module.exports = Node;