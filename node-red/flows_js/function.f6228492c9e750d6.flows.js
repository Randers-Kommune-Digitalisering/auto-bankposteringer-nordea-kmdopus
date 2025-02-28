const Node = {
  "id": "f6228492c9e750d6",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "6c0b1c62a8bd2bbc",
  "name": "Format",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 665,
  "y": 140,
  "wires": [
    [
      "bc39db2b4eed507a"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erp = global.get("erp");
  const csvHeaders = global.get("erp").csvHeaders;
  
  erp.csvHeaders = csvHeaders.join(', ');
  global.set("erp", erp);    
  
  return msg;
}

module.exports = Node;