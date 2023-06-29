const Node = {
  "id": "e307a6d6dad909ec",
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
  "y": 260,
  "wires": [
    [
      "be395768d27f7967",
      "9461cdfea6fb1576"
    ]
  ],
  "_order": 140
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  const verify = crypto.createVerify('SHA256');
  verify.write(msg.payload.norm_str);
  verify.end();
  msg.payload.verify = verify.verify(msg.payload.publicKey, msg.payload.sign, 'base64');
  
  return msg;
}

module.exports = Node;