/**
 * The single card the app shows: on the Profile face, in a transaction's detail
 * view, and on the payment ticket. Kept in one place so those three never drift.
 */
export const CARD = {
  holder: 'Elizabeth Crowley',
  number: '4539 8842 7716 2043',
  expiry: '12/28',
  cvv: '481',
  brand: 'Visa',
} as const

export const CARD_LAST4 = CARD.number.replace(/\s/g, '').slice(-4)
