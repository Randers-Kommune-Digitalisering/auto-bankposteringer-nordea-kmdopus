const Node = {
  "id": "b8e0c0b11374e782",
  "type": "change",
  "z": "6a990ac4b4acd1b6",
  "g": "5e223995674c8ee6",
  "name": "Error msg construction",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "{    \"Message\": \"Failed to connect to MySQL\",    \"Error\": msg.error,    \"Timestamp\": $now() }",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 195,
  "y": 220,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;