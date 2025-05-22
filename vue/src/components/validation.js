const ACCOUNT_REGEX = /^(S|9|\d)\d{7}$/;
const ACCOUNTSECONDARY_REGEX = /^X[A-Z]-\d{1,10}-\d{1,5}$/i;
const ACCOUNTTERTIARY_REGEX = /^[a-zA-Z0-9]{1,10}$/;
const CPR_REGEX = /\b((0[1-9]|[12][0-9]|3[01])(0[13578]|10|12)|([0][1-9]|[12][0-9]|30)(0[469]|11)|(0[1-9]|1[0-9]|2[0-8])(02)|(29)(02)(00)|((29)(02)([2468][048]))|((29)(02)([13579][26])))(\d{2})(\d{4})\b/m;

export function validateAccount(value, errors) {
    if (!value) {
        errors.account = 'Artskonto skal angives';
        return false;
    } else if (!ACCOUNT_REGEX.test(value)) {
        errors.account = 'Artskonto skal være præcis 8 tegn langt og starte med "S", "9" eller et tal';
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
        errors.accountSecondary = 'PSP-element skal matche formatet X*-**********-*****';
        return false;
    } else {
        errors.accountSecondary = null;
        return true;
    }
}

export function validateAccountTertiary(value, errors) {
    if (!value) {
        errors.accountTertiary = null;
        return true;
    }
    if (!ACCOUNTTERTIARY_REGEX.test(value)) {
        errors.accountTertiary = 'Omkostningssted skal være 1-10 tegn (bogstaver og tal)';
        return false;
    } else {
        errors.accountTertiary = null;
        return true;
    }
}

export function validateText(value, errors) {
    if (!value) {
        errors.text = 'Posteringstekst skal angives';
        return false;
        
    } else if (value && value.length > 50) {
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
    const accountTertiary = obj?.accountTertiary || '';

    // Always validate fields to update their errors
    validateAccount(account, errors);
    if (accountSecondary) validateAccountSecondary(accountSecondary, errors);
    if (accountTertiary) validateAccountTertiary(accountTertiary, errors);
    
    // Mutual exclusion: begge må ikke være udfyldt
    if (accountSecondary && accountTertiary) {
        errors.accountSecondary = 'PSP-element og Omkostningssted må ikke udfyldes samtidig';
        errors.accountTertiary = 'PSP-element og Omkostningssted må ikke udfyldes samtidig';
        return false;
    } else {
        // Nulstil fejl hvis kun én er udfyldt
        if (!accountSecondary) errors.accountSecondary = null;
        if (!accountTertiary) errors.accountTertiary = null;
    }

    // Only require secondary/tertiary if account is defined
    if (!account) {
        errors.accountSecondary = null;
        errors.accountTertiary = null;
        validateAccount(account, errors);
        return true;
    }

    if (account[0] === '9' || account[0] === 'S') {
        if (accountSecondary) {
            errors.accountSecondary = 'PSP-element må ikke udfyldes, når Artskonto starter med "9" eller "S"';
            return false;
        }
        if (accountTertiary) {
            errors.accountTertiary = 'Omkostningssted må ikke udfyldes, når Artskonto starter med "9" eller "S"';
            return false;
        }
        errors.accountSecondary = null;
        errors.accountTertiary = null;
        return validateAccount(account, errors);
    } else {
        if (!accountSecondary && !accountTertiary) {
            errors.accountSecondary = 'PSP-element eller Omkostningssted skal angives, når Artskonto ikke starter med "9" eller "S"';
            errors.accountTertiary = 'PSP-element eller Omkostningssted skal angives, når Artskonto ikke starter med "9" eller "S"';
            return false;
        }
        if (accountSecondary) {
            errors.accountSecondary = null;
            return validateAccountSecondary(accountSecondary, errors) && validateAccount(account, errors);
        }
        if (accountTertiary) {
            errors.accountTertiary = null;
            return validateAccountTertiary(accountTertiary, errors) && validateAccount(account, errors);
        }
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

export function formatAccountTertiary(value) {
    if (!value) return value;
    // Pad with leading zeros to 10 characters
    return value.toString().padStart(10, '0');
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