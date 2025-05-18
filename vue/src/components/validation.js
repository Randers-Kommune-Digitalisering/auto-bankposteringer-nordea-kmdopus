const ACCOUNT_REGEX = /^(S|9|\d)\d{7}$/;
const ACCOUNTSECONDARY_REGEX = /^X[A-Z]-\d{1,10}-\d{1,5}$/i;
const CPR_REGEX = /\b((0[1-9]|[12][0-9]|3[01])(0[13578]|10|12)|([0][1-9]|[12][0-9]|30)(0[469]|11)|(0[1-9]|1[0-9]|2[0-8])(02)|(29)(02)(00)|((29)(02)([2468][048]))|((29)(02)([13579][26])))(\d{2})(\d{4})\b/gm;

export function validateAccount(value, errors) {
    if (!value) {
        errors.account = 'Artskonto er påkrævet.';
        return false;
    } else if (!ACCOUNT_REGEX.test(value)) {
        errors.account = 'Artskonto skal være præcis 8 tegn langt og starte med "S", "9" eller et tal.';
        return false;
    } else {
        errors.account = null;
        return true;
    }
}

export function validateAccountSecondary(value, errors) {
    if (!value) {
        errors.accountSecondary = null;
        return true;
    }
    if (!ACCOUNTSECONDARY_REGEX.test(value)) {
        errors.accountSecondary = 'PSP-element skal matche formatet X[A-Z]-**********-*****.';
        return false;
    } else {
        errors.accountSecondary = null;
        return true;
    }
}

export function validateText(value, errors) {
    if (value && value.length > 50) {
        errors.text = 'Maks. 50 tegn';
        return false;
    } else {
        errors.text = null;
        return true;
    }
}

export function validateCPR(value, errors) {
    if (!value) {
        errors.cpr = null;
        return true;
    }
    if (!CPR_REGEX.test(value)) {
        errors.cpr = 'CPR skal matche formatet DDMMÅÅXXXX';
        return false;
    } else {
        errors.cpr = null;
        return true;
    }
}

export function validateDependencies(obj, errors) {
    const account = obj?.account || '';
    const accountSecondary = obj?.accountSecondary || '';

    // Only require PSP-element if account does not start with 9 or S
    if (!account) {
        errors.accountSecondary = null;
        validateAccount(account, errors);
    }

    if (account[0] === '9' || account[0] === 'S') {
        if (accountSecondary) {
            errors.accountSecondary = 'PSP-element må ikke udfyldes, når Artskonto starter med "9" eller "S".';
            return false;
        }
        errors.accountSecondary = null;
        return validateAccount(account, errors);
    } else {
        if (!accountSecondary) {
            errors.accountSecondary = 'PSP-element er påkrævet, når Artskonto ikke starter med "9" eller "S".';
            return false;
        }
        return validateAccountSecondary(accountSecondary, errors) && validateAccount(account, errors);
    }
}

export function formatAccountSecondary(value) {
    if (!value) return value;
    const regex = /^X([A-Z])-(\d{1,10})-(\d{1,5})$/i;
    const match = value.match(regex);
    if (match) {
        const part1 = match[1];
        const part2 = match[2].padStart(10, '0');
        const part3 = match[3].padStart(5, '0');
        return `X${part1}-${part2}-${part3}`;
    }
    return value;
}

export function formatAmount(value) {
    if (value === null || value === undefined) return null;
    value = value.toString().replace('.', '').replace(',', '.');
    value = parseFloat(value);
    if (isNaN(value)) return null;
    return value.toLocaleString('da-DK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}