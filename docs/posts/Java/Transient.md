---
title: Transient
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
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

# 2. 使用场景

- 某个字段只是运行时临时值，不希望落盘或传输。
- 字段里保存敏感信息，例如临时 token、密码缓存、验证码等。
- 对象里包含不可序列化资源，例如线程、连接、句柄等。

# 3. 注意点

- `transient` 主要影响 Java 原生序列化和很多基于字段反射的序列化框架。
- 不同 JSON 框架对 `transient` 的处理可能有差异，使用前最好验证。
- 如果字段必须参与持久化或接口返回，就不应该用 `transient` 简单规避。
