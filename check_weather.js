const https = require('https');

https.get('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.72.04.1003', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    try {
        const json = JSON.parse(data);
        console.log("Root keys:", Object.keys(json));
        if (json.data) {
             console.log("json.data type:", Array.isArray(json.data) ? 'Array' : typeof json.data);
             console.log("json.data length:", json.data.length);
             console.log("First item of json.data:", JSON.stringify(json.data[0], null, 2));
             if (json.data[0].cuaca) {
                 console.log("json.data[0].cuaca sample:", JSON.stringify(json.data[0].cuaca[0], null, 2));
             }
        }
    } catch(e) {
        console.error("Parse error:", e);
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
