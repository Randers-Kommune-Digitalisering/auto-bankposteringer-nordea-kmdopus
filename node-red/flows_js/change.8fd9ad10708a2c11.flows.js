const Node = {
  "id": "8fd9ad10708a2c11",
  "type": "change",
  "z": "88c6307a5ee1dd81",
  "g": "474faa1bf813b5a8",
  "name": "Format payload and set filename",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$globalContext(\"transactions\").list.{\t  \"Bogføringsdato\": $string(booking_date).$replace(/-/, ''),\t  \"Beløb\": amount,\t  \"Posteringstype\": type_description,\t  \"Reference\": narrative,\t  \"Løbende_saldo\": $string(balance_after_transaction).$replace(/\\./, ','),\t  \"Statuskonto\": $string(relatedAccount.statusAccount)\t}",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "filename",
      "pt": "msg",
      "to": "\"/data/afstemning/\" & $globalContext(\"dates\").bookingDate & \"_afstem.csv\"",
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
      "4406b95204f5295a"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;