# 大宗农产品进口报告数据库

这是一个 GitHub Pages + Supabase 的交互式数据库。GitHub Pages 负责网页，Supabase 负责登录、数据库和权限。

## 已实现

- Supabase 邮箱登录/注册
- 业务模块工作台，当前接入 `备案产能和自动进口证发放比例`
- 其他大模块入口占位，后续可以继续扩展独立数据库模块
- 企业备案产能、自动进口证额度查询、筛选、汇总
- 登录用户新增、修改、删除企业备案记录
- 操作历史和错误编辑撤回
- 当前查询结果导出 CSV
- Supabase RLS 权限控制
- 合并后的 31 家原糖加工企业备案产能和自动证 seed 数据
- 浅蓝色业务系统界面

## 数据库部署

如果你已经把 Supabase 连接到这个 GitHub 仓库，确认它会执行 `supabase/migrations` 下的 SQL。

也可以在 Supabase SQL Editor 里按顺序执行：

1. `supabase/migrations/20260702000000_init.sql`
2. `supabase/migrations/20260706000000_license_ratio_module.sql`
3. `supabase/migrations/20260706001000_seed_license_allocations.sql`

当前模块的权限口径是：只要用户通过 Supabase 登录，就可以查阅、新增、修改、删除，并可在操作历史里撤回错误编辑。`profiles.role` 字段仍保留，后续如果要做管理员审批或分级权限，可以继续使用。

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
- 页面上以大模块方式组织业务数据库
- 企业备案产能按 Excel 口径更新
- 2025 / 2026 年自动进口许可证额度维护
- 自动计算年度发放比例：`自动证额度 / 备案产能 / 10000`
- 登录用户均可查阅、编辑、删除
- 自动记录每次新增、修改、删除
- 操作历史中可撤回上一次错误编辑

已新增两个迁移文件，需要在 Supabase SQL Editor 里按顺序执行：

1. `supabase/migrations/20260706000000_license_ratio_module.sql`
2. `supabase/migrations/20260706001000_seed_license_allocations.sql`

第一个文件会调整库表、权限和撤回函数；第二个文件是合并后的权威 seed，会导入省市、统计地区、备案产能、2025/2026 自动证额度等 31 行数据。
