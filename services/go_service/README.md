# Go Service

A high-performance Go service for concurrent operations and CLI utilities.

## Overview

This Go service demonstrates modern backend development with Go, including concurrent processing, REST API patterns, and command-line interface tools.

## Requirements

- Go 1.19 or higher

## Build

```bash
cd services/go_service
go build -o bin/rl-service ./cmd/service
```

## Run

```bash
./bin/rl-service
```

Or use `go run`:

```bash
go run cmd/service/main.go
```

## Features

- Concurrent data processing
- CLI tool for batch operations
- High-performance API client
- Data aggregation utilities
