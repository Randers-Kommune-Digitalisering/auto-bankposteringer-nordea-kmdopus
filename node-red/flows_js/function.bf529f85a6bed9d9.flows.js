const Node = {
  "id": "bf529f85a6bed9d9",
  "type": "function",
  "z": "92c28da6a66fdcb3",
  "g": "883c8c287020e842",
  "name": "Insert all",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 350,
  "y": 560,
  "wires": [
    [
      "19a84ff81cf94db2"
    ]
  ],
  "icon": "font-awesome/fa-search-plus"
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = global.get("configs").initialData ? global.get("configs").initialData.masterData : global.get("masterData");
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
  
      let sqlQuery = `INSERT INTO masterData (${columns.join(', ')}) VALUES ${rows.join(', ')};`;
      msg.sql = sqlQuery;
  
  }
  
  return msg;
}

module.exports = Node;