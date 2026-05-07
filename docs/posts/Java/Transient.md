---
title: Transient
date: 2025-05-25
---

# 1. Transient关键字

被修饰后，就不会被序列化

```java
public class TransientTest {

    @AllArgsConstructor
    @NoArgsConstructor
    @Data
    public static class InnerBO {
        private String name;
        private int age;
        private transient int temp;
    }

    @Test
    public void test() {
        InnerBO innerBO = new InnerBO();
        innerBO.setName("1");
        innerBO.setAge(1);
        innerBO.setTemp(99);
        System.out.println(JSON.toJSONString(innerBO));
    }
}

```

输出后

```json
{
  "age": 1,
  "name": "1"
}

```