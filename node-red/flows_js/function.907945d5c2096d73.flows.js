const Node = {
  "id": "907945d5c2096d73",
  "type": "function",
  "z": "47254dd1b3ed3b06",
  "g": "30b2fd7f3bc3b0a9",
  "name": "Format date + set vars",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 645,
  "y": 860,
  "wires": [
    [
      "265fb2fc1879d7fb"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const runs = global.get("runs");
  
  msg.payload = msg.payload.map(item => {
      const date = new Date(item.originDate);
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = date.getUTCFullYear();
      return {
          ...item,
          originDate: `${dd}-${mm}-${yyyy}`
      };
  });
  
  runs.list = msg.payload;
  global.set("runs", runs);
  
  return msg;
}

module.exports = Node;