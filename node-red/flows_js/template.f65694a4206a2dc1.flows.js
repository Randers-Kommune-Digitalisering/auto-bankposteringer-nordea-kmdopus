const Node = {
  "id": "f65694a4206a2dc1",
  "type": "template",
  "z": "8983772ca1c7d013",
  "name": "Set Signature headers",
  "field": "headers.Signature.headers",
  "fieldType": "msg",
  "format": "json",
  "syntax": "mustache",
  "template": "",
  "output": "json",
  "x": 360,
  "y": 240,
  "wires": [
    [
      "57847321551d9b9f"
    ]
  ],
  "_order": 30
}

Node.template = `
{
    "GET": "https://api.nordeaopenbanking.com/corporate/premium/v4/accounts/DK5036579260-USD/transactions",
    "X-Nordea-Originating-Host": "{{msg.headers['X-Nordea-Originating-Date']}}",
    "X-Nordea-Originating-Date": "{{msg.headers['X-Nordea-Originating-Date']}}"
}
`

module.exports = Node;