---
title: ThreadLocal
date: 2025-05-25
---

# 1. ThreadLocal

提供了本地线程的实例，即每个使用该变量的线程都会初始化一个完全独立的实例副本。
ThreadLocal变量通常`private static`修饰。当一个线程结束时，
它所使用的所有ThreadLocal所生成的实例副本也会被回收。
这样做，就会让这些实例副本在线程之间完全独立，而ThreadLocal类实例在线程之间共享，通过具体的方法共享访问。

## 1.1. 实现

### 1.1.1. ThreadLocal的set方法，key是当前的线程

```text
public void set(T value) {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null)
            map.set(this, value);
        else
            createMap(t, value);
    }
```

### 1.1.2. 原理

内部维护一个`static class ThreadLocalMap` 这样一个静态内部类，而这个ThreadLocalMap类中，还有一个静态内部类

```shell
static class Entry extends WeakReference<ThreadLocal<?>> {
            /** The value associated with this ThreadLocal. */
            Object value;
            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
        }
private Entry[] table;
```

### 1.1.3. set

ThreadLocalMap中的set()方法，在出现key为null的情况下，会调用replaceStaleEntry()方法，将这个对象替换掉

```shell
private void set(ThreadLocal<?> key, Object value) {

            // We don't use a fast path as with get() because it is at
            // least as common to use set() to create new entries as
            // it is to replace existing ones, in which case, a fast
            // path would fail more often than not.

            Entry[] tab = table;
            int len = tab.length;
            int i = key.threadLocalHashCode & (len-1);

            for (Entry e = tab[i];
                 e != null;
                 e = tab[i = nextIndex(i, len)]) {
                ThreadLocal<?> k = e.get();

                if (k == key) {
                    e.value = value;
                    return;
                }

                if (k == null) {
                    replaceStaleEntry(key, value, i);
                    return;
                }
            }

            tab[i] = new Entry(key, value);
            int sz = ++size;
            if (!cleanSomeSlots(i, sz) && sz >= threshold)
                rehash();
        }

```

注意到Entry是继承自WeakReference这个弱引用的，当system.GC()时，无法此时JVM中内存是否足够，都要被回收。

**存在的问题**

- 线程安全问题：新增线程或销毁线程都要读写ThreadLocal的中map,如何确保线程安全；
  可以用锁，但把map维护交由thread处理，而不是ThreadLocal。
  即每个Thread只访问自己的map，就不存在写的问题。
- 内存问题：当一个线程结束，它在ThreadLocal里面的键是弱引用，但值还存在强引用的话，
  GC无法回收这个内存。在调用 set()、get()  、remove() 方法的时候，
  会清理掉 key 为 null 的记录，即调用 replaceStaleEntry()方法。

## 1.2. 应用场景

- session会话

# 2. InheritableThreadLocal

当一个主线程中使用了线程池或衍生了多个子线程，使用ThreadLocal是不能get到值的。

```shell
/*
 * Copyright (c) 1998, 2012, Oracle and/or its affiliates. All rights reserved.
 * ORACLE PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

package java.lang;
import java.lang.ref.*;

/**
 * This class extends <tt>ThreadLocal</tt> to provide inheritance of values
 * from parent thread to child thread: when a child thread is created, the
 * child receives initial values for all inheritable thread-local variables
 * for which the parent has values.  Normally the child's values will be
 * identical to the parent's; however, the child's value can be made an
 * arbitrary function of the parent's by overriding the <tt>childValue</tt>
 * method in this class.
 *
 * <p>Inheritable thread-local variables are used in preference to
 * ordinary thread-local variables when the per-thread-attribute being
 * maintained in the variable (e.g., User ID, Transaction ID) must be
 * automatically transmitted to any child threads that are created.
 *
 * @author  Josh Bloch and Doug Lea
 * @see     ThreadLocal
 * @since   1.2
 */

public class InheritableThreadLocal<T> extends ThreadLocal<T> {
    /**
     * Computes the child's initial value for this inheritable thread-local
     * variable as a function of the parent's value at the time the child
     * thread is created.  This method is called from within the parent
     * thread before the child is started.
     * <p>
     * This method merely returns its input argument, and should be overridden
     * if a different behavior is desired.
     *
     * @param parentValue the parent thread's value
     * @return the child thread's initial value
     */
    protected T childValue(T parentValue) {
        return parentValue;
    }

    /**
     * Get the map associated with a ThreadLocal.
     *
     * @param t the current thread
     */
    ThreadLocalMap getMap(Thread t) {
       return t.inheritableThreadLocals;
    }

    /**
     * Create the map associated with a ThreadLocal.
     *
     * @param t the current thread
     * @param firstValue value for the initial entry of the table.
     */
    void createMap(Thread t, T firstValue) {
        t.inheritableThreadLocals = new ThreadLocalMap(this, firstValue);
    }
}

```

整个InheritableThreadLocal就是这三个方法，其他都是使用从父类继承的方法，因此，真正实现InheritableThreadLocal的过程是在Thread类中的Ini()
方法中。每个Thread类实例都有如下 两个成员变量：

```shell
// 每个线程都拥有这两个成员变量
    ThreadLocal.ThreadLocalMap threadLocals = null;
    ThreadLocal.ThreadLocalMap inheritableThreadLocals = null;
// 线程在初始化过程中会判断当前主线程的inheritableThreadLocals对像不为空时，
// 构造出一个ThreadLocalMap对象
private void init(ThreadGroup g, Runnable target, String name,
                      long stackSize, AccessControlContext acc) {
    	Thread parent = currentThread();
       
        if (parent.inheritableThreadLocals != null)
            this.inheritableThreadLocals =
                ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
      
    }
// 将当前主线程的ThreadLocalMap的值复制一份给inheritableThreadLocals
private ThreadLocalMap(ThreadLocalMap parentMap) {
            Entry[] parentTable = parentMap.table;
            int len = parentTable.length;
            setThreshold(len);
            table = new Entry[len];

            for (int j = 0; j < len; j++) {
                Entry e = parentTable[j];
                if (e != null) {
                    @SuppressWarnings("unchecked")
                    ThreadLocal<Object> key = (ThreadLocal<Object>) e.get();
                    if (key != null) {
                        Object value = key.childValue(e.value);
                        Entry c = new Entry(key, value);
                        int h = key.threadLocalHashCode & (len - 1);
                        while (table[h] != null)
                            h = nextIndex(h, len);
                        table[h] = c;
                        size++;
                    }
                }
            }
        }
```

- [参考文档](https://my.oschina.net/xinxingegeya/blog/911883)

## 2.1. 示例

子线程无法直接获取父线程中的值，需要会用InheritableThreadLocal类

```shell
public class ThreadLocalDemo {
    public static void main(String[] args) {
        //ThreadLocal<String>  threadLocal = new InheritableThreadLocal<>();
        ThreadLocal<String>  threadLocal = new ThreadLocal();

        ThreadLocalDemo threadLocalDemo= new ThreadLocalDemo();
        for(int i=0;i<10;++i){
            String id = String.valueOf(i);
            new Thread(()->{
                threadLocal.set(id);
                String s = threadLocal.get();
                if((Integer.valueOf(id)&1)==0){
                    new Thread(()->{
                        System.out.println(Thread.currentThread().getName() + ":::" + threadLocal.get());
                    }).start();
                }else {
                    System.out.println(Thread.currentThread().getName() + ":::" + s);
                }
                threadLocal.remove();
            }).start();
        }
    }
}

```