const Node = {
  "id": "d090ea5469fc5949",
  "type": "template",
  "z": "97cc6bce53027f96",
  "name": "HTML",
  "field": "payload",
  "fieldType": "msg",
  "format": "html",
  "syntax": "mustache",
  "template": "",
  "x": 1270,
  "y": 540,
  "wires": [
    [
      "f4c955396488fa27"
    ]
  ],
  "_order": 83
}

Node.template = `
<!DOCTYPE html>
<html lang="en" dir="ltr">

<head>
  <meta charset="utf-8">
  <title>Konteringsregler</title>
  <style>
    {{{payload.style}}}
  </style>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Iconscout Link For Icons -->
  <link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.0/css/line.css">
</head>

<body onload="wsConnect();" onunload="ws.disconnect();">

  <div class="ruleBox">
    <div class="header">Konteringsregler</div>
    <div class="ruleWrapper ruleWrapper_user"></div>
    <div class="ruleWrapper">
      <div>
        <button class="addRuleButton" onclick="addNewRule()">+</button>
      </div>
    </div>
  </div>

  <script>
    const _rules = {{{payload.rules}}}
  </script>
  <script>
    {{{payload.script}}}
  </script>
</body>

</html>
`

module.exports = Node;