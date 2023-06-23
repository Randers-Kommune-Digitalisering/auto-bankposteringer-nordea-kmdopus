const Node = {
  "id": "b12bf8d6248b5c12",
  "type": "function",
  "z": "0bc16db685bd2e6a",
  "name": "Encrypt decrypt test",
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
  "x": 360,
  "y": 860,
  "wires": [
    [
      "1775d79a74efb84d"
    ]
  ],
  "_order": 91
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, crypto) {
  // Encrypt data using the public key
  function encryptData(publicKey, data)
  {
      const encryptedData = crypto.publicEncrypt(
          {
              key: publicKey,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: "sha256",
          },
          Buffer.from(data)
      );
      return encryptedData.toString("base64");
  }
  
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
  
  
  var startText = "Hello worldy";
  msg.payload.startText = startText;
  
  var encryptedText = encryptData(flow.get("publicKey"), startText);
  msg.payload.encryptedText = encryptedText;
  
  var decryptedText = decryptData(flow.get("privateKey"), encryptedText);
  msg.payload.decryptedText = decryptedText;
  
  
  return msg;
}

module.exports = Node;