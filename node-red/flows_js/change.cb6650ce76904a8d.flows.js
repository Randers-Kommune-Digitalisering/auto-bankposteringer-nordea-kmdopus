const Node = {
  "id": "cb6650ce76904a8d",
  "type": "change",
  "z": "0715142e73ad87d8",
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