# 🔥 Firecrawl for Dero 🐨

## Setup

1. `brew install redis`
1. `cd apps/api`
1. `asdf install`
1. `pnpm install`
1. copy the `apps/api/.env.example` file to `apps/api/.env`
1. ask @Asimov4 for the `AZURE_OPENAI_CREDENTIAL`
1. in one terminal run `redis-server`
1. in one terminal run `pnpm run workers`
1. in one terminal run `pnpm run start`

## Running an crawl

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
                "name",
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

To publish to algolia:

```bash
curl -X GET http://localhost:3002/v1/publish/<job id>/<marketplace name (with %20 instead of spaces)> \
    -H 'Content-Type: application/json'
```

```bash
curl -X GET http://localhost:3002/v1/publish/c84c7cc3-f6f6-435e-904a-ca5b3e9c17f9/Bien%20Tendrement \
    -H 'Content-Type: application/json'
```
