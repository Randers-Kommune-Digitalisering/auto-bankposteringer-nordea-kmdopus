const Node = {
  "id": "5eafe719993174ce",
  "type": "function",
  "z": "a1dc9966e881ac6b",
  "g": "1d18d99feaaca4c4",
  "name": "Format date + set vars",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 645,
  "y": 620,
  "wires": [
    [
      "92d167152b47a4bc"
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