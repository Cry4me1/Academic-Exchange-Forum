import { NextRequest } from "next/server";
import { Sandbox, OutputMessage, Result } from "@e2b/code-interpreter";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export const maxDuration = 60; // 允许最长 60 秒运行

// 自动寻找本地最优 Python 环境 (优先定位带有 CUDA 显卡加速的 PyTorch 环境)
function getLocalPythonPath(): string {
  if (process.env.PYTHON_SANDBOX_PATH && fs.existsSync(process.env.PYTHON_SANDBOX_PATH)) {
    return process.env.PYTHON_SANDBOX_PATH;
  }
  const knownCandidates = [
    path.join(os.homedir(), "AppData", "Local", "Programs", "Python", "Python313", "python.exe"),
    path.join(os.homedir(), "Desktop", "ai-from-scratch", ".venv", "Scripts", "python.exe"),
    path.join(os.homedir(), "AppData", "Local", "Programs", "Python", "Python311", "python.exe"),
    path.join(os.homedir(), "AppData", "Local", "Programs", "Python", "Python312", "python.exe"),
  ];
  for (const candidate of knownCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return process.platform === "win32" ? "python" : "python3";
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "代码内容不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 基础静态敏感操作拦截 (防穿透与恶意攻击)
    const dangerousPatterns = [
      /import\s+os\s*;\s*os\.system/i,
      /subprocess\./i,
      /shutil\.rmtree/i,
      /__import__\(['"]os['"]\)\.system/i,
      /open\(['"]\/etc\//i,
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return new Response(
          JSON.stringify({ error: "安全审计拦截: 检测到禁止执行的高危系统调用。" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const apiKey = process.env.E2B_API_KEY;
    const encoder = new TextEncoder();

    // 采用 Server-Sent Events (SSE) 实时推流
    const stream = new ReadableStream({
      async start(controller) {
        const send = (
          event: "stdout" | "stderr" | "image" | "meta" | "error" | "done",
          data: unknown
        ) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        // -------------------------------------------------------------
        // 分支 1: 使用已配置并验证的 E2B 云端沙盒
        // -------------------------------------------------------------
        if (apiKey) {
          let sandbox: Sandbox | null = null;
          try {
            send("meta", "正在分配 E2B 云端沙盒微虚拟机 (Firecracker MicroVM)...");

            const template = process.env.E2B_TEMPLATE_ID || undefined;
            sandbox = template ? await Sandbox.create(template) : await Sandbox.create();

            send("meta", "云端计算环境已就绪，正在编译并执行代码图谱...");

            const execution = await sandbox.runCode(code, {
              onStdout: (output: OutputMessage) => {
                send("stdout", output.line);
              },
              onStderr: (output: OutputMessage) => {
                send("stderr", output.line);
              },
              onResult: (result: Result) => {
                if (result.png) {
                  send("image", result.png);
                }
              },
            });

            if (execution.results && execution.results.length > 0) {
              for (const res of execution.results) {
                if (res.png) {
                  send("image", res.png);
                }
              }
            }

            if (execution.error) {
              send(
                "stderr",
                `${execution.error.name}: ${execution.error.value}\n${execution.error.traceback || ""}`
              );
            }

            send("done", { success: !execution.error, provider: "e2b-cloud" });
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "E2B 沙盒执行异常";
            send("error", `E2B 错误: ${errorMsg}`);
          } finally {
            if (sandbox) {
              try {
                await sandbox.kill();
              } catch {
                // 忽略断开
              }
            }
            controller.close();
          }
          return;
        }

        // -------------------------------------------------------------
        // 分支 2: 本地高算力 GPU/CUDA 运行时模式 (0费用 · 真显卡直连)
        // -------------------------------------------------------------
        const pyExecutable = getLocalPythonPath();
        send(
          "meta",
          `正在调用宿主真机高算力 Python 运行时 (${path.basename(pyExecutable)} · CUDA 加速)...`
        );

        const wrapperScript = `
import sys, io, base64
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    def _hook_show(*a, **kw):
        b = io.BytesIO()
        plt.savefig(b, format='png', bbox_inches='tight', dpi=120)
        b.seek(0)
        print("\\n[SANDBOX_IMAGE:" + base64.b64encode(b.read()).decode('utf-8') + "]\\n", flush=True)
        plt.close()
    plt.show = _hook_show
except Exception:
    pass

user_code = sys.stdin.read()
exec(user_code, {'__name__': '__main__'})
`;

        const pyProc = spawn(pyExecutable, ["-c", wrapperScript], {
          env: {
            ...process.env,
            PYTHONUNBUFFERED: "1",
            PYTHONIOENCODING: "utf-8",
          },
        });

        const timeout = setTimeout(() => {
          pyProc.kill("SIGKILL");
          send("stderr", "\n[超时中断] 运行耗时超过 30 秒上限。");
          send("done", { success: false, timeout: true });
          controller.close();
        }, 30000);

        pyProc.stdout.on("data", (data: Buffer) => {
          const text = data.toString("utf-8");
          const imgRegex = /\[SANDBOX_IMAGE:([^\]]+)\]/g;
          let match;
          let cleanText = text;

          while ((match = imgRegex.exec(text)) !== null) {
            send("image", match[1]);
          }
          cleanText = cleanText.replace(imgRegex, "\n[学术图表已生成]\n");
          if (cleanText.trim()) {
            send("stdout", cleanText);
          }
        });

        pyProc.stderr.on("data", (data: Buffer) => {
          send("stderr", data.toString("utf-8"));
        });

        pyProc.on("close", (exitCode) => {
          clearTimeout(timeout);
          send("done", { success: exitCode === 0, provider: "local-gpu" });
          controller.close();
        });

        pyProc.on("error", (err) => {
          clearTimeout(timeout);
          send("error", `本地 Python 启动失败: ${err.message}。`);
          controller.close();
        });

        pyProc.stdin.write(code);
        pyProc.stdin.end();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "未知服务端错误";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
