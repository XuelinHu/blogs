---
title: Set
date: 2025-07-30
created: 2025-07-30
updated: 2025-07-30
---

# 1. Set

## 1.1. Hashset

本质是一个HashMap

```java
private transient HashMap<E,Object> map;
    
public boolean add(E e) {
    return map.put(e, PRESENT)==null;
}
```

## 1.2. TreeSet

本质是TreeMap

## 1.3. LinkedHashSet

```java

public class LinkedHashSet<E>
    extends HashSet<E>
    implements Set<E>, Cloneable, java.io.Serializable {


public class LinkedHashMap<K,V>
    extends HashMap<K,V>
    implements Map<K,V>
```

## 1.4. CopyOnWriteArraySet
本质上是`CopyOnWriteArrayList`
```java

private boolean addIfAbsent(E e, Object[] snapshot) {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
            Object[] current = getArray();
            int len = current.length;
            if (snapshot != current) {
                // Optimize for lost race to another addXXX operation
                int common = Math.min(snapshot.length, len);
                for (int i = 0; i < common; i++)
                    if (current[i] != snapshot[i] && eq(e, current[i]))
                        return false;
                if (indexOf(e, current, common, len) >= 0)
                        return false;
            }
            Object[] newElements = Arrays.copyOf(current, len + 1);
            newElements[len] = e;
            setArray(newElements);
            return true;
        } finally {
            lock.unlock();
        }
    }
```