const Node = {
  "id": "2eb27ff524e9b6b4",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
  "g": "09ae44d941f2b3ed",
  "name": "Convert to XML compliance (test)",
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
  "x": 465,
  "y": 220,
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
  const prodEnv = "T02";
  const dataProviderId = global.get("configs").ftp.dataProviderId;
  const dataProviderIdCode = "797";
  const filename = `ZFIR_KMD_Opus_Posteringer_IND_${dataProviderIdCode}_${dataProviderId}_${date}_${time}.xml`;
  const bankingDate = date.replace(/-/g, "");
  
  let lineCounter = 0;
  let debetSum = parseFloat(0);
  let kreditSum = parseFloat(0);
  
  // Konverter ERP-data array til objekter baseret på headers
  const dataArray = flow.get("erpArray");
  const headersString = flow.get("erpFileHeaders");
  const headersArray = headersString.split(", ");
  const erpObject = dataArray.map((item) => {
      return headersArray.reduce((obj, header, index) => {
          obj[header] = item[index];
          return obj;
      }, {});
  });
  
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
  
          let psp = posting['PSP-element'] ? "XG-9999999990-00001" : undefined;
          let artskonto = String(posting['Artskonto'])
          artskonto = artskonto.charAt(0) === "9" ? "90515060" : "29505050";
  
          let line = {
              DEB_CRED_IND: posting['Debet/kredit'].charAt(0),
              AMT_DOCCUR: amountPrefixed.toFixed(2),
              ITEM_TEXT: posting['Tekst'],
              GL_ACCOUNT: artskonto,
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