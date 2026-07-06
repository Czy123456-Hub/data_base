# 大宗农产品进口报告数据库

这是一个 GitHub Pages + Supabase 的交互式数据库。GitHub Pages 负责网页，Supabase 负责登录、数据库和权限。

## 已实现

- Supabase 邮箱登录/注册
- 企业备案产能查询、筛选、汇总
- 新增和修改企业备案记录
- admin 角色删除记录
- 当前查询结果导出 CSV
- Supabase RLS 权限控制
- 初始 31 家原糖加工生产企业备案产能种子数据

## 数据库部署

如果你已经把 Supabase 连接到这个 GitHub 仓库，确认它会执行 `supabase/migrations` 下的 SQL。

也可以在 Supabase SQL Editor 里按顺序执行：

1. `supabase/migrations/20260702000000_init.sql`
2. `supabase/migrations/20260702001000_seed_enterprises.sql`

第一个用户注册后默认是 `viewer`，需要在 Supabase SQL Editor 里提升为管理员：

```sql
update public.profiles
set role = 'admin'
where email = '你的邮箱@example.com';
```

角色规则：

- `viewer`：查询和导出
- `editor`：查询、新增、修改
- `admin`：查询、新增、修改、删除、授权

## GitHub Pages 配置

在 GitHub 仓库设置两个 Secrets：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

然后进入 `Settings` → `Pages`，Source 选择 `GitHub Actions`。推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会自动生成 `config.js` 并部署页面。

## 本地预览

复制配置文件：

```bash
cp config.example.js config.js
```

填入 Supabase 项目的 URL 和 anon key 后启动本地服务器：

```bash
python3 -m http.server 8000
```

打开 `http://localhost:8000`。

## 表结构

核心表：

- `profiles`：用户角色
- `enterprises`：备案企业和备案产能
- `import_reports`：进口报告
- `documents`：来源文件和附件索引

当前页面先接入了 `enterprises`，后续可以继续把进口合同、发运抵港、许可证扣减、附件上传做成独立页面。

## 2026-07-06 功能升级

新增模块：`备案产能和自动进口证发放比例`

新增能力：

- 数据库模块命名：`database_modules`
- 企业备案产能按 Excel 口径更新
- 2025 / 2026 年自动进口许可证额度维护
- 自动计算年度发放比例：`自动证额度 / 备案产能 / 10000`
- 登录用户均可查阅、编辑、删除
- 自动记录每次新增、修改、删除
- 操作历史中可撤回上一次错误编辑

已新增两个迁移文件，需要在 Supabase SQL Editor 里按顺序执行：

1. `supabase/migrations/20260706000000_license_ratio_module.sql`
2. `supabase/migrations/20260706001000_seed_license_allocations.sql`

第一个文件会调整库表、权限和撤回函数；第二个文件会导入 `2026年自动进口许可证发放情况0519.xlsx` 的 31 行数据。
