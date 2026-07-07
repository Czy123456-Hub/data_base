with module as (
  select id from public.database_modules where slug = 'port_agency_info'
),
rows (code, location, port_name, terminal_name, berth, draft_m, max_dwt_tons, summer_density, special_requirements) as (
values
  ('PB001', '辽宁营口', '鲅鱼圈港', null, '26', 13, 105000, '1.018-1.023', null),
  ('PB002', '辽宁营口', '鲅鱼圈港', null, null, 14.2, 85000, '1.018-1.023', null),
  ('PB003', '辽宁葫芦岛', '葫芦岛港', null, null, 13.5, 85000, null, null),
  ('PB004', '辽宁锦州', '锦州港', null, null, 14.5, 105000, null, null),
  ('PB005', '辽宁大连', '北良港', null, '2', 13, 85000, null, '货量70000吨左右'),
  ('PB006', '河北唐山', '曹妃甸港', '西港码头', null, 13.5, 105000, '1.02', '货量不超过65000吨'),
  ('PB007', '河北唐山', '曹妃甸港', '通用码头', null, 15, 105000, '1.02', null),
  ('PB008', '河北唐山', '曹妃甸港', '弘毅码头', null, 18, 175000, '1.02', null),
  ('PB009', '河北沧州', '黄骅港', null, null, 14.5, 105000, '1.019-1.020', '航道吃水14.5米'),
  ('PB010', '天津', '天津港', '汇盛码头', '35/36', 15, 105000, '1.0025', null),
  ('PB011', '天津', '天津港', '四公司', '19', 15, 105000, '1.0025', null),
  ('PB012', '山东日照', '日照港', '一公司', '南7/8', 14.2, 85000, '1.020-1.021', '航道吃水12.2米，潮水0.45-4.5米'),
  ('PB013', '山东日照', '日照港', '一公司', '西19', 18.2, 225000, '1.020-1.021', '航道吃水17米'),
  ('PB014', '山东青岛', '青岛港', '董家口', 'D6', 14.5, 135000, '1.020-1.021', '泊位长度304，近矿石码头'),
  ('PB015', '山东青岛', '青岛港', '董家口', 'D7', 15, 135000, '1.020-1.021', '泊位长度248，近矿石码头'),
  ('PB016', '山东青岛', '青岛港', '董家口', 'B31', 15.3, 85000, '1.020-1.021', '泊位长度297.6，专用粮食泊位进粮罐'),
  ('PB017', '山东青岛', '青岛港', '董家口', 'B32', 15.3, 85000, '1.020-1.021', '泊位长度147，专用粮食泊位进粮罐'),
  ('PB018', '山东青岛', '青岛港', '董家口', 'D20', 15, 105000, '1.020-1.021', '泊位长度276，灌容不足占用'),
  ('PB019', '江苏连云港', '连云港', '东方码头', '81/82', 18.3, 185000, null, null),
  ('PB020', '江苏盐城', '大丰港', '粮食码头', null, 13, 100000, '1.017', '泊位长度250米'),
  ('PB021', '江苏盐城', '大丰港', null, null, 14.5, 82000, '1.017', null),
  ('PB022', '江苏盐城', '大丰港', '通用码头', '1#', 13.5, 100000, '1.017', '泊位长度280米'),
  ('PB023', '江苏盐城', '大丰港', '通用码头', '2#', 13.5, 100000, '1.017', '泊位长度280米'),
  ('PB024', '江苏南通', '南通港', null, null, 11.8, 80000, null, '货量5-6万吨'),
  ('PB025', '江苏镇江', '镇江港', '大港码头', null, 11.36, 85000, null, '船长不超过250米'),
  ('PB026', '浙江舟山', '舟山港', '综保码头', null, 14.5, 85000, '1.016', null),
  ('PB027', '浙江温州', '温州港', '乐清湾码头', null, 13.8, 85000, null, null),
  ('PB028', '广东广州', '南沙港', null, null, 13.8, 82000, '1.021', '若超过13.8米吃水需在沙角减载，沙角锚地14.5米水深'),
  ('PB029', '广东广州', '黄埔港', null, null, 11, 50000, '1.021', '若超过11米吃水需在沙角减载，沙角锚地14.5米水深'),
  ('PB030', '广东湛江', '湛江港', null, '405', 14.5, 170000, '1.017-1.019', '需要在405或402号泊位减载后移泊到408号泊位卸货（如后面有船等）'),
  ('PB031', '广东湛江', '湛江港', null, '401', 14.1, 170000, '1.017-1.019', '需要在405或402号泊位减载后移泊到408号泊位卸货（如后面有船等）'),
  ('PB032', '广东湛江', '湛江港', null, '402', 14.1, 170000, '1.017-1.019', '需要在405或402号泊位减载后移泊到408号泊位卸货（如后面有船等）'),
  ('PB033', '广东珠海', '高栏港', '国码1期', '1', 11.5, 22500, null, '码头前沿9.1米，航道15.6米'),
  ('PB034', '广东珠海', '高栏港', '国码1期', '2', 11.8, 27500, null, '码头前沿11.2米，航道15.6米'),
  ('PB035', '广东珠海', '高栏港', '国码1期', '3-4', 15.6, 85000, null, '码头前沿14.6米，航道15.6米'),
  ('PB036', '广东珠海', '高栏港', '国码2期', '1', 15.6, 115000, null, '码头前沿15.6米，航道15.6米'),
  ('PB037', '广东珠海', '高栏港', '国码2期', '2', 15.6, 115000, null, '码头前沿15.6米，航道15.6米'),
  ('PB038', '广东珠海', '高栏港', '国码2期', '3', 15.6, 115000, null, '码头前沿15.6米，航道15.6米'),
  ('PB039', '广东珠海', '高栏港', '国码2期', '4', 15.6, 55000, null, '码头前沿15.6米，航道15.6米'),
  ('PB040', '广东珠海', '高栏港', '国码2期', '5', 15.6, 35000, null, '码头前沿15.6米，航道15.6米'),
  ('PB041', '广东珠海', '高栏港', '国码2期', '6', 15.6, 35000, null, '码头前沿15.6米，航道15.6米'),
  ('PB042', '广西北海', '铁山港', null, '2', 14.5, 100000, '1.022', '航道水深14.5米，泊位水深16.5米'),
  ('PB043', '广西防城港', '防城港', '粮食码头', '7', 9.2, 50000, '1.0175—1.022', '航道水深9.2米，DWT可超规70000吨'),
  ('PB044', '广西防城港', '防城港', '粮食码头', '8', 9.6, 50000, '1.0175—1.022', '航道水深9.2米，DWT可超规70000吨'),
  ('PB045', '广西防城港', '防城港', '粮食码头', '11', 13, 75000, '1.0175—1.022', '航道水深11米，DWT可超规80000吨'),
  ('PB046', '广西防城港', '防城港', '粮食码头', '12', 13, 75000, '1.0175—1.022', '航道水深11米，DWT可超规80000吨'),
  ('PB047', '广西防城港', '防城港', '粮食码头', '13', 13.5, 75000, '1.0175—1.022', '航道水深12.5米，DWT可超规85000吨'),
  ('PB048', '福建漳州', '漳州港', '漳州招商局码头
（招银码头）', '3', 12, 65000, '1.02', '长度363米'),
  ('PB049', '福建漳州', '漳州港', '漳州招商局码头
（招银码头）', '4', 12.37, 85000, '1.02', '长度208米'),
  ('PB050', '福建漳州', '漳州港', '漳州招商局码头
（招银码头）', '5', 12.37, 85000, '1.02', '长度200米，航道水深9.3米，等潮水靠泊'),
  ('PB051', '福建漳州', '漳州港', '漳州招商局码头
（招银码头）', '7', 14.5, 104999, '1.02', '长度324米，航道水深11.1米，等潮水靠泊'),
  ('PB052', '福建漳州', '漳州港', '漳州招商局码头
（招银码头）', '8', 12, 55000, '1.02', '长度482米'),
  ('PB053', '福建漳州', '漳州港', '漳州招商局码头
（招银码头）', '9', 12, 55000, '1.02', '长度482米'),
  ('PB054', '福建漳州', '漳州港', '漳州招商局厦门湾港务码头
（后石码头）', '3', 14, 85000, '1.02', '长度422米，航道水深12.4米，无夜航，卸率8-9K/天'),
  ('PB055', '福建厦门', '厦门港', '现代码头', null, 13, 85000, '1.02', '船长240米，宽50米'),
  ('PB056', '福建厦门', '厦门港', '东都码头', '21', 13, 65000, '1.02', '船长240米，宽50米'),
  ('PB057', '福建厦门', '厦门港', '海昌码头', '21', 12, 65000, '1.02', '船长260米，宽50米')
)
insert into public.port_berths (
  module_id, code, location, port_name, terminal_name, berth, draft_m, max_dwt_tons,
  summer_density, special_requirements, source_document
)
select
  module.id, rows.code, rows.location, rows.port_name, rows.terminal_name, rows.berth,
  rows.draft_m, rows.max_dwt_tons, rows.summer_density, rows.special_requirements,
  '中国港口信息.xlsx'
from rows
cross join module
on conflict (code) do update
set
  module_id = excluded.module_id,
  location = excluded.location,
  port_name = excluded.port_name,
  terminal_name = excluded.terminal_name,
  berth = excluded.berth,
  draft_m = excluded.draft_m,
  max_dwt_tons = excluded.max_dwt_tons,
  summer_density = excluded.summer_density,
  special_requirements = excluded.special_requirements,
  source_document = excluded.source_document,
  updated_at = now();

with module as (
  select id from public.database_modules where slug = 'port_agency_info'
),
rows (code, port_name, agency_name, address, tel, fax, email, contact_persons, raw_text) as (
values
  ('SA001', '防城港', 'China Ocean Shipping Agency Fangcheng (Penavico fangcheng)', '18 Friendship avenue gangkou district fangchenggang city,', '86-770-2821790,', '86-770-2822083', 'shipping@penavicofc.com', 'Pic: Mr.Hong Xuzhen ((A.G.Manager & Manager of Shipping Department)) Direct line:86-770-6102209 Mobile Phone:86-18677000832 / Ms.Lynda Lin (Deputy Manager of Shipping Department) Direct line:86-770-6102206 Mobile Phone:86-13507708234 / Mr.Andy Feng (Deputy Manager of Shipping Department) Direct line:86-770-6102208 Mobile Phone:86-18607705789', 'China Ocean Shipping Agency Fangcheng (Penavico fangcheng)
Add:18 Friendship avenue gangkou district fangchenggang city,
Zip code:538001
Tel:86-770-2821790,
Fax:86-770-2822083
Email:shipping@penavicofc.com
Pic: Mr.Hong Xuzhen ((A.G.Manager & Manager of Shipping Department)) Direct line:86-770-6102209  Mobile Phone:86-18677000832
      Ms.Lynda Lin   (Deputy Manager of Shipping Department) Direct line:86-770-6102206  Mobile Phone:86-13507708234
      Mr.Andy Feng    (Deputy Manager of Shipping Department) Direct line:86-770-6102208  Mobile Phone:86-18607705789'),
  ('SA002', '青岛', 'Qingdao Ocean Favor Int''l Shipping Agency Co., Ltd', 'Room 1-Bing 1, Yi Zhong Gao Shan, 26 Jingde Road,', '86-532- 82865727,82881160,82881131,66883318 (24hrs)', '86-532- 66882669', 'qingdao@oceanfavor.com', 'PIC: Ms. Luan Yan (86-13706346822)', 'Qingdao Ocean Favor Int''l Shipping Agency Co., Ltd
Add: Room 1-Bing 1, Yi Zhong Gao Shan, 26 Jingde Road,
Shinan District, Qingdao, China  Post code: 266073
Tel : 86-532- 82865727,82881160,82881131,66883318 (24hrs)
Fax : 86-532- 66882669
E-mail: qingdao@oceanfavor.com
PIC: Ms. Luan Yan (86-13706346822)'),
  ('SA003', '青岛', 'China Ocean Shipping Agency, Qingdao (Penavico Qingdao）', null, '0086-532-82916539,0086-532-82651555,0086-532-82653300/3330 (24hrs) / 0086-185-61568656', '0086-532-82655800', 'fanghao@penavicoqd.com / shipping@penavicoqd.com', null, 'China Ocean Shipping Agency, Qingdao (Penavico Qingdao）
11F,No.21 Wuxia Road, Qingdao, P.R.China
Post Code 266002
Tel:0086-532-82916539,0086-532-82651555,0086-532-82653300/3330 (24hrs)
Mob:0086-185-61568656
Fax:0086-532-82655800
Email: fanghao@penavicoqd.com,shipping@penavicoqd.com'),
  ('SA004', '鲅鱼圈', 'CHINA OCEAN SHIPPING AGENCY, YINGKOU', 'Penavico Bldg. Xingang Rd. #1, Bayuquan Dist.Yingkou,China', '0417-6152002(Direct Line)6151639 (24Hrs Service) / 18624178795', '0417-6151637', 'shipping@penavicoyk.com', null, 'CHINA OCEAN SHIPPING AGENCY, YINGKOU
Add:Penavico Bldg. Xingang Rd. #1, Bayuquan Dist.Yingkou,China
Tel:0417-6152002(Direct Line)6151639 (24Hrs Service)
Fax:0417-6151637
Mobile:18624178795
E-mail: shipping@penavicoyk.com'),
  ('SA005', '南通', 'Nantong Singa Int''l Ocean Shipping Agency Ltd.', '16F, Overseas Friendship Building, 88# South Gongnong Road, Nantong, China', '86-513-83519998(24hrs), / +86-13809080069', '86-513-51012111', 'shpg@singant.com.cn', null, 'Nantong Singa Int''l Ocean Shipping Agency Ltd.
Add:16F, Overseas Friendship Building, 88# South Gongnong Road, Nantong, China
TEL:86-513-83519998(24hrs),
Mob:+86-13809080069
Fax:86-513-51012111
James Wang
E-mail:shpg@singant.com.cn'),
  ('SA006', '锦州', 'Jinzhou Ocean Favor Shipping Agency Co., Ltd', 'NO.2, TIAN GANG HUA YUAN, JINZHOU ECONOMIC &TECHNOLOGY DEVELOPING ZONE, JINZHOU CITY, LIAONING, CHINA.', '0416-7906077 / 0416 7906055 / 138 9838 8689 / 0416 7906077 / 139 4168 0186 / 135 0406 3682', 'NO.: 0416-357 9377', 'jinzhou@oceanfavor.com', 'Contact Details: / PIC：Cao Fuxiang / OPERATION MANAGER: LIU TONG', 'Jinzhou Ocean Favor Shipping Agency Co., Ltd
ADDRESS: NO.2, TIAN GANG HUA YUAN, JINZHOU ECONOMIC &TECHNOLOGY DEVELOPING ZONE, JINZHOU CITY, LIAONING, CHINA.
POST CODE: 121007
TELE NO: 0416-7906077
FAX NO.: 0416-357 9377
E-MAIL: jinzhou@oceanfavor.com
VHF: CHANNEL 16 EXT 86+416 7906077
Contact Details:
PIC：Cao Fuxiang
Office phone：0416 7906055
Cell phone：138 9838 8689
OPERATION MANAGER: LIU TONG
Office phone：0416 7906077
Cell phone：139 4168 0186
BOARDING AGENT: FENG BIAO
Office phone：0416 7906077
Cell phone：135 0406 3682'),
  ('SA007', '湛江', 'ZHANJIANG PACIFIC INTERNATIONAL SHIPPING AGENCY LTD', 'Room A1706,17/F Yifu Building,No.28 Renmin Road South,Xiashan Zhanjiang,Guangdong,China', '+86 759 2299722 /2299829 / +86 13902502624', '+86 759 2299860', 'pacificshipping@vip.163.com / pacificshipping@21cn.net / shipping@zjpacific.com', 'PIC:MR LUO ZICONG', 'ZHANJIANG PACIFIC INTERNATIONAL SHIPPING AGENCY LTD
Add:Room A1706,17/F Yifu Building,No.28 Renmin Road South,Xiashan Zhanjiang,Guangdong,China
Postcode:524001
Tel:+86 759 2299722 /2299829
Fax:+86 759 2299860
Email:pacificshipping@vip.163.com
pacificshipping@21cn.net, shipping@zjpacific.com
PIC:MR LUO ZICONG
Mob:+86 13902502624
Website: www.zjpacific.com'),
  ('SA008', '大丰港', 'YANCHENG LIANFENG INTERNATIONAL SHIPPING AGENCY CO., LTD.', 'Room 2001, Building 1, Fiancial City, No.5 Century Boulevard, Yancheng City, Jiangsu, China', '0086-0515-88356662', '0086-0515-88352085', 'lfcd@lfshippingagency.com', '(00860)13770028333 (Mr.Paul Xu) / (00860)13851087699 (Mr.Jemery Zheng) / (00860)13851050946 (Ms.Iris Dong) / (00860)13770066556 (Ms.Sheila Shi)', 'YANCHENG LIANFENG INTERNATIONAL SHIPPING AGENCY CO., LTD.
ADD:Room 2001, Building 1, Fiancial City, No.5 Century Boulevard, Yancheng City, Jiangsu, China
TEL: 0086-0515-88356662
FAX: 0086-0515-88352085
E-mail: lfcd@lfshippingagency.com
MOB:     (00860)13770028333  (Mr.Paul Xu)
     (00860)13851087699 (Mr.Jemery Zheng)
     (00860)13851050946 (Ms.Iris Dong)
     (00860)13770066556 (Ms.Sheila Shi)'),
  ('SA009', '南沙港', 'GUANGZHOU CIRCLE INTERNATIONAL SHIPPING AGENCY CO., LTD', '3/F, NO. 319, GANGQIAN ROAD, HUANGPU, GUANGZHOU, 510700 P. R. CHINA', '86-20-82290475 / 82293013 / 82280755 / 82292973', '86-20-82274386', 'OPERATION@CIRCLELOG.COM', 'VICE GENERAL MANAGER: WAVE ZHANG +86-20-82290475 / MARKETING MANAGER: JAMES ZHANG +86-20-82273302 / SHIPPING MANAGER: ALEX WU +86-20-82292973 / DOCUMENT MANAGER: MONA ZHANG +86-20-82293061', 'GUANGZHOU CIRCLE INTERNATIONAL SHIPPING AGENCY CO., LTD
ADDRESS：3/F, NO. 319, GANGQIAN ROAD, HUANGPU, GUANGZHOU, 510700 P. R. CHINA
TEL: 86-20-82290475 / 82293013 / 82280755 / 82292973
FAX: 86-20-82274386
TLX: 051 94076045 GZCT G
E-MAIL:OPERATION@CIRCLELOG.COM

VICE GENERAL MANAGER: WAVE ZHANG                  +86-20-82290475
MARKETING MANAGER: JAMES ZHANG                    +86-20-82273302
SHIPPING MANAGER: ALEX WU                            +86-20-82292973
DOCUMENT MANAGER: MONA ZHANG                     +86-20-82293061'),
  ('SA010', '南沙港', 'GUANGZHOU QIAOHENG INTERNATIONAL SHIPPING AGENCY CO.,LTD', 'ROOM 305, NO.8 OFFICE BLOCK, NO. 5 QIHANG ROAD,LONGXUE STREET, NANSHA DISTRICT, GUANGZHOU, CHINA. ZIP:511457', '86-13926173573', null, 'nanshaops@circlelog.com', 'OP: TOM', 'GUANGZHOU QIAOHENG INTERNATIONAL SHIPPING AGENCY CO.,LTD
ADDRESS: ROOM 305, NO.8 OFFICE BLOCK, NO. 5 QIHANG ROAD,LONGXUE STREET, NANSHA DISTRICT, GUANGZHOU, CHINA. ZIP:511457
OP: TOM
MB: 86-13926173573
E-MAIL: nanshaops@circlelog.com'),
  ('SA011', '黄埔港', 'GUANGZHOU CIRCLE INTERNATIONAL SHIPPING AGENCY CO., LTD', '3/F, NO. 319, GANGQIAN ROAD, HUANGPU, GUANGZHOU, 510700 P. R. CHINA', '86-20-82290475 / 82293013 / 82280755 / 82292973', '86-20-82274386', 'OPERATION@CIRCLELOG.COM', 'VICE GENERAL MANAGER: WAVE ZHANG +86-20-82290475 / MARKETING MANAGER: JAMES ZHANG +86-20-82273302 / SHIPPING MANAGER: ALEX WU +86-20-82292973 / DOCUMENT MANAGER: MONA ZHANG +86-20-82293061', 'GUANGZHOU CIRCLE INTERNATIONAL SHIPPING AGENCY CO., LTD
ADDRESS：3/F, NO. 319, GANGQIAN ROAD, HUANGPU, GUANGZHOU, 510700 P. R. CHINA
TEL: 86-20-82290475 / 82293013 / 82280755 / 82292973
FAX: 86-20-82274386
TLX: 051 94076045 GZCT G
E-MAIL:OPERATION@CIRCLELOG.COM

VICE GENERAL MANAGER: WAVE ZHANG                  +86-20-82290475
MARKETING MANAGER: JAMES ZHANG                    +86-20-82273302
SHIPPING MANAGER: ALEX WU                            +86-20-82292973
DOCUMENT MANAGER: MONA ZHANG                     +86-20-82293061'),
  ('SA012', '连云港', 'Lianyungang Harvest Shipping Agency Co., Ltd', '25floor, Tower D, Sunshine Int’l Center,', '0086 518-8232 7508 / 0086 135 0513 1200', '0086 518-8232 7576', 'yangsq@harvestshipping.cn', 'PIC : Mr Yang Siqian', 'Lianyungang Harvest Shipping Agency Co., Ltd
连云港丰乐国际船舶代理有限公司
PIC     : Mr Yang Siqian
TEL     : 0086 518-8232 7508
FAX    : 0086 518-8232 7576
MOB  : 0086 135 0513 1200
MAIL  : yangsq@harvestshipping.cn
ADD   : 25floor, Tower D, Sunshine Int’l Center,
No.2 Haibin Road, Lianyungang, Jiangsu, China'),
  ('SA013', '曹妃甸', 'Tangshan Hengye Shipping Agent Co., Ltd.', null, '86-315-2911284 (24 HOURS) / +86-315-2911284 Fax: +86-315-2911264', null, 'shipping@hyie.com', 'V.G. Manager: Mr. Changer Wu MB:+86-18031582652 / Operator : Ms. Amy Zhao MB:+86-18031582673 / Operator : Ms. Mia Li MB: 86+18031582683 / Operator : Ms. Sara Liu MB:+86-18031582664', 'Tangshan Hengye Shipping Agent Co., Ltd.
E-MAIL: shipping@hyie.com
OFFICE TEL: 86-315-2911284 (24 HOURS)
V.G. Manager: Mr. Changer Wu    MB:+86-18031582652
Operator : Ms. Amy Zhao       MB:+86-18031582673
Operator : Ms. Mia Li       MB: 86+18031582683
Operator : Ms. Sara Liu        MB:+86-18031582664

Jingtang office add: Room211,2nd Floor Office Building Bonded Logistics center,West Side,Haiping Road
     (No. 10 Road),South Side,Gangxing Street(No. 7 Road),Seaport Development Zone,Tangshan City, Hebei Province, P.R.China
     ZIP CODE: 063611
Caofeidian office add: Room 409, Zonghe Building, Tangshan Shiye Port Co., 18+,
     Caofeidian Industrial Area, Tangshan City, Hebei Province, P.R.China
     ZIP CODE: 063200
Huanghua office add: Eastern of Xindao Mansion,Canghai Road,Huanghua port, Bohai New Area, Cangzhou City,
     Hebei Province, P.R.China
     ZIP CODE: 061113
Tianjin office add: Room 702, No.10 building yihang international,international trade and shipping service area,
     Tianjin port free trade zone,Tianjin binhai new area P.R.China
     ZIP CODE: 300461
Tel: +86-315-2911284   Fax: +86-315-2911264'),
  ('SA014', '日照', 'China Ocean Shipping Agency Rizhao Co.,Ltd.', '106 Huanghai Road 1, Rizhao ,Shandong P.R.China(P.C:276826)', '86-633-8331468', '86-633-8331116;TLX:051-94076221 Via UK', 'cosarz@penavicorz.com / cosarz4047@163.com', null, 'China Ocean Shipping Agency Rizhao Co.,Ltd.
Add:106 Huanghai Road 1, Rizhao ,Shandong P.R.China(P.C:276826)
Liuyi:+86 15163376152
Zhao wentao:+86 16606336683
Tel:86-633-8331468
Fax:86-633-8331116;TLX:051-94076221 Via UK
EMail:cosarz@penavicorz.com;cosarz4047@163.com'),
  ('SA015', '舟山港', 'COSCO SHIPPING AGENCY(ZHOUSHAN) CO., LTD', null, '+86-13868249158 +86-13758022924(24HRS)', '+86-580-2187129', 'csazs@coscoshipping.com / an.chao8@coscoshipping.com', 'ATTN：AN CHAO TEL：+86-580-2184695', 'COSCO SHIPPING AGENCY(ZHOUSHAN) CO., LTD
10-F, JINYUE BULIDING, NO.620 DINGSHEN ROAD, LINCHENG NEW
DISTRICT, ZHOUSHAN CITY, ZHEJIANG PROVINCE, China 316021
ATTN：AN CHAO                                                                                                                         TEL：+86-580-2184695
MOBILE：+86-13868249158  +86-13758022924(24HRS)
FAX： +86-580-2187129
EMAIL: csazs@coscoshipping.com(PUBLIC) an.chao8@coscoshipping.com (PERSONAL)'),
  ('SA016', '漳州港', 'China Ocean Shipping Agency Fujian Zhangzhou Branch', null, '+86 596 6615081 / +86 138 5052 0830', '+86 596 6858333', 'wu.huanxing@coscoshipping.com / shipping.56zz@coscoshipping.com', 'Mr.Jackie Wu(HuanXing Wu/吴焕兴） / We chat:+86 138 5052 0830', 'China Ocean Shipping Agency Fujian Zhangzhou Branch
China Ocean Shipping Agency Zhangzhou
3/F Harbour Bldg,China Merchants Zhangzhou
Development Zone, Fujian, 363122, P.R. China
Mr.Jackie Wu(HuanXing Wu/吴焕兴）
Tel:+86 596 6615081
Mob:+86 138 5052 0830
We chat:+86 138 5052 0830
Fax:+86 596 6858333
E-mail:  wu.huanxing@coscoshipping.com (New)
             shipping.56zz@coscoshipping.com(New)')
)
insert into public.shipping_agents (
  module_id, code, port_name, agency_name, address, tel, fax, email,
  contact_persons, raw_text, source_document
)
select
  module.id, rows.code, rows.port_name, rows.agency_name, rows.address, rows.tel,
  rows.fax, rows.email, rows.contact_persons, rows.raw_text, '中国港口信息.xlsx'
from rows
cross join module
on conflict (code) do update
set
  module_id = excluded.module_id,
  port_name = excluded.port_name,
  agency_name = excluded.agency_name,
  address = excluded.address,
  tel = excluded.tel,
  fax = excluded.fax,
  email = excluded.email,
  contact_persons = excluded.contact_persons,
  raw_text = excluded.raw_text,
  source_document = excluded.source_document,
  updated_at = now();
