---
title: JUC Using
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. Semaphore

## 1.1. 按顺序依次打印

```java
import java.util.concurrent.Semaphore;

class Foo {
    Semaphore semaphore2;
    Semaphore semaphore3;
    Object obj;

    public Foo() {
        semaphore2 = new Semaphore(0);
        semaphore3 = new Semaphore(0);
    }

    public void first(Runnable printFirst) throws InterruptedException {
        // printFirst.run() outputs "first". Do not change or remove this line.
        printFirst.run();
        semaphore2.release();
    }

    public void second(Runnable printSecond) throws InterruptedException {

        // printSecond.run() outputs "second". Do not change or remove this line.
        semaphore2.acquire();
        printSecond.run();
        semaphore3.release();
    }

    public void third(Runnable printThird) throws InterruptedException {
        // printThird.run() outputs "third". Do not change or remove this line.
        semaphore3.acquire();
        printThird.run();

    }
}
```

## 1.2. 限流

只有10张票了，有10000用户在抢，在业务层作限流，只允许10个用户进行抢票业务操作。先进入的10个用户成功后不再释放出资源。

```java
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

public class SemaphoreDemo {
    Semaphore semaphore;

    public void buyTicket() {
        // 事务初始不成功
        boolean isSucessed = false;

        try {
            if (semaphore.tryAcquire(100, TimeUnit.MICROSECONDS)) {
                System.out.println(Thread.currentThread() + "buying....");
                // 事务操作，确定是否成功 修改isSucessed
                TimeUnit.SECONDS.sleep(2);
            }
            System.out.println(Thread.currentThread() + "waiting....");

        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            // 事务执行失败,释放资源
            if (!isSucessed) {
                semaphore.release();
            }
        }
    }

    public static void main(String[] args) {
        SemaphoreDemo semaphoreDemo = new SemaphoreDemo();
        semaphoreDemo.semaphore = new Semaphore(10);
        for (int i = 0; i < 20; ++i) {
            new Thread(() -> {
                semaphoreDemo.buyTicket();
            }).start();
        }
    }
}

```

# 2. volatile

- https://leetcode-cn.com/problems/building-h2o/
- https://www.cnblogs.com/dolphin0520/p/3920373.html

当共享变量被一个线程修改后，会立即通过其他线程。
volatile有利于保证变量的原子性，对于i++这样的复合操作在高并发的情况下不行。
在Thread类中，线程名字段就是用volatile修饰的。

```java

import java.util.concurrent.Semaphore;

class H2O {
    private volatile int currentStatus;

    public H2O() {
        currentStatus = 0;
    }

    public void hydrogen(Runnable releaseHydrogen) throws InterruptedException {
        synchronized (this) {
            // releaseHydrogen.run() outputs "H". Do not change or remove this line.
            while (currentStatus == 2) {
                this.wait();
            }
            releaseHydrogen.run();
            ++currentStatus;
            this.notifyAll();
        }
    }

    public void oxygen(Runnable releaseOxygen) throws InterruptedException {
        synchronized (this) {
            // releaseOxygen.run() outputs "O". Do not change or remove this line.
            while (currentStatus != 2) {
                this.wait();
            }
            releaseOxygen.run();
            currentStatus = 0;
            this.notifyAll();
        }
    }
}

class H2O {
    private volatile int h;

    public H2O() {
        h = 0;
    }

    public void hydrogen(Runnable releaseHydrogen) throws InterruptedException {
        while (h == 2) {
            Thread.yield();
        }
        // releaseHydrogen.run() outputs "H". Do not change or remove this line.
        releaseHydrogen.run();
        ++h;
    }

    public void oxygen(Runnable releaseOxygen) throws InterruptedException {

        // releaseOxygen.run() outputs "O". Do not change or remove this line.
        while (h != 2) {
            Thread.yield();
        }
        releaseOxygen.run();
        h = 0;
    }
}
```

# 3. CountDownLatch

1. 创建CountDownLatch对象
2. 调用其实例方法 `await()`，让当前线程等待
3. 调用 `countDown()`方法，让计数器减1
4. 当计数器变为0的时候， `await()`方法会返回

## 3.1. 模拟处理sheet

```java
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class CountDownLatchDemo {
    private void dealSheet(String sheetName, CountDownLatch countDownLatch) {
        try {
            System.out.println(Thread.currentThread() + " deal with " + sheetName);
            TimeUnit.SECONDS.sleep(2L);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            // 完成后，减少
            countDownLatch.countDown();
        }
    }

    public static void main(String[] args) {

        int N = 3;
        CountDownLatchDemo demo = new CountDownLatchDemo();
        CountDownLatch countDownLatch = new CountDownLatch(N);
        new Thread(() -> {
            demo.dealSheet("sheet1", countDownLatch);
        }).start();
        new Thread(() -> {
            demo.dealSheet("sheet2", countDownLatch);
        }).start();
        new Thread(() -> {
            demo.dealSheet("sheet3", countDownLatch);
        }).start();

        try {
            countDownLatch.await();
            System.out.println("done");
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}

```

# 4. Condition

```java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

class PrintThread {
    private char flag = 'A';
    Lock lock = new ReentrantLock();
    Condition condA = lock.newCondition();
    Condition condB = lock.newCondition();
    Condition condC = lock.newCondition();

    public void printA() {
        lock.lock();

        try {
            while (flag != 'A') {
                condA.await();// 等待
            }
            for (int i = 0; i < 5; ++i) {
                System.out.println("A");
            }
            flag = 'B';
            condB.signal();
        } catch (
                Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

    public void printB() {
        lock.lock();

        try {
            while (flag != 'B') {
                condB.await();
            }
            for (int i = 0; i < 7; ++i) {
                System.out.println("B");
            }
            flag = 'C';
            condC.signal();
        } catch (
                Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

    public void printC() {
        lock.lock();

        try {
            while (flag != 'C') {
                condC.await();
            }
            for (int i = 0; i < 10; ++i) {
                System.out.println("C");
            }
            flag = 'A';
            condA.signal();
        } catch (
                Exception e) {
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }
}

public class ConditionDemo {


    public static void main(String[] args) {
        PrintThread printThread = new PrintThread();
        new Thread(() -> {
            for (int i = 0; i < 10; ++i) {
                printThread.printB();
            }
        }).start();
        new Thread(() -> {
            for (int i = 0; i < 10; ++i) {
                printThread.printA();
            }
        }).start();
        new Thread(() -> {
            for (int i = 0; i < 10; ++i) {
                printThread.printC();
            }
        }).start();


    }
}
```

# 5. LockSupport

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.LockSupport;

public class LockSupportDemo {
    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            System.out.println(Thread.currentThread().getName() + " park");
            LockSupport.park();
            System.out.println(Thread.currentThread().getName() + " start");
        });
        t1.setName("t1");
        t1.start();
        try {
            TimeUnit.SECONDS.sleep(3);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        LockSupport.unpark(t1);
        System.out.println("done");

    }
}
```

# 6. CyclicBarrier

```java
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.TimeUnit;

public class CyclicBarrierDemo {
    CyclicBarrier cyclicBarrier = new CyclicBarrier(5);

    public static void main(String[] args) {
        CyclicBarrierDemo cyclicBarrierDemo = new CyclicBarrierDemo();
        for (int i = 0; i < 10; ++i) {
            new Thread(() -> {
                try {
                    TimeUnit.SECONDS.sleep(1);
                    Long start = System.currentTimeMillis();
                    System.out.println(Thread.currentThread().getName() + "has been arived");
                    cyclicBarrierDemo.cyclicBarrier.await();
                    System.out.println(Thread.currentThread().getName() + "::" +
                            String.valueOf(System.currentTimeMillis() - start) + "(ms)");
                    System.out.println(Thread.currentThread().getName() + "has been done");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}

```

# 7. BlockingQueue

阻塞队列，继承 **Queue** 接口，遵循FIFO规则，又是满足阻塞条件：

- 队列满时，阻塞添加操作
- 队列空时，阻塞取出操作

相关方法

| 操作类型 | 抛出异常      | 返回特定值    | 阻塞     | 超时退出                   |
|------|-----------|----------|--------|------------------------|
| 添加   | add(e)    | offer(e) | put(e) | offer(e,timeuout,unit) |
| 取出   | remove()  | poll()   | take() | poll(timeout,unit)     |
| 检查   | element() | `peek()` | 不支持    | 不支持                    |

## 7.1. ArrayBlockingQueue

> 基于数组的阻塞队列实现，其内部维护一个定长的数组，用于存储队列元素。线程阻塞的实现是通过ReentrantLock来完成的，
> 数据的插入与取出共用同一个锁，因此ArrayBlockingQueue并不能实现生产、消费同时进行。而且在创建ArrayBlockingQueue时，
> 我们还可以控制对象的内部锁是否采用公平锁，默认采用非公平锁。

```java
    /** Main lock guarding all access */
    final ReentrantLock lock;

    /** Condition for waiting takes */
    private final Condition notEmpty;

    /** Condition for waiting puts */
    private final Condition notFull;
```
## 7.2. LinkedBlockingQueue

> 基于单向链表的阻塞队列实现，在初始化LinkedBlockingQueue的时候可以指定大小，
> 也可以不指定，默认类似一个无限大小的容量（Integer.MAX_VALUE），不指队列容量大小也是会有风险的，一旦数据生产速度大于消费速度，
> 系统内存将有可能被消耗殆尽，因此要谨慎操作。另外LinkedBlockingQueue中用于阻塞生产者、消费者的锁是两个（锁分离），因此生产与消费是可以同时进行的。

## 7.3. PriorityBlockingQueue

> 一个支持优先级排序的无界阻塞队列，进入队列的元素会按照优先级进行排序

## 7.4. SynchronousQueue

> 同步阻塞队列，SynchronousQueue没有容量，与其他BlockingQueue不同，
> SynchronousQueue是一个不存储元素的BlockingQueue，每一个put操作必须要等待一个take操作，
> 否则不能继续添加元素，反之亦然

## 7.5. DelayQueue

> DelayQueue是一个支持延时获取元素的无界阻塞队列，里面的元素全部都是“可延期”的元素，
> 列头的元素是最先“到期”的元素，如果队列里面没有元素到期，是不能从列头获取元素的，
> 哪怕有元素也不行，也就是说只有在延迟期到时才能够从队列中取元素

## 7.6. LinkedTransferQueue

> LinkedTransferQueue是基于链表的FIFO无界阻塞队列，它出现在JDK7中，Doug Lea 大神说LinkedTransferQueue是一个聪明的队列，
> 它是ConcurrentLinkedQueue、SynchronousQueue(公平模式下)、无界的LinkedBlockingQueues等的超集，`
> LinkedTransferQueue`包含了`ConcurrentLinkedQueue、SynchronousQueue、LinkedBlockingQueues`三种队列的功能