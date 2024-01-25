const Node = {
  "id": "cfaa480faab5c0b7",
  "type": "switch",
  "z": "5a8afc5afb89916f",
  "g": "f51cc7b4f0bee577",
  "name": "Hvis auth udløbet",
  "property": "list_http_code",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "401",
      "vt": "num"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 1,
  "x": 270,
  "y": 100,
  "wires": [
    [
      "0df363702703d9c9"
    ]
  ],
  "_order": 190
}

module.exports = Node;