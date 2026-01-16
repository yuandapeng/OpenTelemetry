# 🐳 Docker Compose 配置文件识别机制

## 🎯 核心答案

**`docker-compose.yml` 是由 `docker-compose` 命令识别和解析的！**

## 📋 识别流程

```
你运行命令
  ↓
docker-compose up
  ↓
Docker Compose 程序读取 docker-compose.yml
  ↓
解析配置文件
  ↓
创建和管理容器
```

## 🔍 详细说明

### 1. Docker Compose 是什么？

**Docker Compose** 是一个工具，用于定义和运行多容器 Docker 应用程序。

**作用：**
- 读取 `docker-compose.yml` 配置文件
- 根据配置创建和管理多个容器
- 处理容器之间的网络、卷、依赖关系

### 2. 谁识别配置文件？

**Docker Compose 命令行工具**识别配置文件：

```bash
# 当你运行这个命令时
docker-compose up

# Docker Compose 会：
# 1. 在当前目录查找 docker-compose.yml
# 2. 解析配置文件
# 3. 根据配置创建容器
```

### 3. 配置文件的结构

```yaml
version: '3.8'  # ← Docker Compose 版本

services:        # ← 定义服务（容器）
  otel-collector:  # ← 服务名
    image: ...     # ← Docker Compose 读取这些配置
    ports: ...     # ← 并应用到容器
    volumes: ...   # ←

networks:       # ← 定义网络
  otel-network:   # ← Docker Compose 创建这个网络

volumes:        # ← 定义数据卷
  grafana-storage:  # ← Docker Compose 创建这个卷
```

## 🔄 完整工作流程

### 步骤 1：你运行命令

```bash
docker-compose up -d
```

### 步骤 2：Docker Compose 读取配置

```
Docker Compose 程序
  ↓
查找 docker-compose.yml（当前目录）
  ↓
解析 YAML 格式
  ↓
理解配置结构
```

### 步骤 3：Docker Compose 执行操作

根据配置，Docker Compose 会：

1. **创建网络**：
   ```yaml
   networks:
     otel-network:
       driver: bridge
   ```
   → 执行：`docker network create otel-network`

2. **创建数据卷**：
   ```yaml
   volumes:
     grafana-storage:
   ```
   → 执行：`docker volume create grafana-storage`

3. **创建容器**：
   ```yaml
   services:
     otel-collector:
       image: otel/opentelemetry-collector-contrib:latest
       ports:
         - "4318:4318"
   ```
   → 执行：`docker run ... otel/opentelemetry-collector-contrib:latest`

## 📊 配置如何应用到容器

### 示例：otel-collector 服务

```yaml
otel-collector:
  image: otel/opentelemetry-collector-contrib:latest
  container_name: otel-collector
  command: ["--config=/etc/otel-collector-config.yaml"]
  volumes:
    - ./collector-config.yaml:/etc/otel-collector-config.yaml
  ports:
    - "4318:4318"
  networks:
    - otel-network
```

**Docker Compose 会转换为：**

```bash
docker run \
  --name otel-collector \
  --network otel-network \
  -p 4318:4318 \
  -v ./collector-config.yaml:/etc/otel-collector-config.yaml \
  otel/opentelemetry-collector-contrib:latest \
  --config=/etc/otel-collector-config.yaml
```

## 🎯 各个服务如何读取配置

### 1. Docker Compose 层面

**Docker Compose 读取：**
- `docker-compose.yml` - 容器配置
- 创建网络、卷、容器

### 2. 容器内部配置

**每个服务读取自己的配置文件：**

#### otel-collector

```yaml
volumes:
  - ./collector-config.yaml:/etc/otel-collector-config.yaml
command: ["--config=/etc/otel-collector-config.yaml"]
```

**流程：**
1. Docker Compose 挂载 `collector-config.yaml` 到容器内
2. Collector 启动时读取 `/etc/otel-collector-config.yaml`
3. Collector 根据配置启动服务

#### prometheus

```yaml
volumes:
  - ./prometheus-config.yaml:/etc/prometheus/prometheus.yml
command:
  - '--config.file=/etc/prometheus/prometheus.yml'
```

**流程：**
1. Docker Compose 挂载 `prometheus-config.yaml` 到容器内
2. Prometheus 启动时读取 `/etc/prometheus/prometheus.yml`
3. Prometheus 根据配置拉取 metrics

## 📋 配置文件层次

```
┌─────────────────────────────────────┐
│  docker-compose.yml                │
│  (Docker Compose 读取)              │
│  - 定义容器、网络、卷                │
│  - 定义端口映射                      │
│  - 定义依赖关系                      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  容器内部配置文件                    │
│  (各个服务读取)                      │
│  - collector-config.yaml            │
│  - prometheus-config.yaml           │
│  - loki 默认配置                     │
└─────────────────────────────────────┘
```

## 🔧 实际例子

### 当你运行 `docker-compose up` 时

```bash
$ docker-compose up -d

# Docker Compose 执行：
1. 读取 docker-compose.yml
2. 创建网络：otel-network
3. 创建卷：grafana-storage, prometheus-data
4. 启动容器：
   - jaeger (不依赖其他服务)
   - loki (不依赖其他服务)
   - otel-collector (依赖 jaeger, loki)
   - prometheus (依赖 otel-collector)
   - grafana (依赖 loki, jaeger, prometheus)
```

### 容器启动后的配置读取

```
otel-collector 容器启动
  ↓
读取 /etc/otel-collector-config.yaml
  ↓
根据配置启动：
  - 监听 4318 端口（接收数据）
  - 暴露 8889 端口（Prometheus exporter）
  - 连接到 jaeger:9411（发送 Traces）
  - 连接到 loki:3100（发送 Logs）

prometheus 容器启动
  ↓
读取 /etc/prometheus/prometheus.yml
  ↓
根据配置：
  - 从 otel-collector:8889 拉取 metrics
  - 存储到 /prometheus
  - 提供 API 在 9090 端口
```

## 💡 关键理解

### 1. 两层配置

**第一层：Docker Compose 配置**
- 文件：`docker-compose.yml`
- 识别者：`docker-compose` 命令
- 作用：定义容器如何运行

**第二层：应用配置**
- 文件：`collector-config.yaml`、`prometheus-config.yaml`
- 识别者：容器内的应用程序
- 作用：定义应用程序的行为

### 2. 配置传递

```
docker-compose.yml
  ↓ (Docker Compose 读取)
创建容器，挂载配置文件
  ↓
容器内的应用程序
  ↓ (应用程序读取)
读取挂载的配置文件
  ↓
根据配置运行
```

## ✅ 总结

**`docker-compose.yml` 的识别者：**

1. **主要识别者**：`docker-compose` 命令行工具
   - 读取配置文件
   - 创建和管理容器

2. **配置传递**：通过 `volumes` 挂载
   - Docker Compose 挂载配置文件到容器
   - 容器内的应用程序读取配置文件

3. **执行流程**：
   ```
   你 → docker-compose up
        ↓
   Docker Compose → 读取 docker-compose.yml
        ↓
   创建容器 → 挂载配置文件
        ↓
   容器启动 → 应用程序读取配置文件
        ↓
   服务运行
   ```

**简单理解：**
- `docker-compose.yml` = 容器的"说明书"
- `docker-compose` = 读取说明书的"工人"
- 容器内的应用 = 根据配置文件运行的"程序"

