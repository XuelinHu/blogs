---
title: Junit
date: 2025-05-25
---

# 1. mock

## 1.1. Mock、Spy、MeanBean、SpyBean的区别

在Mockito框架中，注解@Mock、@Spy、@MockBean和@SpyBean各自有不同的用途和特性。

1. **@Mock**：
    - 用于创建被mock的对象实例。
    - 当对使用@Mock注解的对象的函数进行调用时，它会执行mock（即虚假函数），而不是真正的方法调用。
    - 在单元测试中，@Mock注解用于创建需要进行模拟的对象实例，以方便进行测试。

2. **@Spy**：
    - 用于创建被spy的对象实例，即保留原对象的行为。
    - 与@Mock不同，@Spy会真实调用原对象的方法，但允许你覆盖某些方法的行为。
    - Mockito中的Mock和Spy都可用于拦截那些尚未实现或不期望被真实调用的对象和方法，并为其设置自定义行为。

3. **@MockBean**：
    - 专门用于Spring测试环境，用于创建Spring Bean的Mock对象，主要用于集成测试。
    - 它是Spring Boot Test框架的一部分，并与Mockito无缝集成。
    - @MockBean创建的模拟对象不会调用真实的方法，有返回值的会返回null。
    - 通过用模拟版本替换Spring上下文中的其他bean来隔离被测组件，确保没有外部依赖项干扰被测单元。

4. **@SpyBean**：
    - 也是Spring测试环境中的一个注解，用于创建部分模拟实例。
    - 与@MockBean不同，@SpyBean允许保留原始bean的行为，并可以根据需要覆盖特定方法。
    - 这在你想要使用bean的实际功能但需要更改某些行为以进行测试的情况下特别有用。

综上所述，@Mock和@Spy主要关注于对象实例的模拟和间谍行为，而@MockBean和@SpyBean则特定于Spring测试环境，用于模拟或间谍Spring
Bean的行为。这些注解在Mockito框架中提供了灵活且强大的工具，帮助开发者在测试过程中模拟和验证代码的行为。

Mockito 是一个流行的 Java Mocking 框架，它允许你创建和配置 mock 对象来测试你的代码。以下是一些 Mockito 中常用的 mock
方法和功能：

## 1.2. Mockito 常用的mock

1. **mock()**

	* 用于创建一个 mock 对象。
	```java
	List<String> mockedList = mock(List.class);
	```

2. **when()...thenReturn()**

	* 用于定义 mock 对象的行为。当某个方法被调用时，返回指定的值。
	```java
	when(mockedList.get(0)).thenReturn("first");
	```

3. **verify()**

	* 用于验证 mock 对象的方法是否被调用，以及调用的次数。
	```java
	verify(mockedList).get(0);
	verify(mockedList, times(2)).get(0);
	```

4. **any()**

	* 用于匹配任何参数。
	```java
	when(mockedList.contains(any())).thenReturn(true);
	```

5. **eq()**

	* 用于匹配特定的参数。
	```java
	when(mockedList.contains(eq("specificString"))).thenReturn(true);
	```

6. **doReturn()...when()**

	* 用于为 void 方法定义行为。
	```java
	doReturn(null).when(mockedObject).someVoidMethod();
	```

7. **doThrow()...when()**

	* 用于当方法被调用时抛出异常。
	```java
	doThrow(new RuntimeException()).when(mockedObject).someMethod();
	```

8. **doAnswer()...when()**

	* 用于为方法调用提供自定义的答案。
	```java
	doAnswer(invocation -> {
	    // 自定义逻辑
	    return null;
	}).when(mockedObject).someMethod();
	```

9. **doCallRealMethod()**

	* 调用 mock 对象的实际方法，而不是定义的 mock 行为。
	```java
	doCallRealMethod().when(mockedObject).someMethod();
	```

10. **spy()**

* 创建一个 spy 对象，它实际调用对象的真实方法，但允许你覆盖某些方法的行为。

```java
List<String> list=new ArrayList<>();
        List<String> spyList=spy(list);

// 调用真实方法
        spyList.add("element");

// 覆盖某些方法的行为
        doReturn(true).when(spyList).contains("element");
```

11. **inOrder()**

* 用于验证方法调用的顺序。

```java
InOrder inOrder=inOrder(mockedObject);
        inOrder.verify(mockedObject).method1();
        inOrder.verify(mockedObject).method2();
```

12. **reset()**

* 重置 mock 对象的状态，清除之前定义的所有行为。

```java
reset(mockedObject);
```

这些是 Mockito 中一些常用的 mock 方法和功能。Mockito 还提供了更多高级功能，如参数匹配器、回调、捕获参数等，可以帮助你更灵活地定义和验证
mock 对象的行为。