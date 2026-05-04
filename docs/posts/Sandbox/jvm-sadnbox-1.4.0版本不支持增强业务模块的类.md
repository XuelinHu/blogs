---
title: jvm-sadnbox-1.4.0版本不支持增强业务模块的类
date: 2025-05-25
---


# 1. 原因分析

## 1.1. 分析1
对比了1.4.0和1.3.0的代码，有以下代码，看着像是把业务类与sandbox类分离，后来发现在搞错了，这个是为了增强一类native本地方法的
```java
// 如果未开启unsafe开关，是不允许增强来自BootStrapClassLoader的类
if (!isEnableUnsafe
     && null == loader) {
logger.debug("transform ignore {}, class from bootstrap but unsafe.enable=false.", internalClassName);
    return null;
}
```

## 1.2. 分析2
对比了1.4.0和1.3.0的代码，发现BusinessClassLoaderHolder类被移除了，
因为每次增强被触发后，是以事件监听器来处理的，所以1.3.3版本是
在EventListenerHandler类中以如下代码。这串代码在1.4.0中移除了。
所以在EventListenerHandler（这个类处在sandbox.core包下）执行时，
线程的上下文不是业务类加载器，是jvm-sandbox的类加载器。
```java
package com.alibaba.jvm.sandbox.core.classloader;

/**
 * @author zhuangpeng
 * @since 2020/1/15
 */
public class BusinessClassLoaderHolder {

    private static final ThreadLocal<DelegateBizClassLoader> holder = new ThreadLocal<DelegateBizClassLoader>();

    public static void setBussinessClassLoader(ClassLoader classLoader){
        if(null == classLoader){
            return;
        }
        DelegateBizClassLoader delegateBizClassLoader = new DelegateBizClassLoader(classLoader);
        holder.set(delegateBizClassLoader);
    }


    public static void removeBussinessClassLoader(){
        holder.remove();
    }

    public static DelegateBizClassLoader getBussinessClassLoader(){

        return null != holder ? holder.get() : null;
    }

    public static class DelegateBizClassLoader extends ClassLoader{
        public DelegateBizClassLoader(ClassLoader parent){
            super(parent);
        }

        @Override
        public Class<?> loadClass(final String javaClassName, final boolean resolve) throws ClassNotFoundException {
            return super.loadClass(javaClassName,resolve);
        }
    }
}

```
**在类加载中，在事件处置中，将参数的类加载器，置入,代码如下：**

```java
final ClassLoader javaClassLoader=ObjectIDs.instance.getObject(targetClassLoaderObjectID);
        //放置业务类加载器
        BusinessClassLoaderHolder.setBussinessClassLoader(javaClassLoader);

```
**这个加载器使用，类加载的时机**

```java
@Override
    protected Class<?> loadClass(final String javaClassName, final boolean resolve) throws ClassNotFoundException {
        synchronized (getClassLoadingLock0(javaClassName)){
            // 优先查询类加载路由表,如果命中路由规则,则优先从路由表中的ClassLoader完成类加载
            if (ArrayUtils.isNotEmpty(routingArray)) {
                for (final Routing routing : routingArray) {
                    if (!routing.isHit(javaClassName)) {
                        continue;
                    }
                    final ClassLoader routingClassLoader = routing.classLoader;
                    try {
                        return routingClassLoader.loadClass(javaClassName);
                    } catch (Exception cause) {
                        // 如果在当前routingClassLoader中找不到应该优先加载的类(应该不可能，但不排除有就是故意命名成同名类)
                        // 此时应该忽略异常，继续往下加载
                        // ignore...
                    }
                }
            }

            // 先走一次已加载类的缓存，如果没有命中，则继续往下加载
            final Class<?> loadedClass = findLoadedClass(javaClassName);
            if (loadedClass != null) {
                return loadedClass;
            }

            try {
                Class<?> aClass = findClass(javaClassName);
                if (resolve) {
                    resolveClass(aClass);
                }
                return aClass;
            } catch (Exception cause) {
                DelegateBizClassLoader delegateBizClassLoader = BusinessClassLoaderHolder.getBussinessClassLoader();
                try {
                    if(null != delegateBizClassLoader){
                        return delegateBizClassLoader.loadClass(javaClassName,resolve);
                    }
                } catch (Exception e) {
                    //忽略异常，继续往下加载
                }
                return RoutingURLClassLoader.super.loadClass(javaClassName, resolve);
            }
        }
    }

```
问题可以定位是因为分析2。