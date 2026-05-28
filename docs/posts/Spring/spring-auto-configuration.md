---
title: spring-auto-configuration
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. 常用的注解

```text
@Configuration 标注一个类为配置类
@AutoConfigureAfter 在某个类配置之后再配置
@AutoConfigureBefore 在某个类配置之前就配置
@ConditionalOnMissingBean 缺少某个类再配置
@ConditionalOnBean 某个类存在配置
``` 

# 2. 常用Configuration配置

## 2.1. ThreadConfig

```java

@Configuration
@EnableAsync(proxyTargetClass = true)
@Slf4j
public class ThreadConfig {

    public static final String SCHEDULING_THREAD_POOL_EXECUTOR = "schedulingThreadPoolExecutor";
    public static final String EXECUTE_THREAD_POOL_EXECUTOR = "executeThreadPoolExecutor";

    public ThreadConfig() {
        log.info("ThreadConfig 无参构造");
    }

    @PostConstruct
    public void init() {
        log.info("ThreadConfig PostConstruct()");
    }

    @Bean(SCHEDULING_THREAD_POOL_EXECUTOR)
    public ThreadPoolExecutor scheduling() {
        log.info("开始线程池配置");
        ThreadFactory threadFactory = new ThreadFactoryBuilder()
                .setNameFormat("task-scheduling-thread" + "-%d")
                .setDaemon(false).build();


        ThreadPoolExecutor executor = new ThreadPoolExecutor(1,
                1, 32, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(128),
                threadFactory,
                new ThreadPoolExecutor.CallerRunsPolicy()
        );

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (!executor.isShutdown()) {
                List<Runnable> runnables = executor.shutdownNow();
                log.warn("task-scheduling-thread losing {}", runnables.size());
            }
            log.info("task-scheduling-thread close");
        }));

        return executor;
    }

    @Bean(EXECUTE_THREAD_POOL_EXECUTOR)
    public ThreadPoolExecutor executor() {
        ThreadFactory threadFactory = new ThreadFactoryBuilder()
                .setNameFormat("task-execute-thread" + "-%d")
                .setDaemon(false).build();


        ThreadPoolExecutor executor = new ThreadPoolExecutor(Runtime.getRuntime().availableProcessors(),
                Runtime.getRuntime().availableProcessors() << 1, 32, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(256),
                threadFactory,
                new ThreadPoolExecutor.CallerRunsPolicy()
        );

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (!executor.isShutdown()) {
                List<Runnable> runnables = executor.shutdownNow();
                log.warn("task-execute-thread losing {}", runnables.size());
            }
            log.info("task-execute-thread close");
        }));

        return executor;
    }
}
```

# 3. 配置示例

## 3.1. AfterConfig

```java

@Configuration
@AutoConfigureAfter(ThreadConfig.class)
@Slf4j
public class AfterConfig {
    public AfterConfig() {
        log.info("在ThreadConfig类之后配置");
    }

    @PostConstruct
    public void init() {
        log.info("AfterConfig PostConstruct()");
    }


    @Bean
    @ConditionalOnMissingBean(ThreadConfig.class)
    public ThreadConfig threadConfig() {
        log.info("不会执行，因为AfterConfig在ThreadConfig之后了");
        return new ThreadConfig();
    }

    @Bean
    @ConditionalOnBean(ThreadConfig.class)
    public Object object() {
        log.info("会执行，因为需要ThreadConfig");
        return new Object();
    }
}

```

## 3.2. BeforeConfig

```java

@Configuration
@AutoConfigureAfter(ThreadConfig.class)
@Slf4j
public class BeforeConfig {
    public BeforeConfig() {
        log.info("在ThreadConfig类之前配置");
    }


    @PostConstruct
    public void init() {
        log.info("BeforeConfig PostConstruct()");
    }
}
```

## 3.3. 执行结果

```text

2023-05-10 23:08:03.804  INFO 14274 --- [  restartedMain] e.j.d.s.c.ThreadConfig                   : ThreadConfig 无参构造
2023-05-10 23:08:03.825  INFO 14274 --- [  restartedMain] e.j.d.s.c.ThreadConfig                   : ThreadConfig PostConstruct()
2023-05-10 23:08:04.192  INFO 14274 --- [  restartedMain] e.j.d.s.c.s.AfterConfig                  : 在ThreadConfig类之后配置
2023-05-10 23:08:04.198  INFO 14274 --- [  restartedMain] e.j.d.s.c.s.AfterConfig                  : AfterConfig PostConstruct()
2023-05-10 23:08:04.199  INFO 14274 --- [  restartedMain] e.j.d.s.c.s.BeforeConfig                 : 在ThreadConfig类之前配置
2023-05-10 23:08:04.202  INFO 14274 --- [  restartedMain] e.j.d.s.c.s.BeforeConfig                 : BeforeConfig PostConstruct()
2023-05-10 23:08:04.597  INFO 14274 --- [  restartedMain] e.j.d.s.c.ThreadConfig                   : 开始线程池配置
2023-05-10 23:08:04.622  INFO 14274 --- [  restartedMain] e.j.d.s.c.s.AfterConfig                  : 会执行，因为需要ThreadConfig
```