# CloudBase 迁移说明

## 环境

- 环境 ID：`database200713-d7gpx3anl9853af10`
- 地域：`ap-shanghai`
- 前端默认仍部署在 GitHub Pages

## 控制台步骤

1. 进入腾讯云 CloudBase 控制台，打开环境 `database200713-d7gpx3anl9853af10`
2. 在身份认证中开启邮箱/密码登录
3. 在数据库中创建这些集合：
   - `database_modules`
   - `profiles`
   - `enterprises`
   - `port_berths`
   - `shipping_agents`
   - `record_audit_logs`
4. 先保持默认权限，后续确认页面能读数据后再细化安全规则
5. 推送代码后，GitHub Pages 会生成 CloudBase 配置并部署

## 集合用途

- `database_modules`：模块名称和描述
- `profiles`：登录用户资料和角色
- `enterprises`：备案产能和自动进口证发放比例
- `port_berths`：港口吃水、泊位和载重吨信息
- `shipping_agents`：船代公司通讯录
- `record_audit_logs`：新增、修改、删除和撤回记录

## 注意

CloudBase 不会执行 Supabase 的 SQL migration。当前已把现有 seed 数据转成 `cloudbase/import/` 下的 JSON / JSONL 文件。

## 导入数据

在 CloudBase 控制台进入对应集合，点击“导入数据”，按下面顺序导入：

1. `database_modules`：导入 `cloudbase/import/database_modules.json`
2. `enterprises`：导入 `cloudbase/import/enterprises.json`
3. `port_berths`：导入 `cloudbase/import/port_berths.json`
4. `shipping_agents`：导入 `cloudbase/import/shipping_agents.json`

`profiles` 和 `record_audit_logs` 先保持空集合，不需要导入。

如果控制台不接受 `.json` 数组文件，就改用同名 `.jsonl` 文件，例如 `cloudbase/import/enterprises.jsonl`。

重新生成导入文件：

```bash
python3 scripts/build_cloudbase_imports.py
```
