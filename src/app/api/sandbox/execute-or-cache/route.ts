import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Sandbox, OutputMessage, Result } from "@e2b/code-interpreter";
import { spawn } from "child_process";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

export const maxDuration = 60; // 允许最长 60 秒运行

// 标准化代码文本并生成 SHA-256 指纹
function computeCodeHash(code: string): string {
  const normalized = code.trim().replace(/\r\n/g, "\n");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

// 自动侦测本地最佳 Python 解释器 (优先调用系统带有 CUDA GPU 加速的 PyTorch 环境)
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

// GET: 快速检测代码是否已被全站任何人运行过（轻量探针）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hash = searchParams.get("hash");

    if (!hash) {
      return Response.json({ error: "缺少 hash 参数" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: cached } = await supabase
      .from("code_execution_cache")
      .select("code_hash, first_run_user_name, execution_time_ms, created_at, hit_count, images")
      .eq("code_hash", hash)
      .maybeSingle();

    if (cached) {
      return Response.json({
        hasCached: true,
        first_run_user_name: cached.first_run_user_name,
        execution_time_ms: cached.execution_time_ms,
        created_at: cached.created_at,
        hasImages: Array.isArray(cached.images) && cached.images.length > 0,
      });
    }

    return Response.json({ hasCached: false });
  } catch {
    return Response.json({ hasCached: false });
  }
}

// POST: 核心执行或命中缓存直接返回
export async function POST(req: NextRequest) {
  try {
    const { code, forceRerun } = await req.json();

    if (!code || typeof code !== "string") {
      return Response.json({ error: "代码内容不能为空" }, { status: 400 });
    }

    const codeHash = computeCodeHash(code);
    const supabase = await createClient();

    // 1. 缓存优先判定：若已有任何学者运行过，且未强制重跑，直接返回快照
    if (!forceRerun) {
      const { data: cached } = await supabase
        .from("code_execution_cache")
        .select("*")
        .eq("code_hash", codeHash)
        .maybeSingle();

      if (cached) {
        // 异步更新访问热度
        supabase.rpc("increment_code_cache_hits", { target_hash: codeHash }).then();

        return Response.json({
          cached: true,
          stdout: cached.stdout,
          stderr: cached.stderr,
          images: cached.images || [],
          execution_time_ms: cached.execution_time_ms,
          first_run_at: cached.created_at,
          first_run_user_name: cached.first_run_user_name,
          hit_count: (cached.hit_count || 1) + 1,
        });
      }
    }

    // 2. 静态安全检查
    const dangerousPatterns = [
      /import\s+os\s*;\s*os\.system/i,
      /subprocess\./i,
      /shutil\.rmtree/i,
      /__import__\(['"]os['"]\)\.system/i,
      /open\(['"]\/etc\//i,
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return Response.json(
          { error: "安全审计拦截: 检测到禁止执行的高危系统调用。" },
          { status: 403 }
        );
      }
    }

    // 3. 获取触发本次运算的用户信息 (用于成果署名)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let runnerName = "学术同行";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", user.id)
        .maybeSingle();
      runnerName = profile?.full_name || profile?.username || "论坛学者";
    }

    let stdoutResult = "";
    let stderrResult = "";
    const imagesResult: string[] = [];
    const startTime = Date.now();

    // 4. 执行代码运算 (优先本地原生 GPU/CUDA 运行时，或者已配置的 E2B 云端沙盒)
    const apiKey = process.env.E2B_API_KEY;

    if (apiKey) {
      let sandbox: Sandbox | null = null;
      try {
        const template = process.env.E2B_TEMPLATE_ID || undefined;
        sandbox = template ? await Sandbox.create(template) : await Sandbox.create();

        const execution = await sandbox.runCode(code, {
          onStdout: (out: OutputMessage) => {
            stdoutResult += out.line + "\n";
          },
          onStderr: (err: OutputMessage) => {
            stderrResult += err.line + "\n";
          },
          onResult: (res: Result) => {
            if (res.png) imagesResult.push(res.png);
          },
        });

        if (execution.results) {
          for (const res of execution.results) {
            if (res.png && !imagesResult.includes(res.png)) {
              imagesResult.push(res.png);
            }
          }
        }

        if (execution.error) {
          stderrResult += `${execution.error.name}: ${execution.error.value}\n${execution.error.traceback || ""}\n`;
        }
      } finally {
        if (sandbox) {
          try {
            await sandbox.kill();
          } catch {
            // 忽略销毁断开
          }
        }
      }
    } else {
      // 本地真机独立显卡 (NVIDIA CUDA 12.4 + PyTorch) 0成本极速运行
      await new Promise<void>((resolve) => {
        const pyExecutable = getLocalPythonPath();
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
          env: { ...process.env, PYTHONUNBUFFERED: "1", PYTHONIOENCODING: "utf-8" },
        });

        const timer = setTimeout(() => {
          pyProc.kill("SIGKILL");
          stderrResult += "\n[超时中断] 代码运行超过 30 秒上限。";
          resolve();
        }, 30000);

        pyProc.stdout.on("data", (d: Buffer) => {
          const t = d.toString("utf-8");
          const imgRegex = /\[SANDBOX_IMAGE:([^\]]+)\]/g;
          let m;
          let clean = t;
          while ((m = imgRegex.exec(t)) !== null) {
            imagesResult.push(m[1]);
          }
          clean = clean.replace(imgRegex, "");
          stdoutResult += clean;
        });

        pyProc.stderr.on("data", (d: Buffer) => {
          stderrResult += d.toString("utf-8");
        });

        pyProc.on("close", () => {
          clearTimeout(timer);
          resolve();
        });

        pyProc.on("error", (e) => {
          clearTimeout(timer);
          stderrResult += `启动运行环境失败: ${e.message}`;
          resolve();
        });

        pyProc.stdin.write(code);
        pyProc.stdin.end();
      });
    }

    const durationMs = Date.now() - startTime;

    // 5. 将本次首次计算结果持久化保存至数据库快照
    const normalizedCode = code.trim().replace(/\r\n/g, "\n");
    await supabase.from("code_execution_cache").upsert(
      {
        code_hash: codeHash,
        language: "python",
        code_snippet: normalizedCode,
        first_run_by: user?.id || null,
        first_run_user_name: runnerName,
        stdout: stdoutResult.trim(),
        stderr: stderrResult.trim(),
        images: imagesResult,
        execution_time_ms: durationMs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code_hash" }
    );

    return Response.json({
      cached: false,
      stdout: stdoutResult.trim(),
      stderr: stderrResult.trim(),
      images: imagesResult,
      execution_time_ms: durationMs,
      first_run_at: new Date().toISOString(),
      first_run_user_name: runnerName,
      hit_count: 1,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "内部异常";
    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
