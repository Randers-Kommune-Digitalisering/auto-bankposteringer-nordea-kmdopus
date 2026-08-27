const Node = {
  "id": "841699e2bc4617ac",
  "type": "function",
  "z": "47254dd1b3ed3b06",
  "g": "2aeaecfc9bd7fe9c",
  "name": "Upsert all",
  "func": "",
  "outputs": 1,
  "timeout": "",
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 545,
  "y": 740,
  "wires": [
    [
      "3d711a7265097f9f"
    ]
  ],
  "icon": "font-awesome/fa-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const configsObj = global.get("configs");
  const masterDataObj = global.get("masterData") || {};
  
  const data = configsObj && configsObj.initialData && Array.isArray(configsObj.initialData.bankAccounts)
      ? configsObj.initialData.bankAccounts
      : masterDataObj.bankAccounts;
  
  if (!Array.isArray(data)) {
      node.error("bankAccounts data is not an array", msg);
      return null;
  }
  
  if (data.length === 0) {
      node.error("bankAccounts list cannot be empty", msg);
      return null;
  }
  
  const columns = [
      "bankAccount",
      "bankAccountName",
      "statusAccount",
      "intermediateAccount"
  ];
  
  function sqlValue(value) {
      if (value === null || value === undefined || value === "") {
          return "NULL";
      }
  
      return "'" + String(value)
          .replace(/\\/g, "\\\\")
          .replace(/'/g, "''") + "'";
  }
  
  const rows = data.map((item) => {
      if (!item || !item.bankAccount) {
          throw new Error("Every bank account must have a bankAccount value");
      }
  
      return "(" + columns.map((column) => sqlValue(item[column])).join(", ") + ")";
  });
  
  msg.sql = `
  INSERT INTO bankAccounts (${columns.join(", ")})
  VALUES ${rows.join(", ")}
  ON DUPLICATE KEY UPDATE
      bankAccountName = VALUES(bankAccountName),
      statusAccount = VALUES(statusAccount),
      intermediateAccount = VALUES(intermediateAccount);
  `;
  
  return msg;
  
}

module.exports = Node;