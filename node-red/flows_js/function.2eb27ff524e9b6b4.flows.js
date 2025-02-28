const Node = {
  "id": "2eb27ff524e9b6b4",
  "type": "function",
  "z": "ee0cf4ce372e2d36",
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
  "x": 105,
  "y": 120,
  "wires": [
    [
      "efe5f8ec8a33297e"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, csv, xml2js) {
  const inProd = true;
  
  const date = global.get("date");
  const bankingDate = date.replace(/-/g, "");
  const time = global.get("timeOfOrigin");
  const docId = global.get("messageIdentification");
  const compCode = global.get("configs").ftp.compCode;
  const dataProviderId = global.get("configs").ftp.dataProviderId;
  const prodEnv = inProd ? global.get("configs").ftp.prodEnv : "T02";
  const dataProviderIdCode = inProd ? global.get("configs").ftp.dataProviderIdCode : "797";
  const filename = `ZFIR_KMD_Opus_Posteringer_IND_${dataProviderIdCode}_${dataProviderId}_${date}_${time}.xml`;
  const postings = global.get("erpPostings");
  
  let lineCounter = 0;
  let debetSum = parseFloat(0);
  let creditSum = parseFloat(0);
  
  // Create a single LINES object with multiple LINE elements inside
  const LINES = { LINE: [] };
  
  for (const posting of postings) {
      lineCounter++;
  
      global.set("posting", posting);
  
      let amount = posting.amount.replace(',', '.');
      amount = parseFloat(amount);
      let amountPrefixed = posting.debetOrCredit === "Debet" ? amount : amount * -1;
  
      let psp = posting.psp ? posting.psp : undefined;
      let artskonto = String(posting.account);
  
      if (!inProd) {
          psp = posting.psp ? "XG-9999999990-00001" : undefined;
          artskonto = artskonto.charAt(0) === "9" ? "90515060" : "29505050";
      }
  
      let line = {
          DEB_CRED_IND: posting.debetOrCredit.charAt(0),
          AMT_DOCCUR: amountPrefixed.toFixed(2),
          ITEM_TEXT: posting.text,
          GL_ACCOUNT: artskonto,
          WBS_ELEMENT: psp,
          REF_KEY_3: String(lineCounter),
          ZZCSYSIDN: dataProviderId
      };
  
      // Remove undefined values
      Object.keys(line).forEach(key => line[key] === undefined && delete line[key]);
  
      // Update debit and credit sums
      if (posting.debetOrCredit === 'Debet') {
          debetSum += amount;
      } else if (posting.debetOrCredit === 'Kredit') {
          creditSum += amount;
      }
  
      // Tilføj linjen til LINES.LINE arrayet
      LINES.LINE.push(line);
  }
  
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
      'BALANCE_CREDIT': '-' + creditSum.toFixed(2),
      'MUNICIPALITY': dataProviderIdCode,
      'COMP_CODE': compCode,
      'DOC_DATE': bankingDate,
      'PSTNG_DATE': bankingDate,
      'RECEIV_DOC': docId,
      'HEADER_TXT': dataProviderId,
      'XREF1_HD': dataProviderId
  };
  
  // Byg hele objektet og tilføj namespace
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
  
  // Brug xml2js til at bygge fra jS-object til XML-streng
  const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true }
  });
  
  const xml = builder.buildObject(xmlObject);
  
  msg.filename = "/data/output/" + filename;
  msg.payload = xml;
  
  flow.set("filename", filename);
  
  return msg;
}

module.exports = Node;