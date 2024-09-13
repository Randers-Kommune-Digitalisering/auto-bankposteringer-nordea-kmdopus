const Node = {
  "id": "14a5089d7e6463aa",
  "type": "function",
  "z": "32cf2bec698ca424",
  "g": "977c991daa71653f",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 155,
  "y": 860,
  "wires": [
    [
      "df098b3e580b3ec0",
      "0234ab6f381bf917"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = msg.payload;
  let name = global.get("configs").names.accountingRules;
  
  // Get the keys from the first object to use as column names
  let columns = Object.keys(data);
  
  // Map over the array to generate values strings
  let values = columns.map(col => {
      let value = data[col];
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
  
  
  let sqlQuery = `INSERT INTO ${name} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
  msg.sql = sqlQuery;
  
  return msg;
}

module.exports = Node;