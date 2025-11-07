---
name: Data Source Request
about: Request support for a new data source
title: '[DATA] '
labels: data-source, enhancement
assignees: ''
---

## Data Source Information

**Name**: [e.g., Alpha Vantage, SEC EDGAR]
**URL**: [API documentation URL]
**Type**: [Free / Freemium / Paid]
**Authentication**: [None / API Key / OAuth]

## Data Coverage

What data does this source provide?

- [ ] Equities OHLCV
- [ ] Real-time quotes
- [ ] Fundamentals
- [ ] Options chains
- [ ] Fixed income
- [ ] Foreign exchange
- [ ] Cryptocurrency
- [ ] Macroeconomic data
- [ ] News/filings
- [ ] Other: ___________

## Compliance Checklist

- [ ] Source is publicly accessible
- [ ] Terms of Service reviewed
- [ ] ToS permits programmatic access
- [ ] robots.txt allows access (if applicable)
- [ ] Rate limits documented
- [ ] No scraping or bypassing controls required
- [ ] License is compatible with MIT
- [ ] CORS constraints documented

## Rate Limits

- **Requests per minute**: ___________
- **Requests per day**: ___________
- **Other limits**: ___________

## API Details

**Base URL**: ___________
**Protocol**: [REST / WebSocket / CSV / Other]
**Response format**: [JSON / XML / CSV / Other]
**Authentication method**: ___________

## Example Request

```bash
curl -X GET "https://api.example.com/v1/quotes?symbol=AAPL" \
  -H "User-Agent: OpenFinTerminal/1.0"
```

## Example Response

```json
{
  "symbol": "AAPL",
  "price": 150.00
}
```

## Terms of Service Summary

Briefly summarize the relevant sections of the ToS:

## Additional Context

Any other information about this data source.
