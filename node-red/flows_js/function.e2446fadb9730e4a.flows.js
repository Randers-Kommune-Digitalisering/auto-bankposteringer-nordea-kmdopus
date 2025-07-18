const Node = {
  "id": "e2446fadb9730e4a",
  "type": "function",
  "z": "47254dd1b3ed3b06",
  "g": "ed2d8f9a9a392f4a",
  "name": "Insert all",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 645,
  "y": 520,
  "wires": [
    [
      "eae56167380f371b"
    ]
  ],
  "icon": "font-awesome/fa-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const configsObj = global.get("configs");
  const masterDataObj = global.get("masterData");
  
  let data = (configsObj && configsObj.initialData && configsObj.initialData.admSysData)
      ? configsObj.initialData.admSysData
      : masterDataObj.admSysData;
  
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