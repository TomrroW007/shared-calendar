# 流程图生成提示

用于生成 Mermaid 流程图和时序图的 AI 提示模板。

## Mermaid 流程图模板

```
graph TD
    A[开始] --> B{决策点}
    B -->|是| C[流程A]
    B -->|否| D[流程B]
    C --> E[结束]
    D --> E
```

## Mermaid 时序图模板

```
sequenceDiagram
    participant A as 用户
    participant B as 系统
    A->>B: 请求
    B->>B: 处理
    B->>A: 响应
```
