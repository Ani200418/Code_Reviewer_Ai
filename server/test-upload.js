const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

fs.writeFileSync('test.js', 'console.log("hello");');

const form = new FormData();
form.append('file', fs.createReadStream('test.js'));

axios.post('http://localhost:5001/api/upload-code', form, {
  headers: {
    ...form.getHeaders()
  }
}).then(res => {
  console.log("Success:", res.data);
}).catch(err => {
  console.error("Error:", err.response ? err.response.data : err.message);
});
