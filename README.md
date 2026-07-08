# 大宗农产品进口报告数据库

这是一个 GitHub Pages + 云端数据库的交互式数据库。当前默认接入腾讯云 CloudBase，仍保留 Supabase 适配器作为备用。

## 已实现

- CloudBase / Supabase 邮箱登录适配
- 业务模块工作台，当前接入 `备案产能和自动进口证发放比例`、`港口与船代信息`
- 其他大模块入口占位，后续可以继续扩展独立数据库模块
- 企业备案产能、自动进口证额度查询、筛选、汇总
- 港口吃水、码头泊位、船代通讯录查询和导出
- 登录用户新增、修改、删除企业备案记录
- 操作历史和错误编辑撤回
- 当前查询结果导出 CSV
- 云端数据库权限控制
- 合并后的 31 家原糖加工企业备案产能和自动证 seed 数据
- 浅蓝色业务系统界面

## CloudBase 部署

当前 CloudBase 环境 ID：

```text
database200713-d7gpx3anl9853af10
```

在腾讯云 CloudBase 控制台里先完成：

1. 进入环境 `database200713-d7gpx3anl9853af10`
2. 开启身份认证里的邮箱/密码登录
3. 在数据库里创建集合：
   - `database_modules`
   - `profiles`
   - `enterprises`
   - `port_berths`
   - `shipping_agents`
   - `record_audit_logs`
4. 数据库安全规则先设为登录用户可读写，后续再细化角色权限

页面首次登录后会自动写入 `profiles` 和主模块配置；业务 seed 数据仍需要从现有 Supabase SQL / Excel 转成 CloudBase JSON 后导入。

CloudBase 导入文件已生成在 `cloudbase/import/`，具体导入顺序见 `cloudbase/README.md`。

## Supabase 部署

如果你已经把 Supabase 连接到这个 GitHub 仓库，确认它会执行 `supabase/migrations` 下的 SQL。

也可以在 Supabase SQL Editor 里按顺序执行：

1. `supabase/migrations/20260702000000_init.sql`
2. `supabase/migrations/20260706000000_license_ratio_module.sql`
3. `supabase/migrations/20260706001000_seed_license_allocations.sql`
4. `supabase/migrations/20260706002000_port_logistics_module.sql`
5. `supabase/migrations/20260706003000_seed_port_logistics.sql`

当前模块的权限口径是：只要用户通过 Supabase 登录，就可以查阅、新增、修改、删除，并可在操作历史里撤回错误编辑。`profiles.role` 字段仍保留，后续如果要做管理员审批或分级权限，可以继续使用。

## GitHub Pages 配置

CloudBase 默认配置已写在部署脚本里。也可以在 GitHub 仓库设置 Secrets 覆盖：

- `APP_PROVIDER` = `cloudbase`
- `CLOUDBASE_ENV_ID` = `database200713-d7gpx3anl9853af10`
- `CLOUDBASE_REGION` = `ap-shanghai`

如果要切回 Supabase，再设置：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

然后进入 `Settings` → `Pages`，Source 选择 `GitHub Actions`。推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会自动生成 `config.js` 并部署页面。

## 本地预览

复制配置文件：

```bash
cp config.example.js config.js
```

默认已经填入 CloudBase 环境 ID。如需切换后端，修改 `provider` 后启动本地服务器：

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
- `port_berths`：港口、码头、泊位、吃水和最大载重吨
- `shipping_agents`：港口船代公司和通讯录

当前页面先接入了 `enterprises`、`port_berths` 和 `shipping_agents`，后续可以继续把进口合同、发运抵港、许可证扣减、附件上传做成独立页面。

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

## 2026-07-06 港口模块

新增模块：`港口与船代信息`

新增能力：

- 港口吃水和最大载重吨查询
- 港口、码头、泊位、夏天海水密度和特殊要求维护
- 船代公司、电话、传真、邮箱、联系人和原始文本导入
- 当前查询结果导出 CSV

需要在 Supabase SQL Editor 里继续执行：

1. `supabase/migrations/20260706002000_port_logistics_module.sql`
2. `supabase/migrations/20260706003000_seed_port_logistics.sql`

第二个文件来自 `中国港口信息.xlsx`，会导入 57 条港口吃水记录和 16 条船代通讯录记录。

如果后续更新船代通讯录 Excel，可以用 `scripts/generate_shipping_agents_seed.py` 重新生成 `shipping_agents` seed 段，避免电话、传真和联系人字段互相混在一起。
