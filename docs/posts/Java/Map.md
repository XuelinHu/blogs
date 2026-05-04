---
title: Map
date: 2025-05-25
---

# 1. Map

|                       | **可为空** | **有序**   | **线程安全** | **其他**  |
|-----------------------|---------|----------|----------|---------|
| **HashMap**           | **是**   | **否**    | **否**    |         |
| **HashTable**         | **否**   | **否**    | **是**    | **效率慢** |
| **TreeMap**           | **否**   | **是**    | **否**    | **红黑树** |
| **LinkedHashMap**     | **否**   | **先后顺序** | **否**    | **红黑树** |
| **ConcurrentHashMap** |         | **否**    | **是**    |         |

# 2. HashMap

```java
transient Node<K, V>[]table; // 不能被序列化
static final int DEFAULT_INITIAL_CAPACITY=1<<4; // aka 16 初始大小为16
static final int MAXIMUM_CAPACITY=1<<30;
//负载因子当map中的个数超过capacity*load factor时，
// 重新调整capacity大小为当前的2倍，
// 又称作装填因子，值越大，产生冲突的可能就越大。
static final float DEFAULT_LOAD_FACTOR=0.75f;

static final int hash(Object key){
        int h;
        //这么的原因是混合原始哈希码的高位和低位，以此来加大低位的随机性，
        // 而且混合后的低位掺杂了高位的部分特征，这样高位的信息也被变相保留下来。
        //还有一个数组的长度不可能达到2^32，所以简单的将hash值与数据长度相与，
        // hash值的高位特征一址没有被使用，所以把16位右移，
        // 与低16异或，加大了随机性，也利用的高位的值特征
        return(key==null)?0:(h=key.hashCode())^(h>>>16);//无符号右移
        }


final V putVal(int hash,K key,V value,boolean onlyIfAbsent,
        boolean evict){
        Node<K, V>[]tab;Node<K, V> p;int n,i;
        if((tab=table)==null||(n=tab.length)==0)
        n=(tab=resize()).length;
        if((p=tab[i=(n-1)&hash])==null)//将hash值与数组长度相与，得了的索引值不冲突，直接存入
        tab[i]=newNode(hash,key,value,null);
        else{//冲突了
        Node<K, V> e;K k;
        //hash值相同，键值也相同
        if(p.hash==hash&&
        ((k=p.key)==key||(key!=null&&key.equals(k))))
        e=p;//e暂存这个已存在的冲突元素
        //hash值相同，键值不同，但这个已存在元素是以TreeNode形式存储
        else if(p instanceof TreeNode)
        e=((TreeNode<K, V>)p).putTreeVal(this,tab,hash,key,value);
        //碰撞发生，发链表形式存放在末尾
        else{
        for(int binCount=0;;++binCount){
        if((e=p.next)==null){
        p.next=newNode(hash,key,value,null);
        if(binCount>=TREEIFY_THRESHOLD-1) // -1 for 1st
        treeifyBin(tab,hash);
        break;
        }
        if(e.hash==hash&&
        ((k=e.key)==key||(key!=null&&key.equals(k))))
        break;
        p=e;
        }
        }
        //对象存在，更新值
        if(e!=null){ // existing mapping for key
        V oldValue=e.value;
        if(!onlyIfAbsent||oldValue==null)
        e.value=value;
        afterNodeAccess(e);
        return oldValue;
        }
        }
        ++modCount;
        //大小越界，重新调整
        if(++size>threshold)
        resize();
        afterNodeInsertion(evict);
        return null;
        }


final Node<K, V> getNode(int hash,Object key){
        Node<K, V>[]tab;Node<K, V> first,e;int n;K k;
        if((tab=table)!=null&&(n=tab.length)>0&&
        (first=tab[(n-1)&hash])!=null){
        //命中
        if(first.hash==hash&& // always check first node
        ((k=first.key)==key||(key!=null&&key.equals(k))))
        return first;
        //未命中
        if((e=first.next)!=null){
        //在树中
        if(first instanceof TreeNode)
        return((TreeNode<K, V>)first).getTreeNode(hash,key);

        do{
        if(e.hash==hash&&
        ((k=e.key)==key||(key!=null&&key.equals(k))))
        return e;
        }while((e=e.next)!=null);//从链表中查找
        }
        }
        return null;
        }
```

- 使用头插法替换尾插法，避免出现循环列表
- 当长度达到8时，链表转换成红黑树
- 扩容时是原来的2倍，在扩容时可以确保扩容前的链表结构不变，key冲突的在新的扩容桶中

# 3. LinkedHashMap

可用于LRU(最近最少使用)算法的实现，还有一种实现方式就是MAP加上LinkedList（双向链表）。

# 4. ConcurrentHashMap

## 4.1. ConcurrentHashMap 是如何保证线程安全的？

通过使用分段锁（在 Java 7 及之前的版本中）和 CAS（Compare-And-Swap）操作（在 Java 8 及之后的版本中）来实现线程安全。
在 Java 7 及之前的版本中，ConcurrentHashMap 使用分段锁来提高并发性能。
每个 segment 是一个独立的哈希表，拥有自己的锁，允许多个线程同时读写不同的 segment。
在 Java 8 中，ConcurrentHashMap 的实现发生了重大变化，放弃了分段锁的设计，
采用了基于 Node 数组 + CAS + Synchronized 的方式来实现线程安全。
这种新的设计在减少内存消耗和提高并发性能方面有所优化。

```text
putVal()
│
├─ 空桶？→ CAS 插入（无锁）
│
├─ 桶正在扩容？→ 协助扩容（helpTransfer）
│
└─ 桶非空？→ synchronized(f)（分桶锁）
       │
       ├─ 链表插入 / 更新
       └─ 红黑树插入 / 更新


final V putVal(K key, V value, boolean onlyIfAbsent) {
        if (key == null || value == null) throw new NullPointerException();
        int hash = spread(key.hashCode());
        int binCount = 0;
        for (Node<K,V>[] tab = table;;) {
            Node<K,V> f; int n, i, fh;
            if (tab == null || (n = tab.length) == 0)
                tab = initTable();
            else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
                if (casTabAt(tab, i, null,
                             new Node<K,V>(hash, key, value, null)))
                    break;                   // no lock when adding to empty bin
            }
            else if ((fh = f.hash) == MOVED)
                tab = helpTransfer(tab, f);
            else {
                V oldVal = null;
                synchronized (f) {
                    if (tabAt(tab, i) == f) {
                        if (fh >= 0) {
                            binCount = 1;
                            for (Node<K,V> e = f;; ++binCount) {
                                K ek;
                                if (e.hash == hash &&
                                    ((ek = e.key) == key ||
                                     (ek != null && key.equals(ek)))) {
                                    oldVal = e.val;
                                    if (!onlyIfAbsent)
                                        e.val = value;
                                    break;
                                }
                                Node<K,V> pred = e;
                                if ((e = e.next) == null) {
                                    pred.next = new Node<K,V>(hash, key,
                                                              value, null);
                                    break;
                                }
                            }
                        }
                        else if (f instanceof TreeBin) {
                            Node<K,V> p;
                            binCount = 2;
                            if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,
                                                           value)) != null) {
                                oldVal = p.val;
                                if (!onlyIfAbsent)
                                    p.val = value;
                            }
                        }
                    }
                }
                if (binCount != 0) {
                    if (binCount >= TREEIFY_THRESHOLD)
                        treeifyBin(tab, i);
                    if (oldVal != null)
                        return oldVal;
                    break;
                }
            }
        }
        addCount(1L, binCount);
        return null;
    }

```



## 4.2. 与 Hashtable 和 Collections.synchronizedMap() 相比，ConcurrentHashMap 有哪些优势？

Hashtable 在整个表上加锁，影响并发性能；Collections.synchronizedMap() 返回的 Map 也是线程安全的，
但它也是在整个表上加锁。而 ConcurrentHashMap 通过分段锁或 CAS 操作实现了更细粒度的锁控制，提高了并发性能。


```java
public synchronized V put(K key, V value) {
        // Make sure the value is not null
        if (value == null) {
            throw new NullPointerException();
        }

        // Makes sure the key is not already in the hashtable.
        Entry<?,?> tab[] = table;
        int hash = key.hashCode();
        int index = (hash & 0x7FFFFFFF) % tab.length;
        @SuppressWarnings("unchecked")
        Entry<K,V> entry = (Entry<K,V>)tab[index];
        for(; entry != null ; entry = entry.next) {
            if ((entry.hash == hash) && entry.key.equals(key)) {
                V old = entry.value;
                entry.value = value;
                return old;
            }
        }

        addEntry(hash, key, value, index);
        return null;
    }
```