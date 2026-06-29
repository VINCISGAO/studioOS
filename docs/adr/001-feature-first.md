# ADR-001: Feature First Architecture

**Status:** Accepted

## Context

MVC / 巨型 utils 目录难以维护，Cursor 容易生成散乱代码。

## Decision

采用 `features/{name}/` 模块，每个 Feature 含 service、state-machine、actions、repository。

## Consequences

- 禁止 misc/helpers2/temp
- 页面 ≤100 行，组件 ≤300 行
