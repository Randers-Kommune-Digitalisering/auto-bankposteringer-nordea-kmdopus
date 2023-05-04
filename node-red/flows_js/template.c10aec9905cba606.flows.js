const Node = {
  "id": "c10aec9905cba606",
  "type": "template",
  "z": "0bc16db685bd2e6a",
  "name": "JS",
  "field": "payload.javascript",
  "fieldType": "msg",
  "format": "javascript",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 510,
  "y": 180,
  "wires": [
    [
      "ab3c382d844a0976"
    ]
  ],
  "_order": 69
}

Node.template = `
//
// HTTP Request
//

// Function to send encrypted data to backend
// This function will automatically retrieve missing public key before sending data

async function encryptedPostRequest(request, data)
{
  // If there is no public key, retrieve it
  await
  getPublicKeyAsync()
  .catch(error => console.log("Error importing public key: " + error))

  // Encrypt data
  .then(publicKey => encryptDataAsync(publicKey, data))
  .catch(error => console.log("Error encrypting data: " + error))
  
  // Send encrypted data to backend
  .then(encryptedData => postRequestAsync(request, encryptedData))
  .catch(error => console.log("HTTP post error: " + error))
                        
  // Handle HTTP response
  .then(response => handleResponseDefault(response));
  
}

// Post request async - not encrypted, for requests containing data use encryptedPostRequest instead

async function postRequestAsync(request, data = {})
{
  const response = await fetch("/_request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "request": request,
      "data": data
    })
  });

  const responseObj = await response.json();
  return responseObj;
}

// Handle HTTP response
// Handle default

function handleResponseDefault(responseObj)
{
  console.log(responseObj.request + ": " + responseObj.response);
}

//
// Crypto
//

var _publicKey = null;

// Import

async function getPublicKeyAsync(forceImport = false)
{
  const importedKey = 
  // Request public key if missing
  (_publicKey == null || _publicKey == undefined || forceImport) ?
  
  await
    // Get public key (HTTP request)
    postRequestAsync("getPublicKey")
    .catch(error => console.log("HTTP getPublicKey request error: " + error))

    // Get the PEM string from the response variable in HTTP response object
    .then(response => response.response)

    // Import key from PEM string
    .then(response => importKeyAsync(response))
    .catch(error => console.log("Import key error: " + error))

    // Set and return public key as cryptoKey object
    .then(keyObject =>
    {
      _publicKey = keyObject;
      return keyObject;
    })

    // If key already exists, return it instead
    : _publicKey;

    return importedKey;

}

// Function for importing key and converting to cryptoKey object - Do not call this function directly, use importPublicKeyAsync();

async function importKeyAsync(pemKey)
{
  // Fetch the ArrayBuffer of the key
  const keyString = pemKey
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\\n/g, "");
  const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0)).buffer;

  //const response = await fetch(pemKey); 
  //const keyBuffer = await response.arrayBuffer();

  // Import the key using the Web Crypto API
  const crypto = window.crypto.subtle;
  const importedKey = await crypto.importKey(
    "spki",
    keyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["encrypt"]
  );

  return importedKey;
}

// Encrypt

async function encryptDataAsync(publicKey, data)
{
  if (publicKey == null || publicKey == undefined)
  {
    console.log("Attempted to encrypt data but public key was null or undefined");
    return;
  }
  
  // Convert the data to a Uint8Array
  const dataString = JSON.stringify(data);
  const dataBuffer = new TextEncoder().encode(dataString);

  // Encrypt the data using the public key
  const crypto = window.crypto.subtle;
  const encryptedData = await crypto.encrypt(
    {
      name: "RSA-OAEP"
    },
    publicKey,
    dataBuffer
  );

  // Return the encrypted data as a base64-encoded string
  const base64String = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
  return base64String;
}





//
// Start

encryptedPostRequest("uploadData", "Her er en tekst-streng med æ ø og å");
encryptedPostRequest("uploadData", {
  "object": {
    "list": [
      12, 45, 12, 31
    ],
    "status": "ok"
  }
});
`

module.exports = Node;