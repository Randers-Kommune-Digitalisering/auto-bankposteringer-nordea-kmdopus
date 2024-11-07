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
      "to": "$globalContext(\"transactions\").{\t  \"narrative\": narrative,\t  \"counterparty_name\": counterparty_name,\t  \"amount\": amount,\t  \"balance_after_transaction\": balance_after_transaction\t}",
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
      "0103cd774294d614"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;