const Node = {
  "id": "0e0b554fa13cdf0a",
  "type": "template",
  "z": "8983772ca1c7d013",
  "name": "Set Signature headers",
  "field": "headers.Signature.headers",
  "fieldType": "msg",
  "format": "json",
  "syntax": "mustache",
  "template": "",
  "output": "json",
  "x": 580,
  "y": 440,
  "wires": [
    [
      "d83ce521db62b543"
    ]
  ],
  "_order": 27
}

Node.template = `
{
    "GET": "https://api.nordeaopenbanking.com/corporate/premium/v4/accounts/DK5036579260-USD/transactions",
    "X-Nordea-Originating-Host": "{{msg.headers['X-Nordea-Originating-Date']}}",
    "X-Nordea-Originating-Date": "{{msg.headers['X-Nordea-Originating-Date']}}"
}
`

module.exports = Node;