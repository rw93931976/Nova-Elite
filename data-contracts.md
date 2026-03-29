# Nova Data Contracts (DS-STAR)

This document defines the strict JSON schemas that all Nova agents and tool workers must follow. 

---

## 1. File Search

### FileSearchRequest
```json
{
  "query": "string (the search term)",
  "search_paths": "array of strings (e.g. ['/Desktop'])",
  "max_results": "integer (default 10)"
}
```

### FileSearchResult
```json
{
  "query": "string",
  "files": [
    {
      "full_path": "string",
      "filename": "string",
      "size_bytes": "integer",
      "last_modified": "string (ISO 8601)",
      "preview": "string (chars or 'binary')",
      "is_directory": "boolean",
      "is_binary": "boolean"
    }
  ],
  "total_matches": "integer",
  "took_ms": "integer",
  "error": "null | string"
}
```

---

## 2. Web Search

### WebSearchRequest
```json
{
  "query": "string",
  "num_results": "integer (default 5)",
  "filters": "object (optional)"
}
```

### WebSearchResult
```json
{
  "query": "string",
  "results": [
    {
      "title": "string",
      "url": "string",
      "snippet": "string",
      "domain": "string",
      "publish_date": "string | null",
      "relevance_score": "number (0.0-1.0)"
    }
  ],
  "took_ms": "integer",
  "error": "null | string"
}
```

---

## 3. Response Generation

### FinalAnswer
```json
{
  "user_query": "string",
  "file_results": "FileSearchResult | null",
  "web_results": "WebSearchResult | null",
  "summary": "string (the final natural language answer)",
  "recommendations": "array of strings",
  "sources": "array of strings (paths/URLs)"
}
```
