const Node = {
  "id": "6cf9b0e082c708d9",
  "type": "function",
  "z": "a1dc9966e881ac6b",
  "g": "24481f222bcf4517",
  "name": "Insert all",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 215,
  "y": 620,
  "wires": [
    [
      "bd072c6cb7f37b8c"
    ]
  ],
  "icon": "font-awesome/fa-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = global.get("configs").initialData ? global.get("configs").initialData.admSysData : global.get("masterData").admSysData;
  let formattedData = [];
  
  formattedData.push(data);
  data = formattedData
  
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
  
      let sqlQuery = `INSERT INTO admSysData (${columns.join(', ')}) VALUES ${rows.join(', ')};`;
      msg.sql = sqlQuery;
  
  }
  
  return msg;
}

module.exports = Node;