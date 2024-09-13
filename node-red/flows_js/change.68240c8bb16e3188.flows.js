const Node = {
  "id": "68240c8bb16e3188",
  "type": "change",
  "z": "431f85f122b4636d",
  "name": "Set all names",
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
  "x": 160,
  "y": 80,
  "wires": [
    [
      "737da55ebea83c21",
      "a0732a0c8e4fd114",
      "e349260c2e91fc0a"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;