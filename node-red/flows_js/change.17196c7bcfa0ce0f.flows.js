const Node = {
  "id": "17196c7bcfa0ce0f",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "4efd7754a85e8488",
  "name": "Angiv navne på datagrupperinger",
  "rules": [
    {
      "t": "set",
      "p": "configs.names.accountingRules",
      "pt": "global",
      "to": "accountingRules",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.names.bankAccounts",
      "pt": "global",
      "to": "bankAccounts",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.names.masterData",
      "pt": "global",
      "to": "masterData",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 200,
  "y": 240,
  "wires": [
    [
      "eaccc75c590b488b"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;