#!/bin/bash
find . -name "*.go" -type f | while read -r file; do
    sed -i 's/defer func() { _ = imgFile.Close() }()/defer func() { if err := imgFile.Close(); err != nil { log.Printf("error closing image file: %v", err) } }()/g' "$file"
    sed -i 's/defer func() { _ = database.Close() }()/defer func() { if err := database.Close(); err != nil { log.Printf("error closing database: %v", err) } }()/g' "$file"
    sed -i 's/defer func() { _ = rdb.Close() }()/defer func() { if err := rdb.Close(); err != nil { log.Printf("error closing redis: %v", err) } }()/g' "$file"
    sed -i 's/defer func() { _ = taskQueue.Close() }()/defer func() { if err := taskQueue.Close(); err != nil { log.Printf("error closing task queue: %v", err) } }()/g' "$file"
    sed -i 's/defer func() { _ = f.Close() }()/defer func() { if err := f.Close(); err != nil { log.Printf("error closing file: %v", err) } }()/g' "$file"
    sed -i 's/defer func() { _ = resp.Body.Close() }()/defer func() { if err := resp.Body.Close(); err != nil { log.Printf("error closing response body: %v", err) } }()/g' "$file"
    sed -i 's/defer func() { _ = rows.Close() }()/defer func() { if err := rows.Close(); err != nil { log.Printf("error closing rows: %v", err) } }()/g' "$file"
    sed -i 's/defer func() { _ = stream.Close() }()/defer func() { if err := stream.Close(); err != nil { log.Printf("error closing stream: %v", err) } }()/g' "$file"
    sed -i 's/defer func() { _ = tmpFile.Close() }()/defer func() { if err := tmpFile.Close(); err != nil { log.Printf("error closing temp file: %v", err) } }()/g' "$file"
done
