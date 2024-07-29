const Node = {
  "id": "9ff1ca6d9e9c830f",
  "type": "change",
  "z": "9b998b2e60b3c784",
  "g": "de4b4d666626903f",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "admName",
      "pt": "global",
      "to": "Jan Mølbæk",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "admEmail",
      "pt": "global",
      "to": "jan.molbaek@randers.dk",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "admID",
      "pt": "global",
      "to": "1000000001",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "statusAccounts",
      "pt": "global",
      "to": "[\"90540000\",\"90541000\"]",
      "tot": "json",
      "dc": true
    },
    {
      "t": "set",
      "p": "bankAccountNames",
      "pt": "global",
      "to": "[\"Hovedkonto\",\"Debitorkonto\"]",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "bankAccounts",
      "pt": "global",
      "to": "[\t   \"DK20005908764988\"&\"-DKK\",\t   \"DK20009035615315\"&\"-DKK\"\t]",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "intermediateAccounts",
      "pt": "global",
      "to": "[\"95990009\",\"95991009\"]",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "erpSystem",
      "pt": "global",
      "to": "KMD",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 335,
  "y": 580,
  "wires": [
    [
      "7f454f55bfaa9637"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;