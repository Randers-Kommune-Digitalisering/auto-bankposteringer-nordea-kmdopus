const Node = {
  "id": "0f270ee74c3d1aa2",
  "type": "change",
  "z": "0715142e73ad87d8",
  "name": "Set retry config",
  "rules": [
    {
      "t": "set",
      "p": "config",
      "pt": "msg",
      "to": "config ? config : {}",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "config.retryAttempts",
      "pt": "msg",
      "to": "config.retryAttempts? config.retryAttempts + 1 : 0",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 255,
  "y": 120,
  "wires": [
    [
      "0c570ad7e258b9ea"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;