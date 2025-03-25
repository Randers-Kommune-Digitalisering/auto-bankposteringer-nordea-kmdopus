const Node = {
  "id": "da9d0b8038e2bfe1",
  "type": "function",
  "z": "8c354b8d2ca56b7b",
  "g": "202a6b173abfc606",
  "name": "Match postings with rules",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 155,
  "y": 720,
  "wires": [
    [
      "c49c5be7601cebc5"
    ]
  ],
  "icon": "font-awesome/fa-handshake-o",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let erpObj = global.get("erp") || {};
  let transactionsObj = global.get("transactions");
  let masterDataObj = global.get("masterData");
  let postings = [];
  let transactionsUnmatched = transactionsObj.addUnmatched ? transactionsObj.addUnmatched : [];
  const transactions = transactionsObj.list ? transactionsObj.list.reverse() : null;
  const transactionParameters = global.get("configs").banking.usefulParameters;   // Has to match ruleParameters length and order, can be nested array
  const accountingRules = masterDataObj.rules;
  const ruleParameters = Object.keys(accountingRules[0]).slice(0, 3);
  const date = global.get("dates").simpleDate;
  
  function extractCPRNumber(inputString) {
      const regex = /((((0[1-9]|[12][0-9]|3[01])(0[13578]|10|12)(\d{2}))|(([0][1-9]|[12][0-9]|30)(0[469]|11)(\d{2}))|((0[1-9]|1[0-9]|2[0-8])(02)(\d{2}))|((29)(02)(00))|((29)(02)([2468][048]))|((29)(02)([13579][26])))[-]*\d{4})/gm;
  
      const match = inputString.match(regex);
  
      if (match) {
          return match[0]; // Returnerer det første match
      } else {
          return null; // Returnerer null, hvis der ikke findes noget match
      }
  }
  
  function sumOfParametersGiven(rule) {
      // Count the number of rule parameters where the value property is defined (truthy)
      return Object.keys(rule)
          .slice(0, 3)
          .filter(key => rule[key] || rule[key] || rule[key]).length;
  }
  
  function matchParameter(transaction, searchValue, key) {
      if (!searchValue) return false;
  
      const searchTokens = searchValue.split(/\s*,\s*/).map(token => token.trim().toLowerCase());
  
      if (Array.isArray(key)) {
          return key.some(singleKey =>
              transaction[singleKey]
                  ? searchTokens.every(token => transaction[singleKey].toLowerCase().includes(token))
                  : false
          );
      }
  
      return transaction[key]
          ? searchTokens.every(token => transaction[key].toLowerCase().includes(token))
          : false;
  }
  
  function matchAmount(transactionAmount, amountOperator, ruleAmount1, ruleAmount2) {
      switch (ruleAmount1) {
          case null:
              break;
          default:
              ruleAmount1 = parseFloat(ruleAmount1.replace(/\./g, '').replace(',', '.'));
              break;
      }
  
      switch (ruleAmount2) {
          case null:
              break;
          default:
              ruleAmount2 = parseFloat(ruleAmount2.replace(/\./g, '').replace(',', '.'));
              break;
      }
      
      switch (amountOperator) {
          case '><':
              return transactionAmount >= ruleAmount1 && transactionAmount <= ruleAmount2;
          case '>':
              return transactionAmount > ruleAmount1;
          case '<':
              return transactionAmount < ruleAmount1;
          case '==':
              return transactionAmount === ruleAmount1;
          default:
              return true;
      }
  }
  
  function textGeneration(textVariation, message, narrative, counterparty_name) {
      textVariation = textVariation ? textVariation : "";
  
      if (narrative && narrative.includes('BDP')) {
          return narrative.substring(narrative.indexOf('BDP'));
      } else if (narrative && narrative.includes('KSD')) {
          return narrative.substring(narrative.indexOf('KSD')) + (counterparty_name ? counterparty_name : '');
      }
  
      switch (textVariation.toLowerCase()) {
          case "tekst fra bank":
              return narrative;
          case "afsender fra bank":
              return counterparty_name || message;
          default:
              return textVariation;
      }
  }
  
  function generatePostings(statusAccount, landingAccount, statusDebetOrCredit, landingDebetOrCredit, text, amount, landingAccountSecondary, cpr) {
      postings.push(
          {
              account: statusAccount,
              debetOrCredit: statusDebetOrCredit,
              amount: amount,
              text: text
          }
      )
      postings.push(
          {
              account: landingAccount,
              accountSecondary: landingAccountSecondary,
              debetOrCredit: landingDebetOrCredit,
              amount: amount,
              text: text,
              cpr: cpr
          }
      )
  }
  
  
  function processPosting(transaction, rules) {
      let absoluteAmount = Math.abs(parseFloat(transaction.amount));
      transaction.amount = absoluteAmount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      let statusDebetOrCredit = transaction.amount > 0 ? "Debet" : "Kredit";
      let landingDebetOrCredit = statusDebetOrCredit === "Debet" ? "Kredit" : "Debet";
  
      let cpr = rules.postWithCPR ? extractCPRNumber(transaction.narrative) : null;
      
      let completeMatch = false;
  
      for (let rule of rules) {      
          let sumOfParametersMatched = 0;
  
          if (completeMatch) {
              continue
          } else {
              for (let parameterIndex = 0; parameterIndex < transactionParameters.length; parameterIndex++) {
                  let searchValue = rule[ruleParameters[parameterIndex]] ? rule[ruleParameters[parameterIndex]].toLowerCase() : null;
  
                  if (searchValue && rule.activeBool && matchParameter(transaction, searchValue, transactionParameters[parameterIndex])) {
  
                      sumOfParametersMatched += 1;
                  }
              }
  
              let matchedAllParametersBool = sumOfParametersMatched === sumOfParametersGiven(rule);
              let matchedAmountBool = matchAmount(absoluteAmount, rule.operator, rule.amount1, rule.amount2)
              let matchedAccountBool = transaction.relatedAccount.bankAccount === rule.relatedBankAccount || rule.relatedBankAccount === null
                              
              if (matchedAllParametersBool && matchedAmountBool && matchedAccountBool) {
                  if (!rule.exceptionBool) {   // Don't write ERP postings if rule is an exception, but still count as match
                      let text = textGeneration(rule.text, transaction.message, transaction.narrative, transaction.counterparty_name);
                      generatePostings(transaction.account.statusAccount, rule.account, statusDebetOrCredit, landingDebetOrCredit, text, transaction.amount, rule.accountSecondary || '', cpr);
                  }
                  completeMatch = true;
                  rule.lastUsed = date;
              }
          }
      }
  
      if (!completeMatch) {
          let text = transaction.transaction_id;
  
          generatePostings(transaction.relatedAccount.statusAccount, transaction.relatedAccount.intermediateAccount, statusDebetOrCredit, landingDebetOrCredit, text, transaction.amount, '', cpr);
          
          if (transaction.account.bankAccountName != "Debitorkonto") {
              transactionsUnmatched.push(transaction);
          }
      }
  
      transactionsObj.addUnmatched = transactionsUnmatched;
      global.set("transactions", transactionsObj);
      
  }
  
  if (transactions) {
      transactions.forEach(transaction => {
          processPosting(transaction, accountingRules);
      });
  }
  
  erpObj.postings = postings;
  global.set("erp", erpObj);
  
  transactionsObj.list = []
  global.set("transactions", transactionsObj);
  
  masterDataObj.rules = accountingRules;
  global.set("masterData", masterDataObj);
  
  return msg;
}

module.exports = Node;