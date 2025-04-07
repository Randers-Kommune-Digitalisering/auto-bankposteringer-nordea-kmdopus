const Node = {
  "id": "6631af66c4a9aa4f",
  "type": "function",
  "z": "62eaf4407ee85a3a",
  "g": "3bc210a9c1e58a78",
  "name": "Script",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "moment",
      "module": "moment"
    },
    {
      "var": "forge",
      "module": "node-forge"
    },
    {
      "var": "CryptoJS",
      "module": "crypto-js"
    }
  ],
  "x": 105,
  "y": 60,
  "wires": [
    [
      "90beb0a595b2a03e"
    ]
  ],
  "icon": "font-awesome/fa-gears",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, moment, forge, CryptoJS) {
  const contentType = flow.get("content-type");
  const data = flow.get("data");
  const method = flow.get("method").toLowerCase();
  const url = flow.get("url");
  const clientId = global.get("configs").banking.id;
  const host = global.get("configs").banking.domainShort;
  msg.headers = {};
  
  // Digest Calculation
  
  function resolveRequestBody() {
      if (contentType === "application/x-www-form-urlencoded") {
          const data_sub = Object.keys(data)
              .sort(function (a, b) {
                  if (a < b) { return -1; }
                  if (a > b) { return 1; }
                  return 0;
              })
              .map(key => key + "=" + data[key])
              .join('&');
          return data_sub;
      } else if (contentType === "application/json") {
          return JSON.stringify(data);
      } else if (Object.entries(data).length === 0 && data.constructor === Object) {
          return "";
      }
  
      return data.toString();
  }
  
  function calculateDigest() {
      const requestData = resolveRequestBody();
      const sha256digest = CryptoJS.SHA256(requestData);
      const base64sha256 = CryptoJS.enc.Base64.stringify(sha256digest);
      const calculatedDigest = 'sha-256=' + base64sha256;
  
      flow.set("Digest", calculatedDigest);
      msg.headers['Digest'] = calculatedDigest;
      
      return calculatedDigest;
  }
  
  // Signature Calculation
  
  const requestWithoutContentHeaders = "(request-target) x-nordea-originating-host x-nordea-originating-date";
  const requestWithContentHeaders = "(request-target) x-nordea-originating-host x-nordea-originating-date content-type digest";
  
  function getSignatureBaseOnRequest() {
      const path = constructPath();
      const date = moment().utc().format("ddd, DD MMM YYYY HH:mm:ss") + " GMT";
      const headers = method === "post" || method === "put" || method === "patch" ? requestWithContentHeaders : requestWithoutContentHeaders;
  
      flow.set("url", `https://${host}${path}`);
  
      let normalizedString = `(request-target): ${method} ${path}\n` +
          `x-nordea-originating-host: ${host}\n` +
          `x-nordea-originating-date: ${date}`;
  
      if (headers === requestWithContentHeaders) {
          const contentType = flow.get("content-type");
          const digest = calculateDigest();
          normalizedString += `\ncontent-type: ${contentType}\ndigest: ${digest}`;
      }
  
      return { host, path, method, date, headers, normalizedString };
  }
  
  function constructPath() {
      const path = flow.get("path") || '';
      const urlParam = flow.get("urlParam") || '';
      const pathSuffix = flow.get("pathSuffix") || '';
      const queryParams = [];
      const queryParam1 = flow.get("queryParam1");
      const queryParam2 = flow.get("queryParam2");
      const continuationKey = global.get("transactions").continuationKey;
  
      if (queryParam1) {
          queryParams.push(`from_date=${queryParam1}`);
      }
      if (queryParam2) {
          queryParams.push(`to_date=${queryParam2}`);
      }
      if (continuationKey) {
          queryParams.push(`continuation_key=${continuationKey}`);
      }
  
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      if (!urlParam) {
          return path;
      } else {
          return `${path}/${urlParam}${pathSuffix}${queryString}`;
      }
      
  }
  
  function getPrivateKey() {
      let eidasPrivateKey = global.get("configs").banking.eidas.privateKey;
  
      if (!eidasPrivateKey.includes('PRIVATE KEY')) {
          eidasPrivateKey = "-----BEGIN RSA PRIVATE KEY-----\n" + eidasPrivateKey + "\n" + "-----END RSA PRIVATE KEY-----";
      }
  
      return forge.pki.privateKeyFromPem(eidasPrivateKey);
  }
  
  function encryptSignature(normalizedSignatureString) {
      const messageDigest = forge.md.sha256.create();
      messageDigest.update(normalizedSignatureString, "utf8");
      return forge.util.encode64(getPrivateKey().sign(messageDigest));
  }
  
  const signature = getSignatureBaseOnRequest();
  const encryptedSignature = encryptSignature(signature.normalizedString);
  const signatureHeader = `keyId="${clientId}",algorithm="rsa-sha256",headers="${signature.headers}",signature="${encryptedSignature}"`;
  
  flow.set("Signature", signatureHeader);
  flow.set("X-Nordea-Originating-Host", signature.host);
  flow.set("X-Nordea-Originating-Date", signature.date);
  flow.set("time_of_origin", signature.date)
  
  msg.headers['X-Nordea-Originating-Host'] = signature.host;
  msg.headers['X-Nordea-Originating-Date'] = signature.date;
  msg.headers['X-IBM-Client-Id'] = clientId;
  msg.headers['X-IBM-Client-Secret'] = global.get("configs").banking.secret;
  msg.headers['Signature'] = signatureHeader;
  
  if (url) msg.url = flow.get("url");
  if (data) msg.payload = resolveRequestBody();
  
  switch (method) {
      case "get":
          msg.headers['Authorization'] = "Bearer " + global.get("auth").token;
          break;
      case "put":
          msg.headers['Authorization'] = "Bearer " + global.get("auth").token;
          msg.headers['Content-Type'] = contentType;
          break;
      case "post":
          msg.headers['Content-Type'] = contentType;
          break;
      }
      
  return msg;
}

module.exports = Node;