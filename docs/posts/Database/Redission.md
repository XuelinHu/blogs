---
title: Redission
date: 2025-05-25
created: 2025-05-25
updated: 2026-09-02
---

- 图片来源：https://www.bilibili.com/video/BV1cr4y1671t?p=160&vd_source=f52d9488d7d3c21ed33580e4dce1a022

# 1. 分布式锁需要优化的问题

- 不可重入：同一个线程，依次执行两个方法都要获取同一把分布式锁，需要可重入锁
- 不可重试：获取锁只尝试一次就返回false，缺少重试机制
- 超时释放：业务执行时间长，导致锁释放，存在安全隐患
- 主从一致性：主从集群，数据同步存在时延，主机宕机，从机还没有完成同步锁数据

![lock.png](./img/lock.png)

# 2. 可重入锁

- 判断持有锁是不是自己
- 是自己将上锁次数+1
- 释放锁一次，上锁次数-1
- 释放锁两次，上锁次数-1，为0，释放锁

利用HASH结构记录线程ID和重入次数

```java
//org.redisson.RedissonLock#tryLockInnerAsync 

<T> RFuture<T> tryLockInnerAsync(long leaseTime, TimeUnit unit, long threadId, RedisStrictCommand<T> command) {
        internalLockLeaseTime = unit.toMillis(leaseTime);

        return evalWriteAsync(getName(), LongCodec.INSTANCE, command,
                "if (redis.call('exists', KEYS[1]) == 0) then " +
                        "redis.call('hincrby', KEYS[1], ARGV[2], 1); " +
                        "redis.call('pexpire', KEYS[1], ARGV[1]); " +
                        "return nil; " +
                        "end; " +
                        "if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then " +
                        "redis.call('hincrby', KEYS[1], ARGV[2], 1); " +
                        "redis.call('pexpire', KEYS[1], ARGV[1]); " +
                        "return nil; " +
                        "end; " +
                        "return redis.call('pttl', KEYS[1]);",
                Collections.singletonList(getName()), internalLockLeaseTime, getLockName(threadId));
    }
    
//  org.redisson.RedissonLock#unlockInnerAsync 
   
     protected RFuture<Boolean> unlockInnerAsync(long threadId) {
        return evalWriteAsync(getName(), LongCodec.INSTANCE, RedisCommands.EVAL_BOOLEAN,
                "if (redis.call('hexists', KEYS[1], ARGV[3]) == 0) then " +
                        "return nil;" +
                        "end; " +
                        "local counter = redis.call('hincrby', KEYS[1], ARGV[3], -1); " +
                        "if (counter > 0) then " +
                        "redis.call('pexpire', KEYS[1], ARGV[2]); " +
                        "return 0; " +
                        "else " +
                        "redis.call('del', KEYS[1]); " +
                        "redis.call('publish', KEYS[2], ARGV[1]); " +
                        "return 1; " +
                        "end; " +
                        "return nil;",
                Arrays.asList(getName(), getChannelName()), LockPubSub.UNLOCK_MESSAGE, internalLockLeaseTime, getLockName(threadId));
    }
```

# 3. 锁重试
- 不是单一的死循环，而是通过消息订阅和信号量的方式来节省资源，收到消息或信号量，才去重试获取锁
`org.redisson.RedissonLock#tryLock(long, long, java.util.concurrent.TimeUnit)`

```java
@Override
    public boolean tryLock(long waitTime, long leaseTime, TimeUnit unit) throws InterruptedException {
        long time = unit.toMillis(waitTime);
        long current = System.currentTimeMillis();
        long threadId = Thread.currentThread().getId();
        Long ttl = tryAcquire(leaseTime, unit, threadId);
        // lock acquired
        if (ttl == null) {
            return true;
        }
        
        time -= System.currentTimeMillis() - current;
        if (time <= 0) {
            acquireFailed(threadId);
            return false;
        }
        
        current = System.currentTimeMillis();
        // 订阅一个通知，这个通知就是锁释放时的通知 "redis.call('publish', KEYS[2], ARGV[1]); "
        RFuture<RedissonLockEntry> subscribeFuture = subscribe(threadId); 
        if (!subscribeFuture.await(time, TimeUnit.MILLISECONDS)) {
            if (!subscribeFuture.cancel(false)) {
                subscribeFuture.onComplete((res, e) -> {
                    if (e == null) {
                        unsubscribe(subscribeFuture, threadId);
                    }
                });
            }
            acquireFailed(threadId);
            return false;
        }

        try {
            time -= System.currentTimeMillis() - current;
            if (time <= 0) {
                acquireFailed(threadId);
                return false;
            }
        
            while (true) {
                long currentTime = System.currentTimeMillis();
                ttl = tryAcquire(leaseTime, unit, threadId);
                // lock acquired
                if (ttl == null) {
                    return true;
                }

                time -= System.currentTimeMillis() - currentTime;
                if (time <= 0) {
                    acquireFailed(threadId);
                    return false;
                }

                // waiting for message
                currentTime = System.currentTimeMillis();
                if (ttl >= 0 && ttl < time) {
                    subscribeFuture.getNow().getLatch().tryAcquire(ttl, TimeUnit.MILLISECONDS);
                } else {
                    subscribeFuture.getNow().getLatch().tryAcquire(time, TimeUnit.MILLISECONDS);
                }

                time -= System.currentTimeMillis() - currentTime;
                if (time <= 0) {
                    acquireFailed(threadId);
                    return false;
                }
            }
        } finally {
            unsubscribe(subscribeFuture, threadId);
        }
//        return get(tryLockAsync(waitTime, leaseTime, unit));
    }
```

# 4. 锁超时

- 获取锁之后，利用watchDog定时任务去续约

```java
//org.redisson.RedissonLock#tryAcquireAsync
//org.redisson.RedissonLock#scheduleExpirationRenewal
//org.redisson.RedissonLock#renewExpiration
//org.redisson.RedissonLock#scheduleExpirationRenewal
private void renewExpiration() {
        ExpirationEntry ee = EXPIRATION_RENEWAL_MAP.get(getEntryName());
        if (ee == null) {
            return;
        }
        
        Timeout task = commandExecutor.getConnectionManager().newTimeout(new TimerTask() {
            @Override
            public void run(Timeout timeout) throws Exception {
                ExpirationEntry ent = EXPIRATION_RENEWAL_MAP.get(getEntryName());
                if (ent == null) {
                    return;
                }
                Long threadId = ent.getFirstThreadId();
                if (threadId == null) {
                    return;
                }
                
                RFuture<Boolean> future = renewExpirationAsync(threadId);
                future.onComplete((res, e) -> {
                    if (e != null) {
                        log.error("Can't update lock " + getName() + " expiration", e);
                        return;
                    }
                    
                    if (res) {
                        // reschedule itself
        // 递归调用自身，会不断的续约，什么时候取消续约。在锁释放时 cancelExpirationRenewal(threadId);
                        renewExpiration();
                    }
                });
            }
        }, internalLockLeaseTime / 3, TimeUnit.MILLISECONDS);
        
        ee.setTimeout(task);
    }
    
private void scheduleExpirationRenewal(long threadId) {
        ExpirationEntry entry = new ExpirationEntry();
        // 续约时，锁的可重入
        ExpirationEntry oldEntry = EXPIRATION_RENEWAL_MAP.putIfAbsent(getEntryName(), entry);
        if (oldEntry != null) {
            oldEntry.addThreadId(threadId);
        } else {
            entry.addThreadId(threadId);
            renewExpiration();
        }
    }
```

# 5. 主从一致性

如下图所示：主节点宕机后，数据同步没有完成，导致新的主节点没有同步原主节点的数据，来上锁时，别的JVM上锁成功了。

![distribute2.png](./img/distribute2.png)

所以不使用主从的形式来管理集群，使用同等节点的方式 **redissonClient.getMultiLock()**

![distribute.png](./img/distribute.png)

- 所有节点要全部上锁
- 一个失败，其他要全部释放
- 全部上锁后，要续约一次，使首次上锁与末次上锁的释放时间保持一致

## 5.1 续约

```java
@Override
org.redisson.RedissonMultiLock#tryLock(long, long, java.util.concurrent.TimeUnit)
    public boolean tryLock(long waitTime, long leaseTime, TimeUnit unit) throws InterruptedException {
//        try {
//            return tryLockAsync(waitTime, leaseTime, unit).get();
//        } catch (ExecutionException e) {
//            throw new IllegalStateException(e);
//        }
        long newLeaseTime = -1;
        if (leaseTime != -1) {
            if (waitTime == -1) {
                newLeaseTime = unit.toMillis(leaseTime);
            } else {
                newLeaseTime = unit.toMillis(waitTime)*2;
            }
        }
        
        long time = System.currentTimeMillis();
        long remainTime = -1;
        if (waitTime != -1) {
            remainTime = unit.toMillis(waitTime);
        }
        long lockWaitTime = calcLockWaitTime(remainTime);
        
        int failedLocksLimit = failedLocksLimit();
        List<RLock> acquiredLocks = new ArrayList<>(locks.size());
        for (ListIterator<RLock> iterator = locks.listIterator(); iterator.hasNext();) {
            RLock lock = iterator.next();
            boolean lockAcquired;
            try {
                if (waitTime == -1 && leaseTime == -1) {
                    lockAcquired = lock.tryLock();
                } else {
                    long awaitTime = Math.min(lockWaitTime, remainTime);
                    lockAcquired = lock.tryLock(awaitTime, newLeaseTime, TimeUnit.MILLISECONDS);
                }
            } catch (RedisResponseTimeoutException e) {
                unlockInner(Arrays.asList(lock));
                lockAcquired = false;
            } catch (Exception e) {
                lockAcquired = false;
            }
            
            if (lockAcquired) {
                acquiredLocks.add(lock);
            } else {
                if (locks.size() - acquiredLocks.size() == failedLocksLimit()) {
                    break;
                }

                if (failedLocksLimit == 0) {
                    unlockInner(acquiredLocks);
                    if (waitTime == -1) {
                        return false;
                    }
                    failedLocksLimit = failedLocksLimit();
                    acquiredLocks.clear();
                    // reset iterator
                    while (iterator.hasPrevious()) {
                        iterator.previous();
                    }
                } else {
                    failedLocksLimit--;
                }
            }
            
            if (remainTime != -1) {
                remainTime -= System.currentTimeMillis() - time;
                time = System.currentTimeMillis();
                if (remainTime <= 0) {
                    unlockInner(acquiredLocks);
                    return false;
                }
            }
        }

        if (leaseTime != -1) {
            List<RFuture<Boolean>> futures = new ArrayList<>(acquiredLocks.size());
            for (RLock rLock : acquiredLocks) {
                RFuture<Boolean> future = ((RedissonLock) rLock).expireAsync(unit.toMillis(leaseTime), TimeUnit.MILLISECONDS);
                futures.add(future);
            }
            
            for (RFuture<Boolean> rFuture : futures) {
                rFuture.syncUninterruptibly();
            }
        }
        
        return true;
    }
```
