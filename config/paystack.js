const paystack = (request) => {
  const MySecretKey = 'Bearer sk_test_6056ec9b75ce8203f7e96175e142e92b0699285d'
  //replace the secret key with that from your paystack account
  const initializePayment = (form, mycallback) => {
    const options = {
      url: 'https://api.paystack.co/transaction/initialize',
      headers: {
        authorization: MySecretKey,
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      form,
    }
    const callback = (error, response, body) => {
      return mycallback(error, body)
    }
    request.post(options, callback)
  }

  const verifyPayment = (ref, mycallback) => {
    const options = {
      url:
        'https://api.paystack.co/transaction/verify/' + encodeURIComponent(ref),
      headers: {
        authorization: MySecretKey,
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
    }
    const callback = (error, response, body) => {
      return mycallback(error, body)
    }
    request(options, callback)
  }

  return { initializePayment, verifyPayment }
}

module.exports = paystack
