const Node = {
  "id": "26e7a1f9f88df3ee",
  "type": "http request",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "Initiate Auth",
  "method": "POST",
  "ret": "obj",
  "paytoqs": "ignore",
  "url": "https://api.nordeaopenbanking.com/corporate/v2/authorize",
  "tls": "",
  "persist": false,
  "proxy": "",
  "insecureHTTPParser": false,
  "authType": "",
  "senderr": false,
  "headers": [],
  "x": 970,
  "y": 60,
  "wires": [
    [
      "624df728fc1278f1"
    ]
  ],
  "_order": 124
}

module.exports = Node;