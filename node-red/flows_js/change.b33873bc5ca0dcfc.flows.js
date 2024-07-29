const Node = {
  "id": "b33873bc5ca0dcfc",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "set request data",
  "rules": [
    {
      "t": "set",
      "p": "step",
      "pt": "flow",
      "to": "3",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "method",
      "pt": "flow",
      "to": "GET",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "urlParam",
      "pt": "flow",
      "to": "access_id",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 645,
  "y": 140,
  "wires": [
    [
      "01601ddb7de735ae"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;