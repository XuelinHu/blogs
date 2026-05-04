---
title: mysql常用SQL
date: 2025-05-25
---

# 1. mysql efficient shell

## 1.1. show dead lock

```shell
show open tables where in_use > 0;
select * from information_schema.innodb_trx;
show processlist 
```

## 1.2. table structure copy

```shell
select  concat('drop  table if exsits frxs_fund_accountant_2012.', table_name ,';create  table  frxs_fund_accountant_2012.', table_name ,' like ','frxs_fund_accountant_2001.',table_name,';')  
from information_schema.tables WHERE table_schema='frxs_fund_accountant';
```

# 2. 日期查询

```sql

select now();
select current_timestamp, current_timestamp();
select date_format('2008-08-08 22:23:01', '%Y%m%d%H%i%s');
select str_to_date('08/09/2008', '%m/%d/%Y');
select str_to_date('08.09.2008 08:09:30', '%m.%d.%Y %h:%i:%s'); 
```

# 3. 日期计算

```sql

set
@dt = now();

select date_add(@dt, interval 1 day); -- add 1 day
select date_add(@dt, interval 1 hour); -- add 1 hour
select date_add(@dt, interval 1 minute); -- ...
select date_add(@dt, interval 1 second);
select date_add(@dt, interval 1 microsecond);
select date_add(@dt, interval 1 week);
select date_add(@dt, interval 1 month);
select date_add(@dt, interval 1 quarter);
select date_add(@dt, interval 1 year);

select date_add(@dt, interval -1 day); -- sub 1 day
```

# 实用SQL

一个SQL查询出每门课程的成绩都大于80的学生姓名

```sql
select name
from SC
group by name
having min(score) > 80
```