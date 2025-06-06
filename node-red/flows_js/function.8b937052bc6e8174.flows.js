const Node = {
  "id": "8b937052bc6e8174",
  "type": "function",
  "z": "47254dd1b3ed3b06",
  "g": "d185a894a0ce7b49",
  "name": "Insert",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "dayjs",
      "module": "dayjs"
    }
  ],
  "x": 215,
  "y": 1300,
  "wires": [
    [
      "daddbf0462a4aef8",
      "18311ba1ae70aa92"
    ]
  ],
  "icon": "font-awesome/fa-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, dayjs) {
  let transactionsObj = global.get("transactions");
  let masterDataObj = global.get("masterData");
  
  const transactions = transactionsObj.list || [];
  const rules = masterDataObj.rules || [];
  const existingTypes = masterDataObj.typeDescriptions || [];
  
  // Hjælpefunktion til at escape '
  function escapeSqlString(str) {
      return str.replace(/'/g, "''");
  }
  
  // Saml alle type-beskrivelser fra både transactions og rules
  const combinedDescriptions = [];
  
  // Fra transactions
  for (const item of transactions) {
      if (item.type_description) {
          combinedDescriptions.push(item.type_description.trim());
      }
  }
  
  // Fra rules
  for (const rule of rules) {
      if (rule.typeDescription) {
          combinedDescriptions.push(rule.typeDescription.trim());
      }
  }
  
  // Fjern tomme/blanke og lav case-insensitiv dubletfiltrering
  const seenLower = new Set();
  const distinctTypes = [];
  
  for (const desc of combinedDescriptions) {
      if (!desc || desc.trim() === '') continue;
  
      const lower = desc.toLowerCase();
  
      if (!seenLower.has(lower)) {
          seenLower.add(lower);
          distinctTypes.push(desc);
      }
  }
  
  // Sortér alfabetisk (dansk sortering)
  distinctTypes.sort((a, b) => a.localeCompare(b, 'da'));
  
  // Hvis vi har fundet nye værdier, brug dem — ellers brug existingTypes
  const finalTypes = distinctTypes.length > 0 ? distinctTypes : existingTypes;
  
  if (finalTypes.length > 0) {
      const valuesString = finalTypes
          .map(desc => `('${escapeSqlString(desc)}')`)
          .join(", ");
  
      msg.sql = `
          INSERT INTO typeDescriptions (typeDescriptionName) VALUES ${valuesString};
      `;
  } else {
      msg.sql = '-- Ingen type_descriptions tilgængelige';
  }
  
  return msg;
  
}

module.exports = Node;