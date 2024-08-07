const Node = {
  "id": "6cc8a13c2939103e",
  "type": "function",
  "z": "9b998b2e60b3c784",
  "g": "9e5398bb4491a461",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 515,
  "y": 600,
  "wires": [
    [
      "d22b18d6ade0c7ba"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = 
  [{
      "admEmail": "jan.molbaek@randers.dk",
      "admID": "1000000001",
      "admName": "Jan Mølbæk",
      "integrationBool": false,
      "erpSystem": "KMD Opus"
  }];
  
  let columns = Object.keys(data);
  
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
  
  } else {
      node.warn = "No data available";
  }
  
  return msg;
}

module.exports = Node;