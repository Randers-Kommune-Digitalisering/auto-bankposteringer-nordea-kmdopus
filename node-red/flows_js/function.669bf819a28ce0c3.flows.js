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
  "x": 1450,
  "y": 200,
  "wires": [
    [
      "145f6f129e7190d7"
    ]
  ],
  "_order": 154
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, moment, uuid, forge, CryptoJS) {
  const requestId = uuid.v4();
  const today = moment().format("YYYY-MM-DD");
  
  flow.set("randomUUID", requestId);
  flow.set("today", today);
  
  // Common
  function getHeaderValue(headerName) {
      const headers = flow.get("headers");
      const headerValue = headers ? headers[headerName] : undefined;
      if (headerValue === undefined) {
          throw new Error(`Required header: ${headerName} is not defined`);
      }
      return headerValue;
  }
  
  // Digest Calculation
  function resolveRequestBody() {
      const contentType = flow.get("content-type");
      const data = flow.get("data");
  
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
  
      // console.log(`Request data: ${requestData}`);
  
      const sha256digest = CryptoJS.SHA256(requestData);
      const base64sha256 = CryptoJS.enc.Base64.stringify(sha256digest);
      const calculatedDigest = 'sha-256=' + base64sha256;
  
      // console.log(`Digest header: ${calculatedDigest}`);
  
      flow.set("Digest", calculatedDigest);
      return calculatedDigest;
  }
  
  // Signature Calculation
  
  const requestWithoutContentHeaders = "(request-target) x-nordea-originating-host x-nordea-originating-date";
  const requestWithContentHeaders = "(request-target) x-nordea-originating-host x-nordea-originating-date content-type digest";
  
  function getSignatureBaseOnRequest() {
      let host = "api.nordeaopenbanking.com";
  
      let path;
      if (typeof flow.get("query_param1") !== "undefined") {
          path = flow.get("path") + "/" + flow.get("query_param") + flow.get("path_suffix") + "?from_date=" + flow.get("query_param1") + "&to_date=" + flow.get("query_param2");
      }
      else if (typeof flow.get("query_param") !== "undefined") {
          path = flow.get("path") + "/" + flow.get("query_param");
      }
      else {
          path = flow.get("path");
      }
  
      flow.set("url", host + path);
  
      const method = flow.get("method").toLowerCase();
      const date = moment().utc().format("ddd, DD MMM YYYY HH:mm:ss") + " GMT";
  
      let normalizedString =
          `(request-target): ${method} ${path}\n` +
          `x-nordea-originating-host: ${host}\n` +
          `x-nordea-originating-date: ${date}`;
  
      let headers = requestWithoutContentHeaders;
  
      if ((method === "post" || method === "put" || method === "patch") && Object.entries(flow.get("data")).length > 0) {
          const contentType = flow.get("content-type");
          const digest = calculateDigest();
          normalizedString += `\ncontent-type: ${contentType}\ndigest: ${digest}`
  
          headers = requestWithContentHeaders;
      }
      return { host, path, method, date, headers, normalizedString };
  }
  
  function encryptSignature(normalizedSignatureString) {
      const messageDigest = forge.md.sha256.create();
      messageDigest.update(normalizedSignatureString, "utf8");
      return forge.util.encode64(getPrivateKey().sign(messageDigest));
  }
  
  function getPrivateKey() {
      let eidasPrivateKey = flow.get("eidasPrivateKey");
  
      if (!eidasPrivateKey.includes('PRIVATE KEY')) {
          eidasPrivateKey = "-----BEGIN RSA PRIVATE KEY-----\n" + eidasPrivateKey + "\n" + "-----END RSA PRIVATE KEY-----";
      }
      // console.log(eidasPrivateKey);
      return forge.pki.privateKeyFromPem(eidasPrivateKey);
  }
  
  
  const clientId = flow.get("X-IBM-Client-Id");
  const signature = getSignatureBaseOnRequest();
  const encryptedSignature = encryptSignature(signature.normalizedString);
  const signatureHeader = `keyId="${clientId}",algorithm="rsa-sha256",headers="${signature.headers}",signature="${encryptedSignature}"`;
  
  // console.log(`Normalized signature string: ${signature.normalizedString}`);
  // console.log(`Signature header: ${signatureHeader}`);
  
  flow.set("Signature", signatureHeader);
  flow.set("X-Nordea-Originating-Host", signature.host);
  flow.set("X-Nordea-Originating-Date", signature.date);
  flow.set("time_of_origin", signature.date)
  
  return msg;
}

module.exports = Node;