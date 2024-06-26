const Node = {
  "id": "669bf819a28ce0c3",
  "type": "function",
  "z": "37f6db37c66da295",
  "g": "e43111d88ddbb93a",
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
      "var": "uuid",
      "module": "uuid"
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
  "x": 145,
  "y": 60,
  "wires": [
    [
      "145f6f129e7190d7"
    ]
  ],
  "icon": "font-awesome/fa-gears",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, moment, uuid, forge, CryptoJS) {
  const requestId = uuid.v4();
  const today = moment().format("YYYY-MM-DD");
  
  flow.set("randomUUID", requestId);
  flow.set("today", today);
  msg.headers = {};
  
  function getHeaderValue(headerName) {
      const headers = flow.get("headers");
      const headerValue = headers ? headers[headerName] : undefined;
      if (headerValue === undefined) {
          node.error(`Required header: ${headerName} is not defined`);
      }
      return headerValue;
  }
  
  // Digest Calculation
  function resolveRequestBody() {
      const contentType = flow.get("content-type");
      const data = flow.get("data");
  
      if (contentType === "application/x-www-form-urlencoded") {
          return Object.keys(data)
              .sort()
              .map(key => `${key}=${data[key]}`)
              .join('&');
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
      const host = "open.nordea.com";
      const path = constructPath();
      const method = flow.get("method").toLowerCase();
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
      const path = flow.get("path");
      const urlParam = flow.get("urlParam") || '';
      const pathSuffix = flow.get("pathSuffix") || '';
      const queryParams = [];
      const queryParam1 = flow.get("queryParam1");
      const queryParam2 = flow.get("queryParam2");
      const continuationKey = flow.get("continuation_key");
  
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
  
  function encryptSignature(normalizedSignatureString) {
      const messageDigest = forge.md.sha256.create();
      messageDigest.update(normalizedSignatureString, "utf8");
      return forge.util.encode64(getPrivateKey().sign(messageDigest));
  }
  
  function getPrivateKey() {
      let eidasPrivateKey = env.get("EIDASPRIVATEKEY");
  
      if (!eidasPrivateKey.includes('PRIVATE KEY')) {
          eidasPrivateKey = "-----BEGIN RSA PRIVATE KEY-----\n" + eidasPrivateKey + "\n" + "-----END RSA PRIVATE KEY-----";
      }
  
      return forge.pki.privateKeyFromPem(eidasPrivateKey);
  }
  
  
  const clientId = env.get("CLIENT_ID");
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
  msg.headers['X-IBM-Client-Secret'] = env.get("CLIENT_SECRET");
  msg.headers['Signature'] = signatureHeader;
  if (flow.get("data")) msg.payload = flow.get("data");
  if (flow.get("url")) msg.url = flow.get("url");
  if (flow.get("method") == "PUT" || flow.get("method") == "GET") {
      msg.headers['Authorization'] = "Bearer " + global.get("client_token");
  }
  
  return msg;
}

module.exports = Node;