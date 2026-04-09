import bcrypt from 'bcryptjs'

const password = 'admin123'
const saltRounds = 12

const hash = bcrypt.hashSync(password, saltRounds)
console.log('Password:', password)
console.log('Bcrypt Hash:', hash)

// Verify it works
const isValid = bcrypt.compareSync(password, hash)
console.log('Verification:', isValid ? 'SUCCESS' : 'FAILED')
