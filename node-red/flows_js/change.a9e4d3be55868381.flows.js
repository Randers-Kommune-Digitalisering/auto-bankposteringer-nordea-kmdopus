const Node = {
  "id": "a9e4d3be55868381",
  "type": "change",
  "z": "55e8960ea895cf83",
  "g": "30db9c49e9f6227d",
  "name": "RULE TEMPLATE",
  "rules": [
    {
      "t": "set",
      "p": "rules",
      "pt": "msg",
      "to": "[\t    {\t        \"name\": \"Check integer\",\t        \"operator\": \"==\",\t        \"value\": 2,\t        \"type\": \"number\",\t        \"description\": \"The integer should be set to 2, use this rule to check if this is true.\",\t        \"error\": \"The variable 'integer' does not follow the set rule\"\t    },\t    {\t        \"name\": \"Check string\",\t        \"operator\": \"contains\",\t        \"value\": \"world\",\t        \"description\": \"The string should be set to 'Hello World', use this rule to check if this is true.\"\t    },\t    {\t        \"name\": \"Check boolean\",\t        \"operator\": \"==\",\t        \"value\": true,\t        \"type\": \"bool\",\t        \"description\": \"The boolean should be set to true, use this rule to check if this is the case.\"\t    },\t    {\t        \"name\": \"Check empty string\",\t        \"operator\": \"==\",\t        \"value\": \"\",\t        \"description\": \"This string should be empty (but not null), use this rule to check if this is true.\"\t    },\t    {\t        \"name\": \"Regex\",\t        \"operator\": \"regex\",\t        \"value\": \"[0-9]\",\t        \"description\": \"Regex test - matches with any integers\"\t    }\t]",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 270,
  "y": 180,
  "wires": [
    [
      "2be72271d7bdeecd"
    ]
  ],
  "_order": 22
}

module.exports = Node;