const Node = {
  "id": "ea684b9a8c7bd154",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "1e97f626957f10f8",
  "name": "Autoincrement all ruleIDs",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 640,
  "wires": [
    [
      "05348ae43a149fd7"
    ]
  ],
  "icon": "font-awesome/fa-sort-numeric-asc",
  "l": false
}

Node.template = `
UPDATE accountingRules
JOIN (
    SELECT ruleID, ROW_NUMBER() OVER (ORDER BY ruleID) AS new_id
    FROM accountingRules
) AS numbered
ON accountingRules.ruleID = numbered.ruleID
SET accountingRules.ruleID = numbered.new_id;
`

module.exports = Node;