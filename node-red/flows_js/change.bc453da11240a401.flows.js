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
      "to": "$globalContext(\"transactions\").list.{\t  \"Bogføringsdato\": $string(booking_date).$replace(/-/, ''),\t  \"Beløb\": amount,\t  \"Posteringstype\": type_description,\t  \"Reference\": narrative,\t  \"Løbende_saldo\": $string(balance_after_transaction).$replace(/\\./, ','),\t  \"Statuskonto\": $string(account.statusAccount)\t}",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "filename",
      "pt": "msg",
      "to": "\"/data/afstemning/\" & $globalContext(\"dates\").date & \".csv\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "Bogføringsdato, Beløb, Posteringstype, Reference, Løbende_saldo, Statuskonto",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 105,
  "y": 180,
  "wires": [
    [
      "0103cd774294d614"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;