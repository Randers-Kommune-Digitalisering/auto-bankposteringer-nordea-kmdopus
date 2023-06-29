const Node = {
  "id": "9c904a72958b5c17",
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
  "x": 490,
  "y": 1620,
  "wires": [
    [
      "45250eab2d052c90"
    ]
  ],
  "_order": 172
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  const verify = crypto.createVerify('SHA256');
  verify.write(msg.payload.norm_str);
  verify.end();
  msg.payload.verify = verify.verify(msg.payload.publicKey, msg.payload.sign, 'base64');
  
  return msg;
}

module.exports = Node;