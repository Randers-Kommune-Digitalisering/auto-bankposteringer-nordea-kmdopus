const Node = {
  "id": "c2fdaae0d1892d6e",
  "type": "change",
  "z": "ac21bbbed3962f80",
  "g": "af9e589c452c6701",
  "name": "Finans",
  "rules": [
    {
      "t": "set",
      "p": "configs.erp.csvHeaders",
      "pt": "global",
      "to": "ERP_FILE_HEADERS",
      "tot": "env"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 410,
  "y": 300,
  "wires": [
    [
      "c2c41f96d66d4c63"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;