const jwt = require('jsonwebtoken')

const jwtSign = payload => {
  const accessToken = jwt.sign(
    payload,
    'wvPXxkqZ2usTSTi79Q8JxHG1DUQsjxc7rX0mzCqcd+1WsfYgYh9KZVENVNdnrkST',
    {
      expiresIn: '24h'
    }
  )
  console.log(accessToken)

  return { accessToken }
}
jwtSign({ phoneNumber: '9352030310', userName: 'parveen kumar' })
