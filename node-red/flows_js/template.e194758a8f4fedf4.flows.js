const Node = {
  "id": "e194758a8f4fedf4",
  "type": "template",
  "z": "202e1898db8daa8b",
  "g": "07bb69b48ccd0bcd",
  "name": "Construct SQL Query",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 595,
  "y": 280,
  "wires": [
    [
      "b70b94090edf9472"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM
    accountingRules
WHERE
    RuleID = {{uid}}
`

module.exports = Node;