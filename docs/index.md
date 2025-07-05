---
layout: home

hero:
  name: "Backend Rebase"
  text: "Distributed Systems & Backend Services"
  tagline: "A comprehensive backend project featuring distributed systems, microservices, and data structures implementations"

  actions:
    - theme: brand
      text: View on GitHub
      link: https://github.com/yedidyar/backend-rebase
    - theme: alt
      text: User Service
      link: /user-service
    - theme: alt
      text: Analytics Service
      link: /analytics-project
    - theme: alt
      text: Blob Service
      link: /blob-service

features:
  - icon: 🌐
    title: Distributed System
    details: Complete distributed blob storage system with load balancer, cache proxy, and multiple HTTP blob servers with consistent hashing
  - icon: 📊
    title: Analytics Platform
    details: Real-time analytics service with PostgreSQL integration, page view tracking, and materialized views for reporting
  - icon: 👥
    title: User Management
    details: Fastify-based user service with PostgreSQL, soft deletes, and comprehensive logging with Logzio integration
  - icon: 🚀
    title: Microservices Architecture
    details: Multiple independent services with Docker containerization, service discovery, and automated deployment scripts
  - icon: 🔧
    title: Data Structures
    details: Custom implementations of HashMap, LRU Cache, and large-scale sorting algorithms for educational purposes
  - icon: ⚡
    title: Performance Optimized
    details: Async/await patterns, worker threads for CPU-intensive tasks, and efficient caching strategies
---

## Quick Start

Get up and running with the entire distributed system in just a few commands:

```bash
# Clone the repository
git clone https://github.com/your-username/backend-rebase.git
cd backend-rebase

# Install dependencies
pnpm install

# Start all services
chmod +x start-services.sh
pnpm run malic:up
```

## Architecture Overview

The project consists of several independent services that work together:

### 🌐 Distributed System Project

- **Load Balancer**: Routes requests using consistent hashing
- **HTTP Blob Server**: Stores and retrieves binary data with metadata
- **Cache Proxy**: LRU cache implementation for improved performance

### 📊 Analytics Project

- **Analytics Service**: Tracks page views and user interactions
- **Increments Service**: Handles real-time data increments
- **PostgreSQL Integration**: With Flyway migrations and materialized views

### 👥 User Service

- **User Management**: CRUD operations with soft delete support
- **PostgreSQL Database**: Connection pooling and transaction management
- **Structured Logging**: Winston with Logzio integration

## Key Features

### 🔄 Service Discovery & Load Balancing

The load balancer automatically discovers and routes traffic to available blob servers using MD5 hashing for consistent distribution.

### 📈 Real-time Analytics

Track page views with hourly granularity, featuring materialized views for efficient reporting and data aggregation.

### 🗄️ Blob Storage System

Store and retrieve binary data with custom metadata, featuring configurable storage limits and folder organization.

### 🚀 Containerized Deployment

Full Docker Compose setup with service orchestration, networking, and environment configuration.

## Educational Components

### 📚 Lesson 01: Data Structures

- Custom HashMap implementation with collision handling
- Large-scale external sorting algorithm using heap-based merge
- Comprehensive test coverage with Vitest

### 📚 Lesson 02: Concurrent Programming

- Synchronous vs asynchronous prime number counting
- Worker threads for CPU-intensive tasks
- Performance benchmarking and optimization

## Technology Stack

- **Runtime**: Node.js v23+ with TypeScript
- **Web Framework**: Fastify for high-performance APIs
- **Database**: PostgreSQL with connection pooling
- **Caching**: Custom LRU cache implementation
- **Logging**: Winston with Logzio integration
- **Testing**: Vitest for unit and integration tests
- **Containerization**: Docker and Docker Compose
- **Package Management**: pnpm for efficient dependency management
