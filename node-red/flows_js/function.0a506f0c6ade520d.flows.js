const Node = {
  "id": "0a506f0c6ade520d",
  "type": "function",
  "z": "8983772ca1c7d013",
  "name": "Normalized signing string",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 290,
  "y": 40,
  "wires": [
    [
      "066c88a78eb2895c"
    ]
  ],
  "_order": 20
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const claims = new Map();
  
  claims.set('(request-target)', 'get /corporate/v2/accounts/');
  claims.set('x-nordea-originating-host', 'open.nordea.com');
  claims.set('x-nordea-originating-date', 'Fri, 20 Sep 2019 09:41:25 GMT');
  
  class SignatureNormalizedStringBuilder {
      constructor() {
          this.builder = [];
      }
  
      append(key, value) {
          if (this.builder.length > 0) {
              this.builder.push('\n');
          }
          this.builder.push(`${key}: ${value}`);
          return this;
      }
  
      normalize() {
          const normalizedSignature = this.builder.join('');
          return normalizedSignature;
      }
  }
  
  const builder = new SignatureNormalizedStringBuilder();
  claims.forEach((value, key) => builder.append(key, value));
  const normalizedString = builder.normalize();
  console.log(`Normalized String: ${normalizedString}`);
  
  // Use `normalizedString` in your later nodes
  
}

module.exports = Node;