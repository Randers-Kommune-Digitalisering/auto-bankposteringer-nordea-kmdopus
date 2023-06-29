const Node = {
  "id": "78c0a54f169e2555",
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
  "y": 760,
  "wires": [
    [
      "20552dd22116afa0",
      "1eed4790b99b1ee4"
    ]
  ],
  "_order": 125
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  const verify = crypto.createVerify('SHA256');
  verify.write(msg.payload.norm_str);
  verify.end();
  msg.payload.verify = verify.verify(msg.payload.publicKey, msg.payload.sign, 'base64');
  
  return msg;
}

module.exports = Node;