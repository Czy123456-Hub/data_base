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
4. 先把数据库安全规则设置为登录用户可读写
5. 推送代码后，GitHub Pages 会生成 CloudBase 配置并部署

## 集合用途

- `database_modules`：模块名称和描述
- `profiles`：登录用户资料和角色
- `enterprises`：备案产能和自动进口证发放比例
- `port_berths`：港口吃水、泊位和载重吨信息
- `shipping_agents`：船代公司通讯录
- `record_audit_logs`：新增、修改、删除和撤回记录

## 注意

CloudBase 不会执行 Supabase 的 SQL migration。后续需要把现有 seed 数据转成 CloudBase 可导入的 JSON，或通过脚本批量写入集合。
