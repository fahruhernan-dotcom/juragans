export class AppError extends Error {
  constructor(code, message, status) {
    super(message)
    this.code = code
    this.status = status
    this.name = 'AppError'
  }
}

export function normalizeSupabaseError(error) {
  // If it's already an AppError, return it directly
  if (error instanceof AppError) {
    return error
  }

  // Handle generic / undefined errors
  if (!error) {
    return new AppError('UNKNOWN_ERROR', 'Terjadi kesalahan sistem.', 500)
  }

  // Network / Fetch error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError('NETWORK_ERROR', 'Koneksi jaringan terputus. Mohon periksa internet Anda.', 0)
  }

  const errCode = error.code || error.error_code
  const errMessage = error.message || error.error_description || ''
  const status = error.status || 500

  // 1. Auth & Session Errors (B) Temporary 401 / fetch issue
  if (status === 401 || errMessage.toLowerCase().includes('jwt expired') || errMessage.toLowerCase().includes('unauthorized')) {
    return new AppError('AUTH_SESSION_EXPIRED', 'Sesi kedaluwarsa atau tidak valid.', 401)
  }

  // 2. RLS / Permission Errors
  if (errCode === '42501') {
    return new AppError('INSUFFICIENT_PRIVILEGE', 'Akses ditolak. Anda tidak memiliki izin untuk melihat atau mengubah data ini.', 403)
  }

  // 3. PostgREST No Rows
  if (errCode === 'PGRST116') {
    return new AppError('NOT_FOUND', 'Data tidak ditemukan.', 404)
  }

  // 4. PostgreSQL Constraint Violations
  // 4a. Foreign Key Constraint (23503)
  if (errCode === '23503' || errMessage.toLowerCase().includes('violates foreign key constraint')) {
    const lowMsg = errMessage.toLowerCase()
    if (lowMsg.includes('customer_id') || lowMsg.includes('customer_id_fkey')) {
      return new AppError('INVALID_CUSTOMER', 'Toko / Pelanggan yang dipilih tidak valid atau belum tersimpan. Silakan pilih ulang toko pada Langkah 1.', 400)
    }
    if (lowMsg.includes('product_id') || lowMsg.includes('product_id_fkey')) {
      return new AppError('INVALID_PRODUCT', 'Salah satu produk yang dipilih tidak ditemukan di database. Silakan periksa kembali daftar produk.', 400)
    }
    return new AppError('FOREIGN_KEY_VIOLATION', 'Terdapat relasi data (toko/produk) yang tidak cocok. Silakan periksa kembali data sebelum menyimpan.', 400)
  }

  // 4b. Unique Constraint / Duplicate Key (23505)
  if (errCode === '23505' || errMessage.toLowerCase().includes('violates unique constraint') || errMessage.toLowerCase().includes('duplicate key')) {
    return new AppError('DUPLICATE_RECORD', 'Data atau nomor transaksi ini sudah pernah tersimpan sebelumnya. Silakan coba simpan kembali.', 409)
  }

  // 4c. Not Null Constraint (23502)
  if (errCode === '23502' || errMessage.toLowerCase().includes('violates not-null constraint')) {
    return new AppError('REQUIRED_FIELD_MISSING', 'Ada informasi wajib yang belum diisi. Harap lengkapi semua isian formulir.', 400)
  }

  // 5. Custom exceptions (Postgres RAISE EXCEPTION or Business Logic)
  const msgUpper = errMessage.toUpperCase()
  
  if (msgUpper.includes('QUOTA_EXCEEDED') || msgUpper.includes('QUOTA')) {
    return new AppError('QUOTA_EXCEEDED', 'Batas kuota transaksi tercapai. Silakan upgrade paket Anda.', 402)
  }
  
  if (msgUpper.includes('STOK TIDAK CUKUP') || msgUpper.includes('INSUFFICIENT_STOCK')) {
    return new AppError('INSUFFICIENT_STOCK', 'Stok produk tidak mencukupi untuk transaksi ini.', 400)
  }

  if (msgUpper.includes('UNAUTHORIZED') && !errCode) {
    return new AppError('UNAUTHORIZED_ACTION', 'Aksi tidak diizinkan.', 403)
  }

  // Fallback for custom SQL Exceptions (like P0001) that aren't specifically mapped
  if (errCode === 'P0001') {
    return new AppError('BUSINESS_LOGIC_ERROR', errMessage, 400)
  }

  // Fallback for all other errors
  return new AppError(errCode || 'UNKNOWN_ERROR', errMessage || 'Terjadi kesalahan sistem yang tidak diketahui.', status)
}
