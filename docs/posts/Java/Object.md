---
title: Object
date: 2025-05-25
---

# 1. 基础类型

| **类型**      | **字节数** |
|-------------|---------|
| **Byte**    | **1**   |
| **Char**    | **2**   |
| **Boolean** | **1**   |
| **Integer** | **4**   |
| **Short**   | **3**   |
| **Long**    | **8**   |
| **Double**  | **8**   |
| **Float**   | **4**   |

# 2. Object

```java
//本地方法的注册
private static native void registerNatives();
    static {
        registerNatives();
    }
    
//返回当前对象的运行时类，也称作类型类
public final native Class<?> getClass();    

//返回对象的hash值，默认是内存地址
public native int hashCode();

//比较两个对象是否相等
public boolean equals(Object obj) {
        return (this == obj);
    }
//克隆一个对象，注意浅拷贝的深拷贝，
// 被克隆的对象的类要实现Cloneable接口    
protected native Object clone() throws CloneNotSupportedException;

//将一个类打印出来 ，默认是类名加上hash地址
public String toString() {
        return getClass().getName() + "@" + Integer.toHexString(hashCode());
    }
    
//调用某个对象的notify()方法能够唤醒一个正在等待这个对象的monitor的线程，
// 如果有多个线程都在等待这个对象的monitor，则只能唤醒其中一个线程；
public final native void notify();

//调用notifyAll()方法能够唤醒所有正在等待这个对象的monitor的线程；
public final native void notifyAll();

public final native void wait(long timeout) throws InterruptedException;
public final void wait(long timeout, int nanos) throws InterruptedException 
public final void wait() throws InterruptedException

//当GC被执行时，会执行对象的finalize()方法 ，
// 可能让子类重写这个方法，完成合适的操作。
protected void finalize() throws Throwable { }
```

- 为何notify()，notifyAll(),wait()这三个不是Thread类声明中的方法，而是Object类中声明的方法
（当然由于Thread类继承了Object类，所以Thread也可以调用者三个方法）？
> 由于每个对象都拥有monitor（即锁），所以让当前线程等待某个对象的锁，当然应该通过这个对象来操作了。
而不是用当前线程来操作，因为当前线程可能会等待多个线程的锁，如果通过线程来操作，就非常复杂了。
上面已经提到，如果调用某个对象的wait()方法，当前线程必须拥有这个对象的monitor（即锁），
因此调用wait()方法必须在同步块或者同步方法中进行（synchronized块或者synchronized方法）。
调用某个对象的wait()方法，相当于让当前线程交出此对象的monitor锁，然后进入等待状态，
等待后续再次获得此对象的锁（Thread类中的sleep方法使当前线程暂停执行一段时间，
从而让其他线程有机会占用CPU执行代码，但它并不释放对象锁）；