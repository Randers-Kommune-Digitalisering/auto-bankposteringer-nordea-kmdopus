const Node = {
  "id": "1b50e132fe42c24c",
  "type": "function",
  "z": "8983772ca1c7d013",
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
  "x": 580,
  "y": 720,
  "wires": [
    [
      "b5cf47d53197d58d"
    ]
  ],
  "_order": 32
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  const verify = crypto.createVerify('SHA256');
  verify.write(msg.payload.norm_str);
  verify.end();
  msg.payload.verify = verify.verify(msg.payload.publicKey, msg.payload.sign, 'base64');
  
  return msg;
}

module.exports = Node;