const Node = {
  "id": "05bfc10ff33378e7",
  "type": "function",
  "z": "257592181f6612d1",
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
      "f2e3185e8befc260",
      "f0fdbfe6feecb12a"
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