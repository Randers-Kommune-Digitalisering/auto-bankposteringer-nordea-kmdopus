const Node = {
  "id": "ab88255f27cac7d8",
  "type": "function",
  "z": "47254dd1b3ed3b06",
  "g": "1e97f626957f10f8",
  "name": "Insert all",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 215,
  "y": 640,
  "wires": [
    [
      "7779661b32cae958"
    ]
  ],
  "icon": "font-awesome/fa-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const configsObj = global.get("configs");
  const masterDataObj = global.get("masterData");
  
  let data = (configsObj && configsObj.initialData && configsObj.initialData.rules)
      ? configsObj.initialData.rules
      : masterDataObj.rules;
  
  if (Array.isArray(data) && data.length > 0) {
      // Get the keys from the first object to use as column names
      let columns = Object.keys(data[0]);
  
      // Map over the array to generate values strings
      let rows = data.map(item => {
          let values = columns.map(col => {
              let value = item[col];
              if (value === null) {
                  return 'NULL';
              } else if (typeof value === 'string') {
                  return `'${value.replace(/'/g, "''")}'`;
              } else if (typeof value === 'boolean') {
                  return value ? 'TRUE' : 'FALSE';
              } else {
                  return value;
              }
          });
          return `(${values.join(', ')})`;
      });
  
      let sqlQuery = `INSERT INTO accountingRules (${columns.join(', ')}) VALUES ${rows.join(', ')};`;
      msg.sql = sqlQuery;
      
  }
  
  return msg;
  
}

module.exports = Node;