const https = require('https');

https.get('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.72.04.1003', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    try {
        const json = JSON.parse(data);
        console.log("Structure Analysis:");
        console.log("data is array?", Array.isArray(json.data));
        console.log("data length:", json.data.length);
        
        const firstItem = json.data[0];
        console.log("Keys of data[0]:", Object.keys(firstItem));
        
        if (firstItem.cuaca) {
            console.log("data[0].cuaca is array?", Array.isArray(firstItem.cuaca));
             console.log("data[0].cuaca length:", firstItem.cuaca.length);
            console.log("First forecast item keys:", Object.keys(firstItem.cuaca[0]));
            console.log("First forecast item sample:", JSON.stringify(firstItem.cuaca[0], null, 2));
        } else {
             console.log("No 'cuaca' key in data[0]. Check these keys:", Object.keys(firstItem));
             // Maybe the properties are directly on data[0]?
             console.log("sample t:", firstItem.t);
             console.log("sample weather_desc:", firstItem.weather_desc);
        }

    } catch(e) {
        console.error("Parse error:", e);
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
