const Node = {
  "id": "1a7164ddb57e522c",
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
  "y": 760,
  "wires": [
    [
      "16f8bc62b7d1492d",
      "408772ba21691c92"
    ]
  ],
  "_order": 156
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  const verify = crypto.createVerify('SHA256');
  verify.write(msg.payload.norm_str);
  verify.end();
  msg.payload.verify = verify.verify(msg.payload.publicKey, msg.payload.sign, 'base64');
  
  return msg;
}

module.exports = Node;