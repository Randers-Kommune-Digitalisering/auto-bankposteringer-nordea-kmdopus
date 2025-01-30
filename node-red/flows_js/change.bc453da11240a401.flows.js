const Node = {
  "id": "bc453da11240a401",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "b8fbf4f960a90422",
  "name": "Format payload and set filename",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$globalContext(\"transactions\").{\t  \"Reference\": narrative,\t  \"Afsender\": counterparty_name,\t  \"Beløb\": $string(amount).$replace(/\\./, ','),\t  \"Løbende_saldo\": $string(balance_after_transaction).$replace(/\\./, ',')\t}",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "filename",
      "pt": "msg",
      "to": "\"/data/afstemning/\" & $globalContext(\"dateOfOrigin\") & \".csv\"",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 465,
  "y": 280,
  "wires": [
    [
      "0103cd774294d614",
      "ea287866b36b42fd"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;