const Node = {
  "id": "ae33256ab3f888ba",
  "type": "function",
  "z": "b2c910a3562c542e",
  "name": "Generate crypto key object",
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
  "x": 560,
  "y": 200,
  "wires": [
    [
      "048959f4a1ad4c54"
    ]
  ],
  "_order": 93
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  // Generate an asymmetric key pair
  
  const privateKeyObject = crypto.createPrivateKey({
      key: msg.privateKey,
  });
  
  // Set flow variables
  
  flow.set("privateKey", privateKeyObject);
  
  return msg;
}

module.exports = Node;