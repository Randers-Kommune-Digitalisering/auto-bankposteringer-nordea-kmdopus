const Node = {
  "id": "3eafbc8b063ba654",
  "type": "function",
  "z": "9f235917ac3d8025",
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
      "ae2aa2d093e502aa"
    ]
  ],
  "_order": 100
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