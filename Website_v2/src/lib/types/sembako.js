/**
 * @typedef {Object} SembakoReturn
 * @property {string} id
 * @property {string} return_number
 * @property {'sale_return' | 'purchase_return'} return_type
 * @property {string} party_name
 * @property {string} product_id
 * @property {string} product_name
 * @property {number} quantity
 * @property {string} unit
 * @property {number} unit_price
 * @property {number} total_amount
 * @property {string} reason
 * @property {'fifo_stock' | 'loss'} action
 * @property {'potong_piutang' | 'refund_cash' | 'store_credit'} [financial_action]
 * @property {'pending' | 'completed'} status
 * @property {string} [notes]
 * @property {string} created_at
 */

/**
 * @typedef {Object} SembakoProduct
 * @property {string} id
 * @property {string} product_name
 * @property {number} current_stock
 * @property {string} unit
 * @property {number} sell_price
 * @property {number} buy_price
 * @property {boolean} is_active
 * @property {boolean} is_deleted
 */

export {}
