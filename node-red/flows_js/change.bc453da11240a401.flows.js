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
      "to": "$globalContext(\"transactions\").{\t  \"Bogføringsdato\": $string(booking_date).$replace(/-/, ''),\t  \"Beløb\": $string(amount).$replace(/\\./, ','),\t  \"Posteringstype\": type_description,\t  \"Reference\": narrative,\t  \"Løbende_saldo\": $string(balance_after_transaction).$replace(/\\./, ','),\t  \"Statuskonto\": $string(account.statusAccount)\t}",
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
  "x": 345,
  "y": 200,
  "wires": [
    [
      "0103cd774294d614"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;