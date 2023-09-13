const Node = {
  "id": "14ecbe68b9c7d5cb",
  "type": "template",
  "z": "3ba6bac1c411ace6",
  "g": "a72cb7bc6d1977da",
  "name": "HTML",
  "field": "payload",
  "fieldType": "msg",
  "format": "html",
  "syntax": "mustache",
  "template": "",
  "x": 390,
  "y": 140,
  "wires": [
    [
      "c6d1705c23bbcb66"
    ]
  ],
  "_order": 140
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