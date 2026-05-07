---
title: List
date: 2025-05-25
---

# 1. ArrayList

是最常用的List实现类，内部是通过数组实现的，它允许对元素进行快速随机访问。
数组的缺点是每个元素之间不能有间隔，当数组大小不满足时需要增加存储能力，
就要讲已经有数组的数据复制到新的存储空间中。
当从ArrayList的中间位置插入或者删除元素时，
需要对数组进行复制、移动、代价比较高。因此，它适合随机查找和遍历，
不适合插入和删除。

```java
//扩大了之前的1.5倍，使用>>1相当于除以2，用位运算更快。初始化，默认大小为10。
private static final int DEFAULT_CAPACITY = 10;

private void grow(int minCapacity) {
        // overflow-conscious code
        int oldCapacity = elementData.length;
        int newCapacity = oldCapacity + (oldCapacity >> 1);
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        // minCapacity is usually close to size, so this is a win:
        elementData = Arrays.copyOf(elementData, newCapacity);
    }

```

# 2. LinkedList

是用链表结构存储数据的，很适合数据的动态插入和删除，随机访问和遍历速度比较慢。
另外，他还提供了List接口中没有定义的方法，专门用于操作表头和表尾元素，
可以当作堆栈、队列和双向队列（因为它实现了Queue接口）使用。是双向链表。

```java

public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
    
    
private static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;

        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }

private E unlinkFirst(Node<E> f) {
        // assert f == first && f != null;
        final E element = f.item;
        final Node<E> next = f.next;
        f.item = null;
        f.next = null; // help GC
        first = next;
        if (next == null)
            last = null;
        else
            next.prev = null;
        size--;
        modCount++;
        return element;
    }

```

# 3. Vector

```java
public class Vector<E>
    extends AbstractList<E>
    implements List<E>, RandomAccess, Cloneable, java.io.Serializable
    
    
    protected Object[] elementData;

    public synchronized void addElement(E obj) {
        modCount++;
        ensureCapacityHelper(elementCount + 1);
        elementData[elementCount++] = obj;
    }
```


# 4. CopyOnWriteArrayList

```java
public boolean add(E e) {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            Object[] elements = getArray();
            int len = elements.length;
            Object[] newElements = Arrays.copyOf(elements, len + 1);
            newElements[len] = e;
            setArray(newElements);
            return true;
        } finally {
            lock.unlock();
        }
    }
```