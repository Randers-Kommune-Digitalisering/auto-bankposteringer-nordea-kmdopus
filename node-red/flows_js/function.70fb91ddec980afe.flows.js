const Node = {
  "id": "70fb91ddec980afe",
  "type": "function",
  "z": "0bc16db685bd2e6a",
  "name": "Decrypt data",
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
  "x": 710,
  "y": 480,
  "wires": [
    [
      "9c7c33c9fb8cb50e"
    ]
  ],
  "_order": 90
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  // Decrypt data using the private key
  function decryptData(privateKey, encryptedData)
  {
      const decryptedData = crypto.privateDecrypt(
          {
              key: privateKey,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: "sha256",
          },
          Buffer.from(encryptedData, "base64")
      );
      return decryptedData.toString();
  }
  
  var decryptedData = decryptData(flow.get("privateKey"), msg.payload.data);
  
  msg.payload.decryptedData = decryptedData;
  
  
  return msg;
}

module.exports = Node;