const Node = {
  "id": "048959f4a1ad4c54",
  "type": "function",
  "z": "b2c910a3562c542e",
  "name": "Kryptér payload",
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
  "x": 520,
  "y": 260,
  "wires": [
    [
      "1c1a134df7329f8b",
      "9a89d35738489a69"
    ]
  ],
  "_order": 42
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  // Encrypt data using the public key
  function encryptData(privateKey, data) {
      const encryptedData = crypto.privateEncrypt(
          {
              key: privateKey
          },
          Buffer.from(data)
      );
      return encryptedData.toString("base64");
  }
  
  var encryptedText = encryptData(flow.get("privateKey"), msg.payload);
  msg.payload = encryptedText;
  
  return msg;
}

module.exports = Node;