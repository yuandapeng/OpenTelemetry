# 🐳 Docker Compose 命令详解

## 📋 `docker-compose up -d` 命令解析

### 命令组成

```bash
docker-compose up -d
```

**分解：**
- `docker-compose` - Docker Compose 命令行工具
- `up` - 启动服务（创建并启动容器）
- `-d` - 后台运行（detached mode）

## 🔍 详细说明

### `docker-compose`

**作用：** Docker Compose 命令行工具

**功能：**
- 读取 `docker-compose.yml` 配置文件
- 管理多容器应用程序
- 创建、启动、停止、删除容器

### `up`

**作用：** 创建并启动服务

**执行的操作：**
1. 读取 `docker-compose.yml`
2. 创建网络（如果不存在）
3. 创建数据卷（如果不存在）
4. 创建并启动所有服务（容器）

**等价于：**
- 创建容器（如果不存在）
- 启动容器（如果已存在但未运行）
- 重新创建容器（如果配置有变化）

### `-d` (detached)

**作用：** 后台运行模式

**含义：**
- `-d` = detached（分离模式）
- 容器在后台运行
- 不占用当前终端
- 可以继续使用终端执行其他命令

**对比：**

```bash
# 前台运行（会占用终端）
docker-compose up
# 按 Ctrl+C 会停止所有容器

# 后台运行（不占用终端）
docker-compose up -d
# 容器在后台运行，终端可以继续使用
```

## 📊 完整流程

```
你运行：docker-compose up -d
  ↓
Docker Compose 读取 docker-compose.yml
  ↓
检查网络是否存在
  ├─ 不存在 → 创建网络（otel-network）
  └─ 已存在 → 使用现有网络
  ↓
检查数据卷是否存在
  ├─ 不存在 → 创建卷（grafana-storage, prometheus-data）
  └─ 已存在 → 使用现有卷
  ↓
检查容器是否存在
  ├─ 不存在 → 创建并启动容器
  ├─ 已存在但未运行 → 启动容器
  └─ 已存在且运行中 → 检查配置是否有变化
  ↓
所有容器在后台运行
  ↓
返回终端控制权（可以继续使用终端）
```

## 🎯 实际例子

### 运行命令

```bash
docker-compose up -d
```

### 输出示例

```
Creating network "study-opentelemetry_otel-network" ... done
Creating volume "study-opentelemetry_grafana-storage" ... done
Creating volume "study-opentelemetry_prometheus-data" ... done
Creating jaeger ... done
Creating loki ... done
Creating otel-collector ... done
Creating prometheus ... done
Creating grafana ... done
```

### 结果

- ✅ 所有容器在后台运行
- ✅ 终端可以继续使用
- ✅ 可以通过 `docker-compose ps` 查看状态

## 📋 相关命令

### 查看运行状态

```bash
docker-compose ps
```

**输出：**
```
NAME                IMAGE                                    STATUS
grafana             grafana/grafana:latest                  Up 2 minutes
jaeger              jaegertracing/all-in-one:latest         Up 2 minutes
loki                grafana/loki:latest                     Up 2 minutes
otel-collector      otel/opentelemetry-collector-contrib    Up 2 minutes
prometheus          prom/prometheus:latest                   Up 2 minutes
```

### 查看日志

```bash
# 查看所有服务的日志
docker-compose logs

# 查看特定服务的日志
docker-compose logs otel-collector

# 实时查看日志（类似 tail -f）
docker-compose logs -f otel-collector
```

### 停止服务

```bash
# 停止所有服务（不删除容器）
docker-compose stop

# 停止并删除容器
docker-compose down
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart otel-collector
```

## 💡 常用组合

### 1. 启动服务（后台）

```bash
docker-compose up -d
```

### 2. 启动并查看日志

```bash
docker-compose up -d && docker-compose logs -f
```

### 3. 重新创建并启动

```bash
docker-compose up -d --force-recreate
```

### 4. 启动特定服务

```bash
docker-compose up -d otel-collector prometheus
```

## 🔄 命令对比

| 命令 | 作用 | 是否占用终端 |
|------|------|------------|
| `docker-compose up` | 启动服务（前台） | ✅ 是 |
| `docker-compose up -d` | 启动服务（后台） | ❌ 否 |
| `docker-compose start` | 启动已存在的容器 | ❌ 否 |
| `docker-compose stop` | 停止容器 | ❌ 否 |
| `docker-compose down` | 停止并删除容器 | ❌ 否 |

## ✅ 总结

**`docker-compose up -d` 的含义：**

1. **`docker-compose`** - 使用 Docker Compose 工具
2. **`up`** - 创建并启动所有服务
3. **`-d`** - 在后台运行（不占用终端）

**执行结果：**
- ✅ 读取 `docker-compose.yml`
- ✅ 创建网络、卷、容器
- ✅ 启动所有服务
- ✅ 容器在后台运行
- ✅ 终端可以继续使用

**常用场景：**
- 启动开发环境
- 启动测试环境
- 启动生产环境（通常使用编排工具）

