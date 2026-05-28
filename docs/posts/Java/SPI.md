---
title: SPI
date: 2025-05-25
created: 2025-05-25
updated: 2025-05-25
---

# 1. maven库

使用这个库，加上注解的类，编译后，在META-INFO目录下，生成配置文件

```xml

<dependency>
    <groupId>org.kohsuke.metainf-services</groupId>
    <artifactId>metainf-services</artifactId>
    <version>${metainf-services.version}</version>
    <scope>compile</scope>
</dependency>
```

> @MetaInfServices(InspectorPlugin.class)

# 2. java加载SPI

Java的SPI机制就是指：针对一个接口，我们需要加载外部对该接口的实现，
只要约定好将该实现配置在classPath路径下的META-INF/services文件夹的文件，使用方就可以自动加载文件里所定义的类。

SPI中三个重要的角色：

- 接口

```java
public interface InspectorPlugin {

    String identify();

    boolean enable(List<String> plugins);

    boolean entrance();

    int watch(ModuleEventWatcher watcher, InvocationSendService service);

}
```

- 配置文件

```java

@MetaInfServices(InspectorPlugin.class)
public class DubboProviderPlugin extends BasePlugin {
    public DubboProviderPlugin(InvocationSendService invocationSendService) {
        super(Constant.DUBBO_PROVIDER, true, invocationSendService);
    }


    @Override
    public void watch(ModuleEventWatcher watcher) {
        new EventWatchBuilder(watcher)
                .onClass("org.apache.dubbo.rpc.filter.ContextFilter").includeBootstrap()
                .onBehavior("invoke")
                .onWatch(new DubboProviderEventListener(entrance, protocol, invocationSendService), Event.Type.BEFORE, Event.Type.RETURN, Event.Type.THROWS);
    }
}
```

- ServiceLoader反射获取

``` java
private List<InspectorPlugin> loadInspectorPluginBySPI( ClassLoader classLoader) {
        ServiceLoader<InspectorPlugin> loaded = ServiceLoader.load(InspectorPlugin.class, classLoader);
        Iterator<InspectorPlugin> spiIterator = loaded.iterator();
        List<InspectorPlugin> target = Lists.newArrayList();
        while (spiIterator.hasNext()) {
            try {
                target.add(spiIterator.next());
            } catch (Throwable e) {
                log.error("Error load spi InspectorPlugin >>> ", e);
            }
        }
        return target;
    }
```