---
title: Thread Pool
nav`order: 8
date: 2025-05-25
---

# 1. 代码示例

## 1.1. jdk1.8

```java
import java.util.LinkedList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

class Foo {
    public static void main(String[] args) throws InterruptedException {
        Foo f = new Foo();
        long t = System.currentTimeMillis();
        f.threadPoolTest(10000);
        System.out.println(System.currentTimeMillis() - t);
        long e = System.currentTimeMillis();
        f.threadTest(10000);
        System.out.println(System.currentTimeMillis() - e);
    }

    public void threadPoolTest(int cnt) throws InterruptedException {
        final List<Integer> l = new LinkedList<Integer>();
        ThreadPoolExecutor tp =
                new ThreadPoolExecutor(1,
                        1,
                        60,
                        TimeUnit.SECONDS,
                        new LinkedBlockingQueue<Runnable>(cnt));
        final Random random = new Random();
        for (int i = 0; i < cnt; ++i) {
            tp.execute(new Runnable() {
                @Override
                public void run() {
                    l.add(random.nextInt());
                }
            });
        }
        tp.shutdown();
        tp.awaitTermination(1, TimeUnit.DAYS);
    }

    public void threadTest(int cnt) throws InterruptedException {
        final List<Integer> l = new LinkedList<Integer>();
        final Random random = new Random();
        for (int i = 0; i < cnt; ++i) {
            Thread t = new Thread() {
                @Override
                public void run() {
                    l.add(random.nextInt());
                }
            };
            t.start();
            t.join();
        }
    }
}
```

## 1.2. guava的线程工厂库

```java
package edu.java.all;

import com.google.common.collect.Lists;
import com.google.common.util.concurrent.ThreadFactoryBuilder;

import java.util.LinkedList;
import java.util.Objects;
import java.util.concurrent.*;

public class ThreadLocalDemo {

    private static ThreadLocal<String> threadLocal = new ThreadLocal<String>();
    private static ThreadPoolExecutor threadPoolExecutor = new ThreadPoolExecutor(4, 8, 5L,
            TimeUnit.MINUTES,
            new LinkedBlockingQueue<Runnable>(64),
            new ThreadFactoryBuilder().setNameFormat("demo-thread-%d").build(),
            new ThreadPoolExecutor.CallerRunsPolicy());


    public static void main(String[] args) throws ExecutionException, InterruptedException {
        LinkedList<CompletableFuture<String>> futureLinkedList = Lists.newLinkedList();
        for (int i = 0; i < 100; ++i) {
            final int finalI = i;

            CompletableFuture<String> future = CompletableFuture.supplyAsync(
                    () -> {
                        threadLocal.set(String.valueOf(finalI));
                        String s = threadLocal.get();
                        System.out.printf("%s-%s\n", Thread.currentThread().getName(), s);
                        threadLocal.remove();
                        return s;
                    }, threadPoolExecutor
            ).whenCompleteAsync((t, e) -> {
                if (Objects.nonNull(e)) {
                    System.out.printf("error:::info=\n", e.getMessage());
                }
            });
            futureLinkedList.add(future);
        }
        for (CompletableFuture<String> future : futureLinkedList) {
            System.out.println(future.get());
        }
        return;
    }
}

```

# 2. 源代码阅读

## 2.1. 线程池的结构

- Executor是一个顶级接口，内部就一个 `void execute(Runnable command);` 方法
- ExecutorService也一个接口，主要定义了 `shutdown() submit() invoke() awaitTermination()` 等方法
- AbstractExecutorService是一个抽象类，是对ExecutorService的一种不完全实现，内部没有实现 *execute()*方法
- ThreadPoolExecutor是线程满池的一种通用实现。

## 2.2. 为什么在用线程池

在并发的线程数量很多的情况下，不断反复地创建和销毁线程，
上示的代码中，threadPoolTest()使用了线程池，threadTest()
没有使用线程池，二者的运行时间差别相当大。前者花了46秒，后者花了3000多秒，差距之所以这么大，
是因为二者的run方法中的操作都非常的单一，是密集型的IO操作。

## 2.3. 线程池的状态

```
private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));
    private static final int COUNT`BITS = Integer.SIZE - 3;
    private static final int CAPACITY   = (1 << COUNT`BITS) - 1;
    // runState is stored in the high-order bits
    private static final int RUNNING    = -1 << COUNT`BITS;
    private static final int SHUTDOWN   =  0 << COUNT`BITS;
    private static final int STOP       =  1 << COUNT`BITS;
    private static final int TIDYING    =  2 << COUNT`BITS;
    private static final int TERMINATED =  3 << COUNT`BITS;
    
    // Packing and unpacking ctl
    private static int runStateOf(int c)     { return c & ~CAPACITY; }
    private static int workerCountOf(int c)  { return c & CAPACITY; }
    private static int ctlOf(int rs, int wc) { return rs | wc; }
    
    
COUNT_BITS = 29
CAPACITY   = 536870911  (00011111111111111111111111111111)

RUNNING    = -536870912 (11100000000000000000000000000000)
SHUTDOWN   = 0          (00000000000000000000000000000000)
STOP       = 536870912  (00100000000000000000000000000000)
TIDYING    = 1073741824 (01000000000000000000000000000000)
TERMINATED = 1610612736 (01100000000000000000000000000000)

```

- RUNNING：执行状态，表示当前的线程池可以接受新任务且在处理**等待队列**中的任务。
- SHUTDOWN：不接受新任务，但是仍处理**等待队列**中的任务，调用shutdown()方法。
- STOP：不接受新任务处理，中止所有正在处理的任务，调用shutdownNow()方法。
- TIDYING：所有任务终止，且**等待队列**中的任务为零时，线程池的状态会转换为TIDYING，并将执行terminated()方法，将线程池挂起。
- TERMINATED：表示由TIDYING状态触发的terminated()方法已经完成。

代码中的`ctl`变量有两重含义，一是代表了有效的线程个数，二是代表了当前线程池的执行状态。由以上代码可以看出，初始的`ctl=(-1 <<
Integer.SIZE - 3) | 0 = -536870912`，是一个很小的负数。<br />之所以让所有的线程池状态以**高位比特位**进行表示，

## 2.4. 线程池的执行

在 `public void execute(Runnable command)` 方法中，接收一个线程，进行操作，过程如下：

- 如果当前当前工作线程少于核心线程数，并新增一个工作线程，并返回；不然再次获取新的工作线程数，进一步操作
- 在确保当前的线程池的运行状态，并可以将线程转入阻塞队列时，还不能直接添加到阻塞队列中，要做双重检查。
- 无法将线程插入阻塞队列，就会添加一个新的线程，如果添加新线程失败，则采取**拒绝**策略。

整个线程池的源代码中只有在 `addWorker()` 中有一个 `t.start();` 语句，是代表线程在执行。

## 2.5. 任务缓存队列

`private final BlockingQueue<Runnable> workQueue;`
这个任务缓存队列是用来缓存任务并进行工作线程的交接。当这个队列`isEmpty()`
返回为空时，说明队列中已经没有了处于等待状态的任务，这时考虑要不要将线程池的状态从SHUTDOWN转为TIDYING。常见的阻塞队列有：

- ArrayBlockingQueue:基于数组的先进先出队列，此队列创建时必须指定大小；
- LinkedBlockingQueue:基于链表的先进先出队列，如果创建时没有指定此队列大小，则默认为Integer.MAX`VALUE；

## 2.6. 任务拒绝策略

- public static class CallerRunsPolicy implements RejectedExecutionHandler:将任务退还给调用者。
- public static class AbortPolicy implements RejectedExecutionHandler：放弃这个任务，并抛出异常
- public static class DiscardPolicy implements RejectedExecutionHandler ：放弃这个任务，不抛异常
- public static class DiscardOldestPolicy implements
  RejectedExecutionHandler：在线程池终止前，以FIFO的方式放弃池中没有被执行的任务，把这个新任务再次尝试执行execute()方法

## 2.7. 快速创建方式

除了文章开头那种new方式可以创建，一般常用创建线程池的方式是Executors这样一个工具类，里面实现对许多线程池的创建。
[参考文档](https://www.cnblogs.com/dolphin0520/p/3932921.html)

- newFixedThreadPool：一个固定大小的线程池
- newWorkStealingPool：1.8以后新增的，会以多队列的方式减少对锁的竞争，其真实的线程数会动态的调整，这类线程不保证执行顺序与提交顺序一致。
- newSingleThreadExecutor：工作的线程有且只有一个,与newFixedThreadPool(1)方法效果一样
- newSingleThreadScheduledExecutor：会重复使用池内现有的线程
- newCachedThreadPool：创建一个定长线程池，支持定时及周期性任务执行。
- newScheduledThreadPool：创建一个定长线程池，支持定时及周期性任务执行。

# 3. 操作系统中的线程

## 3.1. 用户空间的线程

所有线程都是在用户空间下的，操作系统只能看到用户空间的中进程，看不到线程。
缺点是线程只在用户态，没有中断机制，对于IO消耗过长的线程，会长期占用cpu，整体CPU的吞吐率不高；
当出现缺页中断时，阻塞也是整体进程，而不是线程。

## 3.2. 内核空间的线程

线程的生命周期全部在内核空间。

### 3.2.1. 多对一线程模型：

多个用户线程对应一个内核线程

### 3.2.2. 一对一线程模型：

一个用户线程对应一个内核线程

### 3.2.3. 多对多线程模型：

多对多模型将任意数量的用户线程复用到相同或更少数量的内核线程上，结合了一对一和多对一模型的最佳特性

# 4. Java线程

线程库就是为开发人员提供创建和管理线程的一套 API。不同操作系统是有不同的线程库

- 1）POSIX Pthreads：可以作为用户或内核库提供，作为 POSIX 标准的扩展
- 2）Win32 线程：用于 Window 操作系统的内核级线程库
- 3）Java 线程：Java 线程 API 通常采用宿主系统的线程库来实现，
  也就是说在 Win 系统上，Java 线程 API 通常采用 Win API 来实现，在 UNIX 类系统上，
  采用 Pthread 来实现。

现今 Java 中线程的本质，其实就是操作系统中的线程，
其线程库和线程模型很大程度上依赖于操作系统（宿主系统）的具体实现，比如在
Windows 中 Java 就是基于 Wind32 线程库来管理线程，且 Windows 采用的是一对一的线程模型。