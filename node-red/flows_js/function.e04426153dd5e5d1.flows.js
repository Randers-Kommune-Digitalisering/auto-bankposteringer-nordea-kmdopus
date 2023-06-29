const Node = {
  "id": "e04426153dd5e5d1",
  "type": "function",
  "z": "e37c26303529a6e8",
  "name": "Verify",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "crypto",
      "module": "crypto"
    }
  ],
  "x": 510,
  "y": 1200,
  "wires": [
    [
      "31df55b797a54abf"
    ]
  ],
  "_order": 157
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  const verify = crypto.createVerify('SHA256');
  verify.write(msg.payload.norm_str);
  verify.end();
  msg.payload.verify = verify.verify(msg.payload.publicKey, msg.payload.sign, 'base64');
  
  return msg;
}

module.exports = Node;