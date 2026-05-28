---
title: 搜索引擎技巧
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 搜索引擎

## 1.1. 字符匹配
- “” 双引号表示完全匹配，结果中必须出现与搜索文本完全相同的内容。
- A -B 搜索包含A但不包含B的结果（请注意A后面的空格不能省略）
- A + B，搜索这两个关键字的结果

## 1.2. site网站限制
- 校园招聘 site:edu.cn
- 雄安新区 site:gov.cn

## 1.3. filetype
- 新媒体行业报告 filetype:pdf

## 1.4. 组合搜索

- `site:github.com ollama filetype:md`：限定站点并指定文件类型。
- `"分布式锁" site:infoq.cn`：精确匹配主题并限定中文技术站点。
- `kafka 慢查询 -flink`：查 Kafka 问题时排除无关技术栈。

## 1.5. 实际使用建议

- 先搜英文关键词，再搜中文关键词，结果通常更全。
- 技术问题优先加 `github`、`official`、`docs`、`stackoverflow` 等限定词。
- 资料查找优先加 `pdf`、`ppt`、`白皮书`、`教程` 等后缀词。
