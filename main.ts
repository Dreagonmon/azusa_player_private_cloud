const INDEX_HTML = `
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Private Cloud</title>
    </head>
    <body>
        <p>你的私有云地址为：</p>
        <p><pre><code>{:url}</code></pre></p>
        <p>记得在Environment Variables设置里面，添加一个环境变量: APM_CLOUD_PRIVATE_PATH</p>
        <p>或者删除该环境变量然后重新添加，使用新的私有云地址（相当于更改密码）</p>
    </body>
</html>
`;

const response200 = (data: string | ArrayBuffer | Uint8Array = "Ok") => {
    return new Response(
        data,
        {
            status: 200,
        },
    );
};
const response200HTML = (data: string) => {
    return new Response(
        data,
        {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
            status: 200,
        },
    );
};
const response404 = () => {
    return new Response(
        "Not Found",
        {
            status: 404,
        },
    );
};

const handler: Deno.ServeHandler = async (req, _) => {
    // get setting at runtime
    const SERVER_PRIVATE_PATH = Deno.env.get("APM_CLOUD_PRIVATE_PATH") ?? "";
    const _PRIVATE_PATH_PREFIX = "/" + SERVER_PRIVATE_PATH;
    const url = new URL(req.url);
    if (!url.pathname.startsWith(_PRIVATE_PATH_PREFIX)) {
        if (url.pathname == "/") {
            // print help text
            const content = INDEX_HTML
                .replaceAll("{:url}", `${url.protocol}//${url.host}/APM_CLOUD_PRIVATE_PATH/`);
            return response200HTML(content);
        }
        return response404();
    }
    if (url.pathname.toLowerCase().endsWith("/upload")) {
        // upload
        const userID = decodeURIComponent(req.headers.get("userid") ?? "");
        console.log("用户名:", userID);
        // save data to deno kv
        const data = await req.arrayBuffer();
        const db = await Deno.openKv();
        await db.set(["user_backup", userID], data);
        return response200();
    } else if (url.pathname.toLowerCase().indexOf("/download/") >= 0) {
        // download
        const userID = decodeURIComponent(url.pathname.substring(
            url.pathname.toLowerCase().lastIndexOf("/download/") +
                "/download/".length,
        ));
        console.log("用户名:", userID);
        // read data from deno kv
        const db = await Deno.openKv();
        const data = await db.get(["user_backup", userID]);
        if (data.value != null) {
            return response200(data.value as ArrayBuffer);
        }
    }
    return response404();
};

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
    Deno.serve({
        hostname: "0.0.0.0",
        handler,
    });
}
