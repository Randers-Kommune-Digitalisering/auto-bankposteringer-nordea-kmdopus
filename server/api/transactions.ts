import type { Transaction } from '~/types'

// Mock data for transactions
const transactions: Transaction[] = [
    {
        id: '0000954427',
        bookingDate: new Date('2025-09-15'),
        bankAccount: 'DK20005908764988-DKK',
        bankAccountName: 'Hovedkonto',
        counterpart: null,
        amount: -4588.42,
        transactionType: 'CAP',
        references: [ 'NKS-KY' ],
        ruleApplied: 13,
        status: 'bogført',
    },
    {
        id: '0000954425',
        bookingDate: new Date('2025-09-15'),
        bankAccount: 'DK20009042714507-DKK',
        bankAccountName: 'Kreditorkonto',
        counterpart: 'PARKMAN OY',
        amount: 5038.75,
        transactionType: 'BGS',
        references: [ 'Parkman 08/2025', 'Kundennr: 10000322' ],
        ruleApplied: null,
        status: 'åben',
    },
    {
        id: '0000954419',
        bookingDate: new Date('2025-09-15'),
        bankAccount: 'DK20005908764988-DKK',
        bankAccountName: 'Hovedkonto',
        counterpart: null,
        amount: 315.00,
        transactionType: 'DANKORT-SALG',
        references: [ 'Dankort-salg 12.09 6899625 242050' ],
        ruleApplied: null,
        status: 'åben',
    }
]

export default cachedEventHandler(
  async (event) => {
    setHeader(event, 'X-Cache', 'HIT')
    return await transactions
  },
  { maxAge: 120 }
)
