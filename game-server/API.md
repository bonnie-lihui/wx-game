# 国风轻玩合集 2.0 — 后端接口文档

> 最后更新：2026-03-10

## 基本信息

| 项目 | 值 |
|---|---|
| Base URL | `https://mini-game.solaboom.cn` |
| 端口 | `5565` |
| Content-Type | `application/json` |
| 数据库 | MySQL `guofeng_game` |

## 通用请求头

| Header | 必填 | 说明 |
|---|---|---|
| `Content-Type` | 是 | `application/json` |
| `X-Client` | 否 | 客户端标识，如 `wechat-minigame` |
| `X-Sign` | 否 | 请求签名（防篡改，基于 body 的哈希值） |
| `X-Wechat-Appid` | 否 | 小程序 AppID（用于 CORS 白名单校验） |

## 通用错误响应

```json
{ "code": 400, "msg": "错误描述" }
```

| HTTP 状态码 | 含义 |
|---|---|
| 400 | 参数错误 / 请求无效 |
| 404 | 接口不存在 |
| 429 | 触发限流 |
| 500 | 服务端异常 |

---

## 接口总览

| # | 方法 | 路径 | 功能 | 限流 |
|---|---|---|---|---|
| 0 | GET | `/health` | 健康检查 | 无 |
| 1 | POST | `/api/user/wxLogin` | 微信无感登录 | IP 限流 10 次/分 + code 防重放 |
| 2 | POST | `/api/user/tiktokLogin` | 抖音无感登录 | IP 限流 10 次/分 + code 防重放 |
| 3 | POST | `/api/user/init` | 初始化/获取用户 | 无 |
| 4 | POST | `/api/user/saveProgress` | 保存游戏进度 | 无 |
| 5 | GET | `/api/level/getLevelData` | 获取关卡数据 | 无 |
| 6 | GET | `/api/level/getThemeData` | 获取主题包数据 | 无 |
| 7 | GET | `/api/level/getRandomCharDiff` | 随机汉字找不同 | 无 |

---

## 0. 健康检查

### `GET /health`

服务存活探针，无需鉴权。

**响应示例：**

```json
{ "ok": true, "ts": 1710000000000 }
```

---

## 一、用户模块 `/api/user`

### 1. 微信无感登录

#### `POST /api/user/wxLogin`

通过 `wx.login()` 获取的 code 换取 openid，自动创建或更新用户。

**限流规则：**
- 同一 IP 每分钟最多 10 次
- 同一 code 仅允许使用一次（内存缓存 5 分钟过期）

**请求参数（Body JSON）：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `code` | string | **是** | `wx.login()` 返回的临时登录凭证 |
| `nickname` | string | 否 | 用户昵称 |
| `avatarUrl` | string | 否 | 用户头像 URL |
| `platform` | string | 否 | 来源平台：`wx` / `tiktok` / `others`，默认 `wx` |

**请求示例：**

```json
{
  "code": "0a3Xxx000yyy1z",
  "nickname": "墨韵玩家",
  "avatarUrl": "https://thirdwx.qlogo.cn/...",
  "platform": "wx"
}
```

**成功响应（200）：**

```json
{
  "success": true,
  "userInfo": {
    "openid": "oXXXXXXXXXXXX",
    "nickname": "墨韵玩家",
    "avatar": "https://thirdwx.qlogo.cn/...",
    "platform": "wx"
  }
}
```

**失败响应：**

| HTTP 状态码 | code | 场景 |
|---|---|---|
| 400 | 400 | 缺少 code / code 已被使用 / 微信 errcode=40029 |
| 429 | 429 | 触发 IP 限流 |
| 500 | 500 | 微信 API 异常 / 数据库异常 |

---

### 2. 抖音无感登录

#### `POST /api/user/tiktokLogin`

通过 `tt.login()` 获取的 code 换取 openid，自动创建或更新用户。platform 自动设为 `tiktok`。

**限流规则：**
- 同一 IP 每分钟最多 10 次
- 同一 code 仅允许使用一次（内存缓存 5 分钟过期）

**请求参数（Body JSON）：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `code` | string | 二选一 | `tt.login()` 返回的登录凭证 |
| `anonymousCode` | string | 二选一 | `tt.login()` 返回的匿名登录凭证 |
| `nickname` | string | 否 | 用户昵称 |
| `avatarUrl` | string | 否 | 用户头像 URL |

> `code` 和 `anonymousCode` 至少传一个。传 `code` 获取实名 openid，传 `anonymousCode` 获取匿名 openid。

**请求示例：**

```json
{
  "code": "0a3Xxx000yyy1z",
  "nickname": "墨韵玩家",
  "avatarUrl": "https://..."
}
```

**成功响应（200）：**

```json
{
  "success": true,
  "userInfo": {
    "openid": "oXXXXXXXXXXXX",
    "nickname": "墨韵玩家",
    "avatar": "https://...",
    "platform": "tiktok"
  }
}
```

**失败响应：**

| HTTP 状态码 | code | 场景 |
|---|---|---|
| 400 | 400 | 缺少 code 和 anonymousCode / code 已被使用 |
| 429 | 429 | 触发 IP 限流 |
| 500 | 500 | 抖音 API 异常 / 数据库异常 |

---

### 3. 初始化用户

#### `POST /api/user/init`

初始化或获取用户信息（不走微信登录流程，适用于已有 openid 的场景）。

**请求参数（Body JSON）：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `openid` | string | **是** | 用户唯一标识 |
| `nickname` | string | 否 | 用户昵称 |
| `platform` | string | 否 | 来源平台：`wx` / `tiktok` / `others`，默认 `wx` |

**请求示例：**

```json
{
  "openid": "oXXXXXXXXXXXX",
  "nickname": "墨韵玩家",
  "platform": "wx"
}
```

**成功响应（200）：**

```json
{
  "userInfo": {
    "openid": "oXXXXXXXXXXXX",
    "nickname": "墨韵玩家",
    "avatar": "https://...",
    "platform": "wx"
  }
}
```

**失败响应：**

| HTTP 状态码 | code | 场景 |
|---|---|---|
| 400 | 400 | 缺少 openid |
| 500 | 500 | 数据库异常 |

---

### 4. 保存游戏进度

#### `POST /api/user/saveProgress`

保存用户游戏进度，写入 `t_user_progress` 表（ON DUPLICATE KEY UPDATE）。

**请求参数（Body JSON）：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `openid` | string | **是** | 用户唯一标识 |
| `gameId` | string | **是** | 游戏 ID：`wordFind` / `charDiff` / `poetryConnect` |
| `level` | number | 否 | 当前关卡数，默认 `1` |
| `score` | number | 否 | 本关得分，默认 `0` |

**请求示例：**

```json
{
  "openid": "oXXXXXXXXXXXX",
  "gameId": "wordFind",
  "level": 3,
  "score": 85
}
```

**成功响应（200）：**

```json
{ "success": true, "msg": "ok" }
```

**失败响应：**

| HTTP 状态码 | code | 场景 |
|---|---|---|
| 400 | 400 | 缺少 openid 或 gameId |
| 500 | 500 | 数据库异常 |

---

## 二、关卡模块 `/api/level`

### 5. 获取关卡数据

#### `GET /api/level/getLevelData`

获取指定玩法的关卡题目数据。

**请求参数（Query String）：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `gameId` | string | **是** | 游戏 ID：`wordFind` / `charDiff` / `poetryConnect` |
| `difficulty` | string | 否 | 难度：`easy` / `normal` / `hard` / `hell`，空则自动 |
| `level` | number | 否 | 关卡数，默认 `0` |
| `openid` | string | 否 | 用户标识（用于读取进度），默认 `guest` |
| `themeId` | string | 否 | 主题包 ID |
| `resetProgress` | string | 否 | 是否重置进度：`1` / `true` 表示重置 |

**请求示例：**

```
GET /api/level/getLevelData?gameId=wordFind&difficulty=easy&level=1&openid=oXXX
```

**成功响应（200）：**

```json
{
  "levelData": { ... },
  "answer": "国泰民安",
  "themeId": null,
  "difficulty": "easy",
  "timeLimit": 60
}
```

**`levelData` 结构（因 gameId 不同而异）：**

**wordFind（找成语）：**

```json
{
  "matrix": [
    ["国","风","轻"],
    ["泰","玩","合"],
    ["民","安","集"]
  ]
}
```

**charDiff（汉字找不同）：**

```json
{
  "matrix": [["奏","奏","奏"],["奏","秦","奏"],["奏","奏","奏"]],
  "diffAt": { "row": 1, "col": 1 },
  "base": "奏",
  "diff": "秦"
}
```

**poetryConnect（诗词连线）：**

```json
{
  "items": [
    { "id": "u1", "text": "床前明月光", "type": "upper" },
    { "id": "l1", "text": "疑是地上霜", "type": "lower" }
  ],
  "pairs": [["u1", "l1"]]
}
```

**失败响应：**

| HTTP 状态码 | code | 场景 |
|---|---|---|
| 400 | 400 | 缺少 gameId |
| 500 | 500 | 题库查询异常 |

---

### 6. 获取主题包数据

#### `GET /api/level/getThemeData`

获取指定主题包的完整数据。

**请求参数（Query String）：**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `themeId` | string | **是** | 主题包 ID |

**请求示例：**

```
GET /api/level/getThemeData?themeId=spring_festival
```

**成功响应（200）：**

```json
{
  "themeData": { ... },
  "material": { ... }
}
```

**失败响应：**

| HTTP 状态码 | code | 场景 |
|---|---|---|
| 400 | 400 | 缺少 themeId |
| 500 | 500 | 查询异常 |

---

### 7. 随机汉字找不同

#### `GET /api/level/getRandomCharDiff`

从 339 条题库中随机抽取一道「汉字找不同」题目，无需参数。

**请求示例：**

```
GET /api/level/getRandomCharDiff
```

**成功响应（200）：**

```json
{
  "code": 0,
  "data": {
    "base": "奏",
    "diff": "秦",
    "matrix": [["奏","奏","奏"],["奏","秦","奏"],["奏","奏","奏"]],
    "diffRow": 1,
    "diffCol": 1
  }
}
```

**无数据响应（200）：**

```json
{ "code": 404, "msg": "暂无题库数据" }
```

---

## 三、数据库表结构

### `t_user` — 用户表

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INT, AUTO_INCREMENT, PK | 主键 |
| `openid` | VARCHAR, UNIQUE | 微信 openid |
| `session_key` | VARCHAR | AES-256-GCM 加密后的 session_key |
| `nickname` | VARCHAR | 昵称 |
| `avatar` | VARCHAR | 头像 URL |
| `platform` | ENUM('wx','tiktok','others') | 来源平台，默认 `wx` |
| `create_time` | DATETIME | 创建时间 |
| `update_time` | DATETIME | 最后更新时间 |

### `t_user_progress` — 用户进度表

| 字段 | 类型 | 说明 |
|---|---|---|
| `openid` | VARCHAR | 用户标识 |
| `game_id` | VARCHAR | 游戏 ID |
| `level` | INT | 当前关卡 |
| `score` | INT | 分数 |

> 唯一键：`(openid, game_id)`，通过 ON DUPLICATE KEY UPDATE 实现 upsert。

### `t_level_word_find` — 找成语题库

### `t_level_char_diff` — 汉字找不同题库

### `t_level_poetry_connect` — 诗词连线题库

### `t_level_history` — 关卡出题历史（防重复）

---

## 四、SQL 迁移记录

### 2026-03-10：移除冗余字段，新增 platform

```sql
ALTER TABLE t_user
  DROP COLUMN unlock_game,
  DROP COLUMN unlock_theme,
  DROP COLUMN max_score,
  DROP COLUMN hidden_unlock,
  ADD COLUMN platform ENUM('wx', 'tiktok', 'others') NOT NULL DEFAULT 'wx' AFTER avatar;
```
