# Azusa Player Private Cloud

用于azusa player private cloud 或 nox player的私有云服务

可以白嫖Deno Dev的免费服务进行部署，支持设置验证字符串，提高安全性。

## 部署方法

* 访问[https://deno.dev](https://dash.deno.com/account/overview)，并使用github账号登录
* 点击`New Playground`按钮，创建一个项目，并进入该Playground的编辑界面中
* 点击左上角的名称，修改为自己喜欢的名称
* 将`main.ts`中的代码复制到代码编辑框中，点击`Save & Deploy`按钮保存
* 点击上方的`设置图标`，找到`Environment Variables`设置
* 添加一个`APM_CLOUD_PRIVATE_PATH`环境变量，值为任意可以用于URL中的字符串，建议用uuid生成器随机生成一个
* 查看Playground的编辑界面右侧的页面，上面写了当前的私有云地址，将URL中的`APM_CLOUD_PRIVATE_PATH`替换为设置的字符串
* 确保要同步歌单的设备登录的是同一个b站账号，不同账号同步的数据会不一样
* 注意`APM_CLOUD_PRIVATE_PATH`的数值用于验证是否是合法访问，请保持该值不泄漏。如有需要可以参考下面的方法修改该值

## 修改保密路径(更改密码/忘记密码)

* 访问[https://deno.dev](https://dash.deno.com/account/overview)，并使用github账号登录
* 找到之前创建的Playground项目。点击打开
* 打开项目设置选项卡，找到`Environment Variables`设置
* 先删除旧的`APM_CLOUD_PRIVATE_PATH`环境变量，然后添加一个新的，完成值的修改
* 替换所有同步设备上的私有云地址的设置，换成新的URL
