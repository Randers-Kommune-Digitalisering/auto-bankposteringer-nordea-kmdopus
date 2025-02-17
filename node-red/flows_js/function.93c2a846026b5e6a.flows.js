const Node = {
  "id": "93c2a846026b5e6a",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "d": true,
  "g": "09ae44d941f2b3ed",
  "name": "Convert to XML compliance",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "csv",
      "module": "csv-parser"
    },
    {
      "var": "xml2js",
      "module": "xml2js"
    }
  ],
  "x": 345,
  "y": 300,
  "wires": [
    [
      "ae9ec673824528b2"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv, xml2js) {
  const date = global.get("dateOfOrigin");
  const time = global.get("timeOfOrigin");
  const compCode = global.get("configs").ftp.compCode;
  const prodEnv = global.get("configs").ftp.prodEnv;
  const dataProviderId = global.get("configs").ftp.dataProviderId;
  const dataProviderIdCode = global.get("configs").ftp.dataProviderIdCode;
  const filename = global.get("configs").ftp.filename;
  const bankingDate = date.replace(/-/g, "");
  
  // Konverter ERP-data array til objekter baseret på headers
  const dataArray = msg.payload;
  const headersString = flow.get("erpFileHeaders");
  const headersArray = headersString.split(", ");
  const erpObject = dataArray.map((item) => {
      return headersArray.reduce((obj, header, index) => {
          obj[header] = item[index];
          return obj;
      }, {});
  });
  
  let lineCounter = 0;
  let debetSum = 0;
  let kreditSum = 0;
  
  function makeId(length) {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
  }
  
  const docId = makeId(16);
  
  // Create a single LINES object with multiple LINE elements inside
  const LINES = {
      LINE: erpObject.map((posting, index) => {
          lineCounter++;
  
          let amount = posting['Beløb'].replace(',', '.');
          amount = parseFloat(amount);
          let amountPrefixed = posting['Debet/kredit'] === "Debet" ? amount : amount * -1;
          
          let psp = posting['PSP-element'] || undefined;
  
          let line = {
              DEB_CRED_IND: posting['Debet/kredit'].charAt(0),
              AMT_DOCCUR: amountPrefixed.toFixed(2),
              ITEM_TEXT: posting['Tekst'],
              GL_ACCOUNT: posting['Artskonto'],
              WBS_ELEMENT: psp,
              REF_KEY_3: String(lineCounter),
              ZZCSYSIDN: dataProviderId
          };
  
          // Remove undefined values
          Object.keys(line).forEach(key => line[key] === undefined && delete line[key]);
  
          // Update debit and credit sums
          if (posting['Debet/kredit'] === 'Debet') {
              debetSum += amount;
          } else if (posting['Debet/kredit'] === 'Kredit') {
              kreditSum += amount;
          }
  
          return line;
      })
  };
  
  const CONTROL_FIELDS = {
      SENDERID: prodEnv + "CLNT" + dataProviderIdCode,
      RECEIVER: prodEnv + "CLNT" + dataProviderIdCode,
      FILE_NAME: filename,
      SEND_DATE: date,
      SEND_TIME: time
  };
  
  const HEADER = {
      'NO_DOC_POSITION': String(lineCounter),
      'BALANCE_DEBET': debetSum.toFixed(2),
      'BALANCE_CREDIT': '-' + kreditSum.toFixed(2),
      'MUNICIPALITY': dataProviderIdCode,
      'COMP_CODE': compCode,
      'DOC_DATE': bankingDate,
      'PSTNG_DATE': bankingDate,
      'RECEIV_DOC': docId,
      'HEADER_TXT': dataProviderId,
      'XREF1_HD': dataProviderId
  };
  
  // Byg hele objektet, og tilføj namespace-attributten
  const xmlObject = {
      'n1:FinancePostingRequest': {
          $: { 'xmlns:n1': 'http://kmd.dk/fir/posting/external' },
          CONTROL_FIELDS: CONTROL_FIELDS,
          POSTING_DOCUMENT: {
              HEADER: HEADER,
              LINES: LINES
          }
      }
  };
  
  // Brug xml2js til at bygge XML-strengen
  const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true }
  });
  
  const xml = builder.buildObject(xmlObject);
  
  msg.payload = xml;
  global.set("xmlObject", xml);
  
  return msg;
  
}

module.exports = Node;