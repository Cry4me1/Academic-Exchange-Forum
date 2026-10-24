import { chromium } from 'playwright';
import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function renderVideo() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0) {
    console.log(`
用法:
  node scripts/render_video.mjs <html文件路径> [输出mp4路径] [录制时长秒数] [分辨率] [--fps 60] [--audio 音频路径]

示例:
  node scripts/render_video.mjs demo/scholarly_reveal.html output/scholarly_reveal.mp4 10 1920x1080 --audio output/scholarly_reveal_audio.wav
    `);
    process.exit(1);
  }

  // 解析可选命名参数 (--fps, --audio) 与位置参数
  const positional = [];
  let fps = 60;
  let audioPath = null;

  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === '--fps' && rawArgs[i + 1]) {
      fps = parseInt(rawArgs[++i], 10);
    } else if (rawArgs[i] === '--audio' && rawArgs[i + 1]) {
      audioPath = path.resolve(process.cwd(), rawArgs[++i]);
    } else {
      positional.push(rawArgs[i]);
    }
  }

  const inputHtml = path.resolve(process.cwd(), positional[0]);
  if (!fs.existsSync(inputHtml)) {
    console.error(`错误: 找不到输入 HTML 文件: ${inputHtml}`);
    process.exit(1);
  }

  const defaultOutput = path.join(process.cwd(), 'output', `${path.basename(inputHtml, '.html')}.mp4`);
  const outputMp4 = path.resolve(process.cwd(), positional[1] || defaultOutput);
  const durationSec = parseFloat(positional[2] || '10');
  const resolutionStr = positional[3] || '1920x1080';
  const [width, height] = resolutionStr.split('x').map(n => parseInt(n, 10));

  const outputDir = path.dirname(outputMp4);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`🚀 启动 Opus 渲染引擎...`);
  console.log(`📄 输入文件: ${inputHtml}`);
  console.log(`⏱️  目标时长: ${durationSec} 秒 @ ${fps} FPS (${Math.round(durationSec * fps)} 帧)`);
  console.log(`📐 分辨率:   ${width}x${height}`);
  if (audioPath && fs.existsSync(audioPath)) {
    console.log(`🎵 混流音轨: ${audioPath}`);
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--enable-gpu',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--allow-file-access-from-files'
    ]
  });

  // 先检测页面是否支持 __RENDER_FRAME__ 确定性逐帧步进渲染
  const probeContext = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1
  });
  const probePage = await probeContext.newPage();
  const baseFileUrl = 'file:///' + inputHtml.replace(/\\/g, '/').replace(/^\/+/, '');
  const exportUrl = `${baseFileUrl}?export=1`;

  console.log(`🌐 正在加载场景: ${exportUrl}`);
  await probePage.goto(exportUrl, { waitUntil: 'load', timeout: 30000 });

  // 等待字体与场景就绪
  await probePage.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    if (window.__WAIT_READY__) {
      await window.__WAIT_READY__();
    }
  });
  await probePage.waitForTimeout(300);

  const supportsDeterministic = await probePage.evaluate(() => typeof window.__RENDER_FRAME__ === 'function');

  if (supportsDeterministic) {
    console.log(`✨ 检测到确定性时间轴接口 __RENDER_FRAME__(t)，启用 100% 零掉帧逐帧直出管线...`);
    const totalFrames = Math.round(durationSec * fps);

    const ffmpegArgs = [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-framerate', String(fps),
      '-i', '-'
    ];

    if (audioPath && fs.existsSync(audioPath)) {
      ffmpegArgs.push('-i', audioPath);
    }

    ffmpegArgs.push(
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '16',
      '-pix_fmt', 'yuv420p',
      '-r', String(fps),
      '-movflags', '+faststart'
    );

    if (audioPath && fs.existsSync(audioPath)) {
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
    }

    ffmpegArgs.push(outputMp4);

    const ffmpegProc = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['pipe', 'ignore', 'pipe']
    });

    let ffmpegErr = '';
    ffmpegProc.stderr.on('data', chunk => {
      ffmpegErr += chunk.toString();
    });

    const ffmpegDone = new Promise((resolve, reject) => {
      ffmpegProc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg 退出码 ${code}:\n${ffmpegErr.slice(-1200)}`));
      });
      ffmpegProc.on('error', reject);
    });

    const startMs = Date.now();
    for (let frame = 0; frame < totalFrames; frame++) {
      const t = frame / fps;
      await probePage.evaluate((timeSec) => {
        window.__RENDER_FRAME__(timeSec);
      }, t);

      const jpegBuffer = await probePage.screenshot({
        type: 'jpeg',
        quality: 96,
        animations: 'allow'
      });

      const canContinue = ffmpegProc.stdin.write(jpegBuffer);
      if (!canContinue) {
        await new Promise(r => ffmpegProc.stdin.once('drain', r));
      }

      if ((frame + 1) % 60 === 0 || frame === totalFrames - 1) {
        const pct = (((frame + 1) / totalFrames) * 100).toFixed(0);
        const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
        console.log(`🎬 已渲染 ${frame + 1}/${totalFrames} 帧 (${pct}%) - 耗时 ${elapsed}s`);
      }
    }

    ffmpegProc.stdin.end();
    await ffmpegDone;

    await probePage.close();
    await probeContext.close();
    await browser.close();
  } else {
    // 兼容未实现 __RENDER_FRAME__ 的普通实时动画 HTML
    console.log(`📹 使用实时无头录制模式...`);
    await probePage.close();
    await probeContext.close();

    const tempDir = path.join(outputDir, '.temp_record_' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    const recContext = await browser.newContext({
      recordVideo: { dir: tempDir, size: { width, height } },
      viewport: { width, height }
    });
    const recPage = await recContext.newPage();
    await recPage.goto(exportUrl, { waitUntil: 'load' });
    await recPage.waitForTimeout(400);
    console.log(`🔴 正在实时录制 ${durationSec} 秒动画...`);
    await recPage.waitForTimeout(durationSec * 1000);

    await recPage.close();
    await recContext.close();
    await browser.close();

    const videoFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
    if (videoFiles.length === 0) {
      throw new Error('未找到录制的视频文件');
    }
    const rawWebm = path.join(tempDir, videoFiles[0]);
    const audioInput = audioPath && fs.existsSync(audioPath) ? `-i "${audioPath}" -c:a aac -b:a 192k -shortest` : '';
    const ffmpegCmd = `ffmpeg -y -i "${rawWebm}" ${audioInput} -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r ${fps} -movflags +faststart "${outputMp4}"`;
    execSync(ffmpegCmd, { stdio: 'inherit' });
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  const stats = fs.statSync(outputMp4);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n🎉 视频渲染成功导出！`);
  console.log(`📁 视频保存至: ${outputMp4} (${sizeMb} MB)`);
}

renderVideo().catch(err => {
  console.error('渲染失败:', err);
  process.exit(1);
});
