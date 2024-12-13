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
const BLOCK_SIZE = 64000; // Deno KV limit is 64k

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
                .replaceAll(
                    "{:url}",
                    `${url.protocol}//${url.host}/APM_CLOUD_PRIVATE_PATH/`,
                );
            return response200HTML(content);
        }
        return response404();
    }
    if (url.pathname.toLowerCase().endsWith("/upload")) {
        // upload
        const userID = decodeURIComponent(req.headers.get("userid") ?? "");
        console.log("用户名:", userID);
        if (userID === "" || userID === "undefined") {
            return response404(); // no username
        }
        // save data to deno kv
        const db = await Deno.openKv();
        // delete old one
        const currentData = [];
        const iter = db.list({ prefix: ["user_backup", userID] });
        for await (const res of iter) {
            currentData.push(res);
        }
        await Promise.all(currentData.map((res) => db.delete(res.key)));
        // save new one, split by block size
        const data = await req.arrayBuffer();
        console.log("size: ", data.byteLength);
        const saveOps = [];
        let pos = 0;
        let index = 0;
        while (pos < data.byteLength) {
            const endPos = Math.min(data.byteLength, pos + BLOCK_SIZE);
            const partData = data.slice(pos, endPos);
            saveOps.push(db.set(["user_backup", userID, index], partData));
            pos = endPos;
            index += 1;
        }
        saveOps.push(db.set(["user_backup", userID, "size"], index));
        await Promise.all(saveOps);
        // save end if no reject
        return response200();
    } else if (url.pathname.toLowerCase().indexOf("/download/") >= 0) {
        // download
        const userID = decodeURIComponent(url.pathname.substring(
            url.pathname.toLowerCase().lastIndexOf("/download/") +
                "/download/".length,
        ));
        console.log("用户名:", userID);
        if (userID === "" || userID === "undefined") {
            return response404(); // no username
        }
        // read data from deno kv
        const db = await Deno.openKv();
        // read kv size
        const sizeResult = await db.get<number>([
            "user_backup",
            userID,
            "size",
        ]);
        if (sizeResult.versionstamp === null) {
            return response404(); // not found
        }
        // read data block by block
        const dataQueryOps = [];
        for (let i = 0; i < sizeResult.value; i++) {
            dataQueryOps.push(db.get<ArrayBuffer>(["user_backup", userID, i]));
        }
        let blockResultList = await Promise.all(dataQueryOps);
        blockResultList = blockResultList.filter((res) =>
            res.versionstamp !== null
        );
        // make one big data
        const byteLength = blockResultList.map((res) =>
            res.value?.byteLength ?? 0
        ).reduce((pv, cv) => pv + cv, 0);
        const data = new Uint8Array(byteLength);
        blockResultList.reduce((pv, res) => {
            const buffer = res.value ?? new ArrayBuffer(0);
            data.set(new Uint8Array(buffer), pv);
            return pv + (res.value?.byteLength ?? 0); // pv = pv + data_length
        }, 0);
        console.log("size: ", data.byteLength);
        return response200(data.buffer);
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
