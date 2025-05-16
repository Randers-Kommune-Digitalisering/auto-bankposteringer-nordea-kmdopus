const Node = {
  "id": "3861adb2319cf788",
  "type": "function",
  "z": "88c6307a5ee1dd81",
  "g": "0fc5db670402470f",
  "name": "Convert to XML compliance",
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
  "x": 105,
  "y": 220,
  "wires": [
    [
      "5d472e55a89e7806"
    ]
  ],
  "icon": "font-awesome/fa-arrows",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util, dayjs) {
  const inProd = true;
  
  const xml2js = global.get("xml2js");
  const docDate = dayjs().format('YYYYMMDD');
  const docTime = dayjs().format('HHmmss');
  const bookingDate = global.get("dates").bookingDate.replace(/-/g, "");
  const docId = global.get("transactions").uid.slice(-10);
  const compCode = global.get("configs").ftp.compCode;
  const dataProviderId = global.get("configs").ftp.dataProviderId;
  const prodEnv = inProd ? global.get("configs").ftp.prodEnv : 'T02';
  const dataProviderIdCode = inProd ? global.get("configs").ftp.dataProviderIdCode : '797';
  const filename = `ZFIR_KMD_Opus_Posteringer_IND_${dataProviderIdCode}_${dataProviderId}_${docDate}_${docTime}.xml`;
  const postings = global.get("erp").postings;
  
  let lineCounter = 0;
  let debetSum = parseFloat(0);
  let creditSum = parseFloat(0);
  
  // Create a single LINES object with multiple LINE elements inside
  const LINES = { LINE: [] };
  
  for (const posting of postings) {
      lineCounter++;
  
      let amount = parseFloat(posting.amount.replace('.', '').replace(',', '.'));
      amount = parseFloat(amount);
      let amountPrefixed = posting.debetOrCredit === 'Debet' ? amount : amount * -1;
  
      let psp = posting.accountSecondary ? posting.accountSecondary : undefined;
      let artskonto = String(posting.account);
  
      if (!inProd) {
          psp = posting.accountSecondary ? 'XG-9999999990-00001' : undefined;
          artskonto = artskonto.charAt(0) === '9' ? '90515060' : '29505050';
      }
  
      let line = {
          DEB_CRED_IND: posting.debetOrCredit.charAt(0),
          AMT_DOCCUR: amountPrefixed.toFixed(2),
          ITEM_TEXT: posting.text,
          GL_ACCOUNT: artskonto,
          WBS_ELEMENT: psp,
          REF_KEY_3: String(lineCounter),
          ZZCSYSIDN: dataProviderId,
          SERV_REC_NO_CODE: posting.cpr ? '02' : undefined,
          SERV_REC_NO: posting.cpr ? posting.cpr : undefined,
          BENEFIT_VALFROM: bookingDate,
          BENEFIT_VALTO: bookingDate
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
      SENDERID: prodEnv + 'CLNT' + dataProviderIdCode,
      RECEIVER: prodEnv + 'CLNT' + dataProviderIdCode,
      FILE_NAME: filename,
      SEND_DATE: docDate,
      SEND_TIME: docTime
  };
  
  const HEADER = {
      NO_DOC_POSITION: String(lineCounter),
      BALANCE_DEBET: debetSum.toFixed(2),
      BALANCE_CREDIT: '-' + creditSum.toFixed(2),
      MUNICIPALITY: dataProviderIdCode,
      COMP_CODE: compCode,
      DOC_DATE: docDate,
      PSTNG_DATE: bookingDate,
      RECEIV_DOC: docId,
      HEADER_TXT: dataProviderId,
      XREF1_HD: dataProviderId
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
  
  msg.filename = filename;
  msg.payload = xml;
  
  return msg;
}

module.exports = Node;