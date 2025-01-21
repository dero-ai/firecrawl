# 🔥 Firecrawl for Dero 🐨

Trigger an extract:

```bash
curl -X POST http://localhost:3002/v1/extract \
    -H 'Content-Type: application/json' \
    -d '{
      "urls": [
        "https://bientendrement.fr/*"
      ],
      "prompt": "Extract all products including their name, price, description, category, condition from the website.",
      "schema": {
        "type": "object",
        "properties": {
          "products": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "price": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                },
                "productLink": {
                  "type": "string"
                },
                "imageLink": {
                  "type": "string"
                },
                "additionalImageLinks": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "category": {
                  "type": "string"
                },
                "condition": {
                  "type": "string"
                }
              },
              "required": [
                "products",
                "price",
                "description",
                "productLink"
              ]
            }
          }
        },
        "required": [
          "products"
        ]
      }
    }'
```

Retrieve extract results:

```bash
curl -X GET http://localhost:3002/v1/extract/c84c7cc3-f6f6-435e-904a-ca5b3e9c17f9 \
    -H 'Content-Type: application/json'
```
