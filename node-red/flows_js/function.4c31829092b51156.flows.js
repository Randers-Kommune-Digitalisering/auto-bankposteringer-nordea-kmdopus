const Node = {
  "id": "4c31829092b51156",
  "type": "function",
  "z": "74de194f4f0868a4",
  "g": "eda37766d19f5c20",
  "name": "Posteringstekst variationer",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 1425,
  "y": 280,
  "wires": [
    [
      "6eb1c87e92a7c8d4"
    ]
  ],
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let array = [];
  let value = "";
  let label = "";
  const selectedRule = global.get("selectedRule");
  const posteringstekst = selectedRule.Posteringstekst;
  
  switch (posteringstekst) {
      case "Tekst fra bank":
          value = 0;
          label = "Reference";
          break;
      case "Advis fra bank":
          value = 1;
          label = "Advis";
          break;
      case "Afsender fra bank":
          value = 2;
          label = "Afsender";
          break;
      default:
          value = 3;
          label = "Egen tekst";
  }
  
  array.push({ value, label });
  
  msg.ui_update.options = array;
  
  return msg;
}

module.exports = Node;