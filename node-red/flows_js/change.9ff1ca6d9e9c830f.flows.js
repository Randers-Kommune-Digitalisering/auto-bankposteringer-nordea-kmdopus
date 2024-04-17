const Node = {
  "id": "9ff1ca6d9e9c830f",
  "type": "change",
  "z": "9b998b2e60b3c784",
  "g": "de4b4d666626903f",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "statuskonti",
      "pt": "global",
      "to": "[\"90540000\",\"90541000\"]",
      "tot": "json",
      "dc": true
    },
    {
      "t": "set",
      "p": "bankkonti",
      "pt": "global",
      "to": "[\t   \"DK6520005908764988\"&\"-DKK\",\t   \"DK3620009035615315\"&\"-DKK\"\t]",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "mellemregningskonti",
      "pt": "global",
      "to": "[\"95990009\",\"95991009\"]",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 205,
  "y": 340,
  "wires": [
    [
      "7f454f55bfaa9637"
    ]
  ],
  "l": false
}

module.exports = Node;