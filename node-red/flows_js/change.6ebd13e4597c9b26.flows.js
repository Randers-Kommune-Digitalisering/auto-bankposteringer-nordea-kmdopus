const Node = {
  "id": "6ebd13e4597c9b26",
  "type": "change",
  "z": "73d7d240a587aa11",
  "name": "Error msg construction",
  "rules": [
    {
      "t": "set",
      "p": "error",
      "pt": "msg",
      "to": "{\t   \"Message\": \"All retries failed for \" & tablename & \" query: \" & sql,\t   \"Rows affected\": payload.affectedRows ? payload.affectedRows : 0,\t   \"Succes\": error ~> $exists() ? false : true,\t   \"Error\": error ~> $exists() ? error.message,\t   \"Timestamp\": $now()\t}",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 355,
  "y": 100,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;