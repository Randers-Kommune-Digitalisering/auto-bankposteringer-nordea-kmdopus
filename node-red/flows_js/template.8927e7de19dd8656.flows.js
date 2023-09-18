const Node = {
  "id": "8927e7de19dd8656",
  "type": "template",
  "z": "d64ae6beab0c9367",
  "name": "HTML",
  "field": "payload",
  "fieldType": "msg",
  "format": "html",
  "syntax": "mustache",
  "template": "",
  "x": 550,
  "y": 220,
  "wires": [
    [
      "39a21475e869a261"
    ]
  ],
  "_order": 166
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
    <main class="ruleBox">
      <h1>Konteringsregler</h1>
      <main class="ruleWrapper ruleWrapper"></main>
      <footer>
        <button class="addRuleButton" onclick="generateNewRow()">Tilføj regel</button>
      </footer>
    </main>
  
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