const Node = {
  "id": "9088fd44192dd4eb",
  "type": "change",
  "z": "47254dd1b3ed3b06",
  "g": "bae1c13f6f716fe4",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$map(payload, function($v, $i, $a) {\t  $merge([\t    $v,\t    {\"amount\": $v.direction = \"outgoing\" ? \"-\" & $v.amount : $v.amount}\t  ])\t})",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "transactions.unmatched",
      "pt": "global",
      "to": "($type(payload) = \"array\") ? payload : [payload]",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 215,
  "y": 980,
  "wires": [
    [
      "5fb37e9531aa4ad9"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;