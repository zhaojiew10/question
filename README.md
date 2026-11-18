# 题库

用于分类、整理选择题，并为后续的单页刷题应用提供结构化数据。

## 当前统计

| 科目 | 章节 | 已入库 | 待补全 |
| --- | --- | ---: | ---: |
| 人工智能 | 大语言模型推理 | 6 | 2 |

重复截图中的相同题目只保留一份；题干、选项或正确答案不完整的内容不会直接混入正式题库。

## 目录

```text
data/
  questions/
    ai-llm-inference.json   # 正式题目
  review/
    incomplete.md           # 待补全或内容异常的题目
sources/
  llm-inference/             # 原始截图，用于复核
```

## 题目字段

- `id`：稳定且唯一的英文标识
- `subject` / `chapter` / `knowledgePoints`：分类信息
- `type`：`single` 表示单选，`multiple` 表示多选
- `difficulty`：`easy`、`medium`、`hard`
- `stem` / `options`：题干和选项
- `answer`：正确答案的选项键数组，单选题也统一使用数组
- `explanation`：答案解析
- `source` / `sourceOrder`：原始资料及题目在资料中的顺序

## 本地预览

```bash
python -m http.server 4173 --bind 127.0.0.1
```

访问 `http://127.0.0.1:4173/`。

## GitHub Pages 部署

Workflow 位于 `.github/workflows/deploy-pages.yml`。推送到 `main` 或在 Actions 中手动运行 **Deploy to GitHub Pages** 即可发布，无需构建。

首次部署前，请在仓库的 **Settings → Pages → Build and deployment** 中，将 **Source** 设置为 **GitHub Actions**。部署后访问：

`https://zhaojiew10.github.io/question/`
