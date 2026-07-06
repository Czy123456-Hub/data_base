with module as (
  select id from public.database_modules where slug = 'capacity_license_ratio'
),
rows(code, enterprise_name, province, city, region_label, capacity_10k_tons, license_2025_tons, license_2026_tons, group_name) as (
  values
    ('R001', '依安东方瑞雪糖业有限责任公司', '黑龙江', '齐齐哈尔', '东北', 30, 60000, 18000, '其他'),
    ('R002', '齐齐哈尔鹏程北方糖业股份有限公司', '黑龙江', '齐齐哈尔', '东北', 30, 60000, 18000, '其他'),
    ('R003', '内蒙古佰惠生新农业科技股份有限公司', '内蒙古', null, '内蒙', 15, 15000, 15000, '其他'),
    ('R004', '赤峰众益糖业有限公司', '内蒙古', '赤峰', '内蒙', 30, 45000, 15000, '其他'),
    ('R005', '中粮糖业辽宁有限公司', '辽宁', null, '东北', 100, 200000, 65000, '中粮'),
    ('R006', '营口新北方制糖有限公司', '辽宁', '营口', '东北', 33, 66000, 19800, '其他'),
    ('R007', '中粮（唐山）糖业有限公司', '河北', '唐山', '河北', 100, 200000, 50000, '中粮'),
    ('R008', '山东星光糖业有限公司', '山东', null, '山东', 80, 160000, 52000, '其他'),
    ('R009', '乐陵市星都精炼糖有限公司', '山东', '乐陵', '山东', 100, 200000, 65000, '其他'),
    ('R010', '日照市凌云海糖业集团有限公司', '山东', '日照', '山东', 180, 360000, 117000, '其他'),
    ('R011', '江苏白玫糖业有限公司', '江苏', null, '江苏', 20, 40000, 13000, '其他'),
    ('R012', '大丰英茂糖业有限公司', '江苏', '盐城', '江苏', 100, 200000, 65000, '其他'),
    ('R013', '镇江南华糖业有限公司', '江苏', '镇江', '江苏', 50, 75000, 25000, '其他'),
    ('R014', '漳州市白玉兰精糖有限公司', '福建', '漳州', '福建', 11, 22000, 5500, '其他'),
    ('R015', '华东（福建）精炼糖有限公司', '福建', null, '福建', 30, 60000, 15000, '其他'),
    ('R016', '福建糖业股份有限公司', '福建', null, '福建', 45, 67500, 29250, '其他'),
    ('R017', '福建同发糖业有限公司', '福建', null, '福建', 50, 100000, 32500, '其他'),
    ('R018', '广州华糖食品有限公司', '广东', '广州', '广东', 30, 60000, 21000, '其他'),
    ('R019', '东莞市制糖厂有限公司', '广东', '东莞', '广东', 100, 200000, 65000, '其他'),
    ('R020', '亚联糖业（广东）有限公司', '广东', null, '广东', 9, 18000, 5850, '其他'),
    ('R021', '广东华糖实业有限公司', '广东', null, '广东', 60, 120000, 36000, '其他'),
    ('R022', '中粮崇左糖业有限公司', '广西', '崇左', '广西', 30, 60000, 15000, '中粮'),
    ('R023', '广西东亚扶南精糖有限公司', '广西', null, '广西', 10, 20000, 5000, '其他'),
    ('R024', '广西海棠东亚糖业有限公司', '广西', null, '广西', 10, 20000, 5000, '其他'),
    ('R025', '广西崇左东亚糖业有限公司', '广西', '崇左', '广西', 30, 60000, 18000, '其他'),
    ('R026', '广西糖业集团防城精制糖有限公司', '广西', '防城港', '广西', 30, 60000, 20000, '其他'),
    ('R027', '广西糖业集团柳兴制糖有限公司', '广西', null, '广西', 35, 70000, 23000, '其他'),
    ('R028', '广东金岭糖业集团有限公司', '广东', null, '广东', 60, 120000, 36000, '其他'),
    ('R029', '湛江金路糖业有限公司', '广东', '湛江', '广东', 60, 120000, 36000, '其他'),
    ('R030', '湛江华资农垦糖业发展有限公司广丰分公司', '广东', '湛江', '广东', 30, 60000, 18000, '其他'),
    ('R031', '中粮北海糖业有限公司', '广西', '北海', '广西', 15, 23000, 8000, '中粮')
)
insert into public.enterprises (
  module_id, code, enterprise_name, province, city, region_label, group_name,
  capacity_10k_tons, license_2025_tons, license_2026_tons, status, source_document
)
select
  module.id,
  rows.code,
  rows.enterprise_name,
  rows.province,
  rows.city,
  rows.region_label,
  rows.group_name,
  rows.capacity_10k_tons,
  rows.license_2025_tons,
  rows.license_2026_tons,
  '已备案',
  '2026年自动进口许可证发放情况0519.xlsx'
from rows
cross join module
on conflict (code) do update
set
  module_id = excluded.module_id,
  enterprise_name = excluded.enterprise_name,
  province = excluded.province,
  city = excluded.city,
  region_label = excluded.region_label,
  group_name = excluded.group_name,
  capacity_10k_tons = excluded.capacity_10k_tons,
  license_2025_tons = excluded.license_2025_tons,
  license_2026_tons = excluded.license_2026_tons,
  status = excluded.status,
  source_document = excluded.source_document,
  updated_at = now();
